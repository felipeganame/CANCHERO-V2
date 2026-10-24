# Plan de pruebas

**Versión:** 1.0 — 2026-10-24
**Proyecto:** Canchero — plataforma de reserva de canchas deportivas
**Repositorio:** https://github.com/felipeganame/CANCHERO-V2

## Alcance

Cubre las 10 reglas de negocio del dominio de reservas (RN-01 a RN-10,
ver PLAN.md sección 5), los dos flujos principales de usuario (jugador y
club admin) y la integración con los 3 servicios externos (Supabase,
Vercel, Resend). No cubre: login real con Google (pendiente de
credenciales), accesibilidad automatizada (Axe/Lighthouse, pendiente),
ni pruebas cross-browser más allá de Chromium.

## Niveles de prueba y herramientas

| Nivel | Herramienta | Qué cubre | Cantidad actual |
|---|---|---|---|
| Unitario | Vitest | `domain/`, `server/services/`, `lib/validation/`, componentes React (con React Testing Library + jsdom) | 106 tests |
| API | Vitest + Next.js route handlers reales | Cada endpoint: códigos de estado, validaciones, permisos (RN-08), con repositorios falsos | 32 tests |
| Integración | Vitest + Testcontainers (Postgres 17 real) | Índice único (RN-01), transacción de cancelación (RN-05) | 2 tests |
| E2E | Playwright | Flujo completo de jugador y de club admin, contra QA real desplegado | 2 flujos (CP-200, CP-210) |
| Smoke | Playwright | Home carga, `/api/health` responde, post-deploy en QA y producción | 2 tests (CP-001, CP-002) |
| Stress / esfuerzo sostenido | k6 | Latencia y tasa de error bajo carga concurrente contra QA real | 1 script en el gate (`search.js`), 2 adicionales escritos (`booking-race.js`, `soak.js`) |
| Análisis estático | SonarCloud | Bugs, vulnerabilidades, code smells, duplicación, cobertura sobre código nuevo | Quality gate bloqueante en cada push |

## Entornos

| Entorno | URL | Base de datos | Uso |
|---|---|---|---|
| Local | `localhost:3000` | Postgres local (sin pooler) | Desarrollo día a día |
| QA / Staging | `canchero-qa.vercel.app` | Supabase `canchero-qa` (aislada de prod) | Smoke, E2E, stress — gate antes de producción |
| Producción | `canchero-puce.vercel.app` | Supabase `canchero` | Usuarios reales (pendiente login de Google) |

## Criterios de entrada

- El código compila (`pnpm build`), pasa lint y typecheck.
- Los tests unitarios, de integración y de API pasan localmente antes
  de hacer push.
- Toda funcionalidad nueva tiene al menos un test con ID trazable
  (`CP-xxx [RN-xx]` cuando aplica una regla de negocio).

## Criterios de salida (por etapa del pipeline)

1. **Calidad y tests unitarios:** lint + typecheck + build + cobertura +
   quality gate de SonarCloud en verde. Si el quality gate falla, el
   pipeline se detiene ahí — no se despliega nada.
2. **Deploy a QA:** migración de base exitosa (con reintentos ante
   fallas transitorias del pooler) y deploy de Vercel exitoso.
3. **Verificación en QA:** smoke + E2E + stress todos en verde contra el
   deploy real de QA.
4. **Deploy a producción:** solo si las 3 etapas anteriores pasaron, y
   solo en push a `main`. Smoke post-deploy final contra producción.

## Diseño de casos

Clases de equivalencia, valores límite y tablas de decisión aplicados
sistemáticamente en las reglas con rangos o estados (ver
`docs/trazabilidad.md` para el detalle completo por regla):

- **RN-02** (turno pasado): hace 1 minuto, exactamente ahora, en 1
  minuto, mañana — CP-010 a CP-013.
- **RN-03** (horario y alineación): dentro de horario alineado, no
  alineado, antes de apertura, último turno del día, justo después del
  cierre — CP-020 a CP-024 (tabla de decisión: hora × alineación ×
  dentro de rango → válido/inválido).
- **RN-06** (precio): 0 (límite inválido), 1 (límite válido), negativo,
  tope (200.000, límite válido), tope+1 (límite inválido), no numérico,
  vacío, decimal — CP-030 a CP-037.

## Comandos

```
pnpm test:unit     # unitarios + componentes (jsdom)
pnpm test:api      # API, con repos falsos
pnpm test:int      # integración, Testcontainers (requiere Docker)
pnpm test:e2e       # E2E, requiere BASE_URL apuntando a un deploy real
pnpm test:smoke     # smoke, idem
pnpm test:load      # stress (k6), requiere BASE_URL
pnpm test:all       # unit + int + api
pnpm coverage       # cobertura combinada (lcov, usada por SonarCloud)
```
