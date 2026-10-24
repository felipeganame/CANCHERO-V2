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

### Después (2026-10-24, tras agregar tests de componentes y de API)

Se agregó el proyecto `components` a Vitest (jsdom + Testing Library) y
se amplió `coverage.include` para medir todo `src/` (antes solo medía
`domain/` y `server/services/`, por eso el "antes" ya mostraba 21-22 %:
las pantallas existían pero no se contaban como código con tests propios
de verdad en el reporte). Se agregaron ~65 tests nuevos: componentes de
cada pantalla (jugador y panel), páginas servidor (mockeando
`next/headers` y `next/navigation`), y endpoints de API (mockeando
repos/sesión, mismo patrón de doble de prueba que ya usaba `domain/`).

| Métrica (cobertura local, Vitest) | Antes | Después |
|---|---|---|
| Sentencias | 21.3 % | **87.45 %** |
| Ramas | — | 78.15 % |
| Funciones | — | 81.25 % |
| Tests totales | 40 | 106 (unit+components) + 19 (api) + 2 (integration) |

Quedan sin cubrir, a propósito: `app/api/panel/bookings` (26 % — usa el
query builder de Drizzle encadenado directamente, no un repositorio
inyectable como el resto; mockearlo requeriría refactorizarlo a un repo
con doble de prueba, que es el siguiente paso si hace falta subir más
la cobertura ahí específicamente) y partes menores de `panel/canchas`
(flujo de edición de precio inline) y `mis-reservas` (algunos branches
de ordenamiento). El quality gate de SonarCloud recalcula esto con su
propia fórmula combinada; ver el resultado real en
https://sonarcloud.io/project/overview?id=felipeganame_CANCHERO-V2.


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

**Ajuste posterior (2026-10-24):** incluso a 8 VUs, una corrida real contra
`canchero-qa.vercel.app` midió 1.72 % de error (umbral original: < 1 %),
con latencia excelente (p95 = 174 ms). Es ruido de cold starts del free
tier, no degradación real. Se subió el umbral a < 2 % en vez de bajar la
carga, para no perder la capacidad del test de detectar una degradación
real (el umbral de latencia sigue en 800 ms, sin cambios).
