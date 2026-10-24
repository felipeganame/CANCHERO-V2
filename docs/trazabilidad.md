# Trazabilidad: requisito → regla de negocio → caso de prueba → defecto

Repositorio: https://github.com/felipeganame/CANCHERO-V2
Pipeline: https://github.com/felipeganame/CANCHERO-V2/actions
SonarCloud: https://sonarcloud.io/project/overview?id=felipeganame_CANCHERO-V2

## Matriz RN → casos de prueba

| Regla | Descripción | Casos de prueba (nivel) |
|---|---|---|
| RN-01 | No dos reservas confirmadas en el mismo turno (concurrencia) | CP-041 (unit), CP-110 (integración, Postgres real), CP-120 (componente), CP-153 (API) |
| RN-02 | No reservar un turno pasado o ya empezado | CP-010 a CP-013 (unit, clases de equivalencia + límite), CP-042 (unit) |
| RN-03 | Turno alineado y dentro del horario del club | CP-020 a CP-024 (unit, tabla de decisión), CP-043 (unit) |
| RN-04 | No reservar una cancha deshabilitada | CP-044 (unit), CP-232 (API) |
| RN-05 | Deshabilitar cancela solo reservas futuras, en transacción | CP-060 (unit), CP-111 (integración, Postgres real), CP-180 (API) |
| RN-06 | Precio entero, 1-200.000 | CP-030 a CP-037 (unit, límites), CP-071, CP-130, CP-131, CP-173, CP-182 (componente/API) |
| RN-07 | El jugador cancela sus propias reservas futuras | CP-050 (unit), CP-140 (componente), CP-162 (API) |
| RN-08 | Scoping por dueño/club (jugador ve lo suyo, admin ve su club) | CP-051, CP-061 (unit), CP-161, CP-171, CP-181, CP-241 (API) |
| RN-09 | El precio se congela al confirmar la reserva | CP-040 (unit) |
| RN-10 | Búsqueda: solo clubes con canchas activas, con turno libre | CP-100 a CP-102 (unit) |

## Requisito → flujo E2E

| Flujo | Caso | Nivel | Entorno |
|---|---|---|---|
| Jugador: buscar → elegir turno → login → confirmar → ver en Mis reservas → cancelar | CP-200 | E2E (Playwright) | QA real (`canchero-qa.vercel.app`) |
| Club: login → crear cancha → verla en el panel → deshabilitarla | CP-210 | E2E (Playwright) | QA real (`canchero-qa.vercel.app`) |
| Home carga / `/api/health` responde ok | CP-001, CP-002 | Smoke (Playwright) | QA y producción, post-deploy |

## Defecto → caso que lo encontró → caso de regresión

| Defecto | Encontrado por | Regresión permanente |
|---|---|---|
| DEF-01: `SlotTakenError` nunca se lanzaba (el driver envuelve el código de error en `.cause`) | `tests/integration/booking-repository.test.ts` (Testcontainers, Postgres real) | CP-110 |
| DEF-02: `/buscar` no propagaba `?fecha=` al link "Ver turnos", reservando siempre contra hoy | `tests/e2e/player-flow.spec.ts` (QA real) | CP-200 |
| DEF-03: promesa sin manejar en `buscar-results.tsx` (`useEffect` + `Promise.all().then()` sin `.catch()`/`void`) | SonarCloud (análisis estático, regla `typescript:S9383`) | Quality gate de Sonar (bloquea si reaparece) |
| DEF-04: pool de conexiones de Postgres agotado bajo carga concurrente (pooler en modo sesión, no transacción) | `tests/e2e/*.spec.ts` corriendo contra QA real, de forma intermitente | CP-200, CP-210 (si el pool se agota, vuelven a fallar) |

Detalle completo de cada defecto (pasos, causa raíz, corrección) en `docs/defectos.md`.

## Por qué importa esta tabla

Cada defecto real que encontramos este desarrollo lo detectó una herramienta
distinta de la pirámide de pruebas:

- DEF-01 — una prueba de **integración** contra Postgres real (no la
  hubieran encontrado los tests unitarios con dobles de prueba, porque el
  doble no reproduce el comportamiento real del driver `postgres-js`).
- DEF-02 y DEF-04 — pruebas **E2E** contra un entorno real desplegado (no
  se ven en local ni con mocks: DEF-02 necesita el flujo de navegación
  real entre páginas, DEF-04 necesita el pooler compartido real de
  Supabase, que no existe en Postgres local).
- DEF-03 — **análisis estático**, no una prueba dinámica: el código
  "funcionaba" en todos los casos que ejercitábamos, el problema es la
  forma del código ante casos no ejercitados.

Es el argumento central del eje "Automatización del testing" del TP: una
sola capa de pruebas no alcanza, cada una encuentra una clase de defecto
distinta.
