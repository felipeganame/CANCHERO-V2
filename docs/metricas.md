# Métricas

## Análisis estático (SonarCloud)

**Proyecto:** https://sonarcloud.io/project/overview?id=felipeganame_CANCHERO-V2

### Antes (2026-10-23, antes de DEF-03 y la deduplicación)

| Métrica | Valor |
|---|---|
| Quality gate | **Failed** (2 condiciones) |
| Bugs | 1 (MAJOR, reliability) |
| Vulnerabilidades | 0 |
| Security hotspots | 0 |
| Code smells | 68 |
| Duplicación | 0.7 % |
| Cobertura (overall) | 21.3 % |
| Cobertura sobre código nuevo | 22.1 % (umbral: 80 %) |
| Reliability rating (nuevo código) | C (umbral: A) |
| Security rating | A |
| Maintainability rating | A |

### DEF-03: promesa sin manejar en `buscar-results.tsx`

**Regla:** `typescript:S9383` (reliability, MEDIUM impact)
**Encontrado por:** SonarCloud, no por los tests (ningún test E2E llegó a
disparar el camino de error real; es un issue de *análisis estático*, no
de comportamiento observado).

**Descripción:** el `useEffect` que carga disponibilidad por club armaba
una cadena `Promise.all(...).then(...)` sin `.catch()`, `await` ni marca
explícita de "ignorado a propósito". Si el array de resultados de
`Promise.all` llegaba a rechazar (ninguno de los casos actuales lo hace,
porque cada promesa individual ya atrapa sus errores, pero el patrón en sí
es fragil ante cambios futuros), el rechazo quedaba sin manejar.

**Corrección:** se envolvió la lógica en una función async autoejecutada
marcada explícitamente con `void`, dejando claro que no se espera su
resultado y que cualquier excepción queda contenida.

**Por qué no lo encontró ningún test:** es exactamente el tipo de defecto
que las pruebas dinámicas (unitarias, integración, E2E) no detectan bien
porque requieren observar un *comportamiento* incorrecto; acá el problema
es la *forma* del código (robustez ante casos no ejercitados), que es el
terreno del análisis estático. Justifica tener ambas herramientas en el
pipeline, no una sola.

### Deduplicación

Las funciones `formatHour`/`formatPrice`/`formatDateLabel` estaban
copiadas, carácter por carácter, en `buscar-results.tsx`, `club-view.tsx`
y `reservar-view.tsx` (la conversión UTC → America/Argentina/Cordoba
repetida 3 veces). Se centralizaron en `src/lib/format.ts` con 7 tests
unitarios nuevos.

### Pendiente: cobertura sobre código nuevo

Las pantallas (jugador y panel de club) no tienen tests propios todavía —
solo `domain/` y `server/services/` los tiene (100 % sentencias, 91.8 %
ramas). El pipeline ahora **bloquea** si el quality gate de Sonar falla
(antes solo corría el análisis sin chequear el resultado), así que esto
queda expuesto como una ejecución roja real y documentada, no oculta.
Plan: agregar tests de componentes (`@testing-library/react`) para las
pantallas de mayor tamaño (`reservar-view.tsx`, `panel/canchas/page.tsx`,
`buscar-results.tsx`) hasta volver a verde.


## Stress: límite de concurrencia en Vercel Hobby (free tier)

**Fecha:** 2026-10-22
**Entorno:** QA (`canchero-qa`, Vercel preview deployment)
**Script:** `tests/load/search.js`, ejecutado manualmente con 20 VUs constantes
durante 1 min contra `/api/health`.

| Métrica | Resultado |
|---|---|
| VUs | 20 |
| Requests totales | 1473 |
| Tasa de error | 8.89 % (umbral: < 1 %) |
| p(95) de duración | 887 ms (umbral: < 800 ms) |

**Interpretación:** el plan gratuito de Vercel limita la concurrencia de
funciones serverless; a partir de ~10-15 VUs simultáneos contra una sola
función aparecen 5xx/timeouts. No es un defecto de la aplicación: es un
límite real de infraestructura del entorno gratuito.

**Decisión:** el gate de cada deploy en el pipeline usa una carga de 8 VUs
(dentro de la capacidad sostenida del free tier, ver `tests/load/search.js`).
La corrida de 20 VUs queda documentada acá como evidencia de stress real
con resultados y umbrales, tal como pide el nivel 2/3 del TP.
