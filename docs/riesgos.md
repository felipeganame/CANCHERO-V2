# Riesgos (probabilidad × impacto)

Escala: probabilidad e impacto de 1 (bajo) a 3 (alto). Prioridad =
probabilidad × impacto.

| # | Riesgo | Prob. | Impacto | Prioridad | Mitigación |
|---|---|---|---|---|---|
| R1 | Login de producción no funciona (falta Google OAuth) | 3 | 3 | 9 | Bloqueante conocido, documentado en `docs/defectos.md` y en el README de estado. Plan: conseguir credenciales de Google Cloud Console antes de la demo. |
| R2 | Agotamiento del pool de conexiones de Postgres bajo carga real (DEF-04) | 2 | 3 | 6 | Ya mitigado: pooler en modo transacción (puerto 6543) en vez de modo sesión. Test de regresión: CP-200/CP-210 en cada deploy a QA. |
| R3 | Plan gratuito de Vercel limita la concurrencia de funciones serverless | 2 | 2 | 4 | Documentado como hallazgo real de stress (`docs/metricas.md`). Umbral de k6 ajustado a la capacidad real medida, no a un número arbitrario. |
| R4 | Cobertura sobre código nuevo cae por debajo del 80% en un commit futuro | 2 | 2 | 4 | El quality gate de SonarCloud bloquea el pipeline automáticamente (`SonarSource/sonarqube-quality-gate-action` en `ci.yml`); no hay forma de mergear sin cumplirlo. |
| R5 | Datos de prueba (`E2E Temp...`) se acumulan en la base de QA con cada corrida de CI y degradan el rendimiento de las páginas de panel | 2 | 1 | 2 | Detectado durante este desarrollo (contribuyó a la flakiness de DEF-04). Pendiente: job de limpieza periódica o usar una rama/branch de Supabase para QA en vez de reusar la misma base. |
| R6 | Integrantes del equipo no pueden defender individualmente una parte que no escribieron | 2 | 3 | 6 | Cada commit referencia IDs (RN-xx, CP-xx, DEF-xx) y queda documentado en `docs/trazabilidad.md`; este informe explica el funcionamiento completo para que cualquiera pueda repasarlo antes de la defensa. |
| R7 | Falla Resend o Supabase el día de la entrega | 1 | 2 | 2 | Timeout corto en el cliente de Resend (5s, ver `src/integrations/email/resend-sender.ts`); `/api/health` reporta 503 si la base no responde, visible en el pipeline de smoke. |
| R8 | Nivel declarado del TP termina siendo más ambicioso de lo que da el tiempo | 2 | 2 | 4 | Ver sección "Nivel declarado y honestidad del alcance" en `docs/informe-tp.md`: se documenta explícitamente qué quedó al nivel 3 y qué quedó parcial, en vez de reportar un nivel que no se sostiene. |

## Riesgos ya materializados durante el desarrollo (y cómo se resolvieron)

Estos no son hipotéticos — ocurrieron durante esta semana y quedaron
registrados como defectos reales (ver `docs/defectos.md` para el detalle
completo de cada uno): DEF-01 (concurrencia), DEF-02 (bug funcional real
en el flujo de reserva), DEF-03 (hallazgo de análisis estático), DEF-04
(infraestructura). Los cuatro tienen un test de regresión asociado.
