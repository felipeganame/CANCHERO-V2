# Integración externa

## Integración principal declarada: Supabase (PostgreSQL como servicio)

Canchero usa Supabase como base de datos gestionada tanto en QA como en
producción (dos proyectos separados, con datos completamente aislados):

- **Producción:** `zmaogbldmtivospebwxr` → `canchero-puce.vercel.app`
- **QA:** `sqwitlexpcwowazzytpu` → `canchero-qa.vercel.app`

### Contrato

El contrato es el schema de Drizzle (`src/server/db/schema.ts`) +
migraciones versionadas (`drizzle/`). La aplicación nunca accede a
Supabase directamente: todo pasa por repositorios con interfaz propia
(`src/server/repositories/types.ts`) con dos implementaciones:

- **Real:** `Drizzle*Repository` (Postgres real vía `postgres-js`)
- **Falsa (doble de prueba):** `Fake*Repository` (`src/server/repositories/fakes.ts`),
  usada en los 106 tests unitarios/de componente

### Pruebas de contrato (contra el doble)

Los 106 tests unitarios usan los repositorios falsos para probar las
reglas de negocio sin depender de infraestructura. Ejemplo: RN-01
(CP-041) prueba que `reserveSlot` lanza `SlotTakenError` cuando el doble
de prueba simula un conflicto, sin tocar una base real.

### Prueba contra el entorno real

`tests/integration/booking-repository.test.ts` corre contra **Postgres
real** (vía Testcontainers, no un mock) para dos casos que un doble de
prueba no puede reproducir fielmente:

- **CP-110** [RN-01]: el índice único parcial de Postgres
  (`bookings_court_slot_confirmed_idx`) rechaza la segunda reserva
  simultánea — esto encontró **DEF-01** (el error real de Postgres venía
  envuelto en `.cause` por el driver, y el código no lo revisaba ahí).
- **CP-111** [RN-05]: deshabilitar una cancha cancela sus reservas
  futuras en una transacción real, sin tocar las pasadas.

Además, cada deploy a QA corre contra el proyecto Supabase de QA real
(no un contenedor efímero): las migraciones (`pnpm db:migrate`), el seed
de cuentas de prueba (`pnpm db:seed:e2e`) y los 2 flujos E2E completos
(CP-200, CP-210) se ejecutan contra esa base real en cada push al
repositorio.

**`tests/integration-qa/booking-repository.test.ts`** repite las mismas
dos reglas (CP-112/CP-113, equivalentes a CP-110/CP-111) pero contra el
proyecto Supabase de QA real en vez de Testcontainers — corre en la
etapa `deploy-qa` del pipeline, justo después de migrar y sembrar la
base, con `DATABASE_URL` apuntando al Supabase real (`secrets.QA_DATABASE_URL`).
Usa IDs únicos por corrida y borra todo lo que crea en `afterAll`,
porque a diferencia del contenedor esta base es compartida y
persistente. Es la integración "probada contra entorno real" que pide
la tabla de metas del TP, en un nivel más estricto que Testcontainers:
corre contra el proveedor real (Supabase), no contra un Postgres
genérico levantado en el runner.

### Contingencia

Si Supabase no responde, `/api/health` devuelve 503 y el smoke test del
pipeline lo detecta antes de promover a producción (ver
`docs/objetivos-calidad.md`).

### Defecto real encontrado en esta integración

**DEF-04** (ver `docs/defectos.md`): el pooler de conexiones de Supabase
en modo sesión se agotaba (límite de 15 clientes del free tier) bajo
carga concurrente real (tests E2E en paralelo + cold starts de Vercel).
Se corrigió cambiando a modo transacción (puerto 6543), que es lo que
Supabase recomienda explícitamente para entornos serverless. Esto nunca
se hubiera encontrado contra un doble de prueba o contra Postgres local
sin pooler — es evidencia directa del valor de probar contra el entorno
real.

## Integraciones secundarias

### Vercel (deploy)

Dos entornos (QA y producción) con URLs fijas y legibles
(`canchero-qa.vercel.app`, `canchero-puce.vercel.app`), desplegados
automáticamente por el pipeline en cada push. El quality gate de
SonarCloud y las pruebas de QA (smoke, E2E, k6) corren contra el deploy
de QA real antes de que el pipeline autorice el deploy a producción.

### Resend (email transaccional)

Cliente con interfaz propia (`src/integrations/email/types.ts`) con
implementación real (`ResendSender`, timeout de 5s vía `Promise.race`) y
doble de prueba (`FakeEmailSender`). Usado para notificaciones de
reserva confirmada/cancelada (`src/integrations/email/templates.ts`).
Si Resend falla o es lento, la reserva se confirma igual (el email no es
bloqueante).
