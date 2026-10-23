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
