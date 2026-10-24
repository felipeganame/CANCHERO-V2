# QA vs QC: prácticas aplicadas en este proyecto

La distinción: **QA (aseguramiento)** son las prácticas de *proceso* que
previenen que entren defectos; **QC (control)** es la *verificación* de
que el producto construido cumple lo esperado. Este proyecto aplicó
ambas desde el primer commit, no al final.

## Prácticas de QA (proceso, preventivo)

| Práctica | Cómo se aplicó |
|---|---|
| TDD (test primero, código después) | Cada regla de negocio (RN-01 a RN-10) se implementó escribiendo el test en rojo antes del código, verificado explícitamente en cada ciclo (ver historial de commits) |
| Arquitectura en capas que facilita testear sin infraestructura | `domain/` es lógica pura sin I/O; `server/services/` recibe repositorios como dependencia inyectada, con una implementación real (Drizzle) y una falsa (doble de prueba) por cada una |
| Quality gate automático que bloquea el pipeline | SonarCloud: bugs críticos, duplicación > 5%, cobertura sobre código nuevo < 80% — cualquiera de esos para la build, no hay forma de saltarlo |
| Revisión de diseño antes de implementar pantallas | Los `.dc.html` en `design/` se usaron como contrato de comportamiento, no solo visual, antes de escribir cada pantalla |
| Convención de nombres con trazabilidad | Cada test lleva su ID (`CP-xxx [RN-xx]`) desde que se escribe, no se agrega después |

## Prácticas de QC (producto, verificación)

| Práctica | Cómo se aplicó |
|---|---|
| Pruebas unitarias | 106 tests (`domain/`, `server/services/`, `lib/validation/`, componentes React) |
| Pruebas de integración contra infraestructura real | Testcontainers con Postgres 17 real (no mock) para RN-01 (índice único) y RN-05 (transacción) |
| Pruebas de API | 32 tests contra los route handlers reales, con dobles de prueba para los repositorios |
| Pruebas E2E contra un entorno desplegado real | 2 flujos completos (jugador y club admin) contra `canchero-qa.vercel.app`, no contra localhost ni contra mocks |
| Pruebas de stress con umbrales | k6 contra QA real, con umbrales de latencia y tasa de error documentados y ajustados a mediciones reales, no a números arbitrarios |
| Análisis estático | SonarCloud en cada push, encontró un bug real (DEF-03) que ningún test dinámico hubiera detectado |
| Smoke post-deploy | Verifica que el home carga y `/api/health` responde antes de considerar el deploy exitoso |

## Por qué la distinción importa para este TP

El error típico de un prototipo es hacer solo QC al final ("¿funciona? sí,
listo"). Acá el pipeline hace QA en cada push (nadie puede mergear código
sin tests, sin pasar el análisis estático, sin cobertura mínima) **y**
QC en cada nivel de la pirámide. La prueba de que esto no es cosmético:
encontramos 4 defectos reales durante el desarrollo normal (no
"fabricados" para la entrega), cada uno detectado por una práctica
distinta — eso es exactamente lo que QA+QC combinados deberían producir.
