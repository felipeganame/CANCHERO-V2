# Objetivos de calidad

## Desde el usuario (jugador y club)

- Encontrar y reservar una cancha libre en menos de 2 minutos desde que
  entra a la búsqueda (medible: tiempo entre `/buscar` y confirmación).
- Nunca ver una reserva "fantasma": si el turno se muestra libre, se
  puede reservar; si dos personas lo intentan a la vez, solo una gana y
  la otra ve un mensaje claro ("Ese turno se acaba de ocupar"), no un
  error genérico. **Medible y cumplido:** RN-01, con índice único a
  nivel de base de datos (CP-110, contra Postgres real).
- Un club puede deshabilitar una cancha sin miedo a romper reservas ya
  confirmadas de turnos pasados (RN-05, CP-111).

## Desde el equipo (proceso)

- Ningún PR se mergea sin pasar lint, typecheck, build, tests y el
  quality gate de SonarCloud. **Cumplido:** el pipeline bloquea
  automáticamente (`SonarSource/sonarqube-quality-gate-action`).
- Cobertura sobre código nuevo ≥ 80%. **Cumplido:** 83.3% medido por
  SonarCloud al momento de este informe (ver `docs/metricas.md` para la
  evolución 21% → 87% local).
- Cada regla de negocio tiene al menos un caso de prueba con su ID
  (RN-xx / CP-xx) en el nombre del test, para que el resultado del
  pipeline sea legible sin abrir el código. **Cumplido**, ver
  `docs/trazabilidad.md`.
- Cada defecto encontrado (no importa en qué capa) se documenta con
  pasos, causa raíz y corrección antes de darlo por cerrado. **Cumplido**
  para los 4 defectos reales de este desarrollo.

## Desde la organización (UCC / entrega del TP)

- Demostrar, con datos reales y no inventados, que el pipeline detecta
  problemas reales antes de que lleguen a producción. **Cumplido:** 15
  corridas del pipeline en el historial de `main`, con ejecuciones en
  verde y fallidas reales (ver `docs/trazabilidad.md` y el historial de
  Actions).
- Integración con al menos un servicio externo, probada contra el
  entorno real, no solo contra un doble de prueba. **Cumplido:**
  Supabase (Postgres gestionado) + Vercel (deploy) + Resend (email),
  documentado en `docs/integracion-externa.md`.

## Plan de contingencia ante la caída de una dependencia crítica

| Dependencia | Si cae... | Mitigación implementada |
|---|---|---|
| Supabase (Postgres) | `/api/health` responde 503; el smoke test del pipeline falla y lo detecta antes de que un usuario lo note | Timeout corto en todas las queries vía el cliente `postgres-js`; página de error amigable en el frontend (estados de error ya implementados en cada pantalla) |
| Resend (email) | Las reservas se siguen confirmando igual (el email es notificación, no bloqueante); el timeout de 5s evita que una falla de Resend cuelgue la confirmación de la reserva | `src/integrations/email/resend-sender.ts` usa `Promise.race` con timeout de 5s |
| Vercel (hosting) | El deploy a producción simplemente no se actualiza; el deploy anterior sigue sirviendo tráfico (Vercel no tira abajo el deployment anterior al fallar uno nuevo) | Pipeline con etapa de QA antes de producción: un deploy roto nunca llega a reemplazar al de producción porque el gate de QA lo frena antes |
| Google OAuth (cuando esté configurado) | Login bloqueado para jugadores nuevos, pero las búsquedas públicas y el panel de club (que no depende de Google) siguen funcionando | Documentado en PLAN.md sección 8; pendiente de implementar las credenciales |
