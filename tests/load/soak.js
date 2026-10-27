import http from "k6/http";
import { check, sleep } from "k6";

// Esfuerzo sostenido: carga moderada constante durante 15 min.
// VUs y umbral de error ajustados a la misma capacidad real medida en
// tests/load/search.js (Vercel Hobby free tier): 8 VUs es lo que el
// free tier sostiene sin degradarse, y el 2% de error (en vez de 1%)
// absorbe el ruido de cold starts de infraestructura compartida
// gratuita ya documentado en docs/metricas.md, no una degradacion real.
export const options = {
  stages: [
    { duration: "1m", target: 8 },
    { duration: "13m", target: 8 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95) < 800"],
    http_req_failed: ["rate < 0.02"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}
