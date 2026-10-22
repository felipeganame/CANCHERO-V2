# Métricas

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
