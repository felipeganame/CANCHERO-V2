# Herramienta nueva incorporada: k6

Proceso de cinco pasos (requisitos → mercado → prueba de concepto →
matriz de decisión → despliegue incremental) para justificar por qué k6
entra al proyecto como herramienta de stress y esfuerzo sostenido.

## 1. Requisitos

El TP exige evidencia de stress testing con resultados y umbrales
(nivel 2/3), integrado al pipeline de CI/CD. Necesitábamos una
herramienta que:
- Corra sin interfaz gráfica, scripteable, apta para GitHub Actions.
- Soporte umbrales que hagan fallar el job automáticamente (no solo
  "mirar un gráfico").
- Tenga una curva de aprendizaje chica para el tiempo disponible.
- Sea gratuita.

## 2. Mercado (alternativas evaluadas)

| Herramienta | Pros | Contras |
|---|---|---|
| **k6** (Grafana) | Scripts en JS (sin curva de aprendizaje nueva), umbrales nativos que fallan el proceso, acción oficial de GitHub (`grafana/setup-k6-action`), gratis y open source | Sin UI gráfica (no la necesitábamos) |
| Apache JMeter | Muy establecido, mucha documentación | XML pesado, UI gráfica pensada para uso manual, integración a CI más artesanal |
| Artillery | También scriptable, YAML/JS | Comunidad más chica, menos umbrales nativos listos para CI |
| Locust (Python) | Scripts en Python | El resto del proyecto es TypeScript; sumar un runtime más no se justificaba |

## 3. Prueba de concepto

Se escribió `tests/load/search.js` contra `/api/health` con 8 VUs
concurrentes durante ~1 minuto, umbrales de `p(95) < 800ms` y
`http_req_failed < 2%`. Resultado real documentado en
`docs/metricas.md`: p(95) = 174ms, dentro del umbral. La corrida de
validación con 20 VUs (fuera del gate normal) encontró el límite real de
concurrencia del free tier de Vercel — un hallazgo genuino, no fabricado.

## 4. Matriz de decisión

| Criterio | Peso | k6 | JMeter | Artillery |
|---|---|---|---|---|
| Integración nativa a GitHub Actions | 3 | 3 | 1 | 2 |
| Umbrales que bloquean el pipeline | 3 | 3 | 2 | 2 |
| Curva de aprendizaje (equipo ya sabe JS/TS) | 2 | 3 | 1 | 3 |
| Costo | 2 | 3 | 3 | 3 |
| **Total ponderado** | | **29** | **17** | **22** |

k6 gana claramente por la integración nativa a CI y porque el equipo ya
escribe TypeScript — reusar ese conocimiento en vez de aprender una
herramienta con su propio lenguaje de configuración.

## 5. Despliegue incremental

1. **Script mínimo** contra `/api/health` (ya hecho, es el gate de cada
   deploy a QA).
2. **`tests/load/booking-race.js`**: ya escrito, apunta a `/api/health`
   como placeholder hasta que el flujo completo de reserva esté
   suficientemente estable en QA para cargarlo sin generar datos de
   prueba descartables en cada corrida; el objetivo real es disparar N
   VUs contra el mismo turno y validar que exactamente 1 gane (RN-01
   bajo carga real, no solo con 2 requests secuenciales como en CP-110).
3. **`tests/load/soak.js`**: script de esfuerzo sostenido (15 min, carga
   moderada constante) ya escrito, pendiente de una primera ejecución
   documentada (nivel 2 del TP pide "un script de carga ejecutado"; el
   de `search.js` ya cumple eso, `soak.js` es la extensión a esfuerzo
   sostenido real).
4. **Siguiente paso:** correr `soak.js` manualmente o vía
   `workflow_dispatch` (ya contemplado en el pipeline, ver PLAN.md
   sección 10) y documentar el resultado en `docs/metricas.md`.
