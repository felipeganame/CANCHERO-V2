# Registro de defectos

## DEF-01: SlotTakenError nunca se lanzaba (RN-01)

**Encontrado por:** `tests/integration/booking-repository.test.ts` (CP-110), corriendo
contra Postgres real vía Testcontainers.

**Pasos:**
1. Crear una reserva confirmada para `court-1` en un horario dado.
2. Intentar crear una segunda reserva confirmada para el mismo `court-1` y mismo horario.

**Esperado:** la segunda inserción lanza `SlotTakenError` (mapea a HTTP 409).

**Obtenido (rojo):** se propagaba `DrizzleQueryError` sin capturar. El código de
`DrizzleBookingRepository.create` revisaba `err.code === '23505'`, pero el driver
`postgres-js` envuelve el error real de Postgres dentro de `err.cause`, no en el
nivel superior del error.

**Causa raíz:** `src/server/repositories/drizzle-booking-repository.ts` no
recorría `err.cause` al detectar el código de violación de unicidad.

**Corrección (verde):** se agregó `hasUniqueViolationCode()`, que recorre
`err.cause` recursivamente buscando `code === '23505'`.

**Regresión:** `tests/integration/booking-repository.test.ts > CP-110` queda
como test de regresión permanente.

## DEF-02: "Ver turnos" no propagaba la fecha elegida en la búsqueda

**Encontrado por:** `tests/e2e/player-flow.spec.ts` (CP-200), corriendo contra
un build de producción real.

**Pasos:**
1. Buscar canchas para una fecha futura (ej. dentro de 30 días) en `/buscar`.
2. Hacer clic en "Ver turnos" de un club con turnos libres ese día.
3. Elegir un turno libre y confirmar la reserva.

**Esperado:** se reserva el turno de la fecha elegida en la búsqueda.

**Obtenido (rojo):** el link `/clubes/[slug]` no incluía `?fecha=`, así que
la página de detalle del club siempre mostraba los turnos de **hoy**. Al
reservar un turno de las 09:00 de hoy (hora ya pasada), la API respondía
422 `PastSlotError` ("No se puede reservar un turno que ya empezó") sin
que la UI explicara por qué, dejando al jugador trabado en el paso de
confirmación.

**Causa raíz:** `src/app/buscar/buscar-results.tsx` construía el `href`
de "Ver turnos" (y el link de respaldo del mapa) sin pasar el parámetro
`fecha` que ya tenía disponible en scope.

**Corrección (verde):** ambos links ahora arman
`` `/clubes/${slug}?fecha=${encodeURIComponent(fecha)}` ``.

**Regresión:** `tests/e2e/player-flow.spec.ts > CP-200` queda como test de
regresión permanente (corre en el pipeline contra el entorno de QA real,
no contra datos simulados).

## DEF-03: promesa sin manejar en la carga de disponibilidad de `/buscar`

**Encontrado por:** SonarCloud (análisis estático, regla `typescript:S9383`),
no por tests dinámicos — ver `docs/metricas.md` para el detalle completo
de por qué este tipo de defecto es terreno del análisis estático.

**Archivo:** `src/app/buscar/buscar-results.tsx`

**Obtenido (rojo):** `Promise.all(...).then(...)` dentro de un `useEffect`
sin `.catch()`, sin `await` y sin marca explícita de ignorado. SonarCloud
lo marca `BUG` (reliability, MAJOR) porque un rechazo de `Promise.all`
quedaría sin manejar.

**Corrección (verde):** se envolvió en una función async autoejecutada
marcada con `void`, dejando explícito que no se espera el resultado.

**Regresión:** no aplica test dinámico (el comportamiento era correcto en
los casos ejercitados); la regresión la cubre el propio quality gate de
SonarCloud, que ahora bloquea el pipeline si reaparece un bug de este tipo.

## DEF-04: agotamiento del pool de conexiones de Postgres bajo carga concurrente

**Encontrado por:** `tests/e2e/*.spec.ts` corriendo contra QA real, de forma
intermitente (2 workers de Playwright en paralelo + el propio deploy
disparando cold starts).

**Síntoma:** reservas y cargas de página que deberían completarse en
segundos quedaban "colgadas" del lado del servidor; Playwright timeouteaba
esperando texto que la página nunca terminaba de renderizar. Un intento
directo de conectarse a la base desde este equipo devolvió el error real:

```
FATAL: (EMAXCONNSESSION) max clients reached in session mode - max
clients are limited to pool_size: 15
```

**Causa raíz:** `DATABASE_URL` usaba el pooler de Supabase en **modo
sesión** (puerto 5432), que reserva una conexión persistente por cliente.
En Vercel, cada invocación de función serverless puede ser una instancia
nueva con su propia conexión `postgres-js`; bajo carga concurrente (varios
jugadores reservando a la vez, tests E2E en paralelo, k6) se superaba el
límite de 15 conexiones del free tier de Supabase, y las requests que no
conseguían conexión quedaban bloqueadas hasta timeout.

**Corrección:** se cambió `DATABASE_URL` (producción y preview, en Vercel)
al pooler en **modo transacción** (puerto 6543, `pgbouncer=true`), que
Supabase recomienda explícitamente para entornos serverless: cada query
toma y libera la conexión en vez de mantenerla abierta, soportando muchos
más clientes concurrentes con el mismo límite de 15. `src/server/db/client.ts`
ya usaba `prepare: false`, requisito para que `postgres-js` funcione en
modo transacción (sin prepared statements).

**Por qué no se vio en desarrollo local:** el entorno local usa Postgres
directo en la máquina del desarrollador, sin pooler ni límite de
conexiones compartido, así que el problema es invisible hasta correr
contra la infraestructura real compartida (otra razón para que el pipeline
tenga una etapa de QA contra un deploy real antes de producción).

**Regresión:** `tests/e2e/player-flow.spec.ts` y `tests/e2e/admin-flow.spec.ts`
corren en cada deploy a QA; si el pool se agota de nuevo, van a volver a
fallar de forma intermitente y visible en el pipeline.
