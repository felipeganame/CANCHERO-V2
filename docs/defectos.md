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
