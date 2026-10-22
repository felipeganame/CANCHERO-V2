import http from "k6/http";
import { check, sleep } from "k6";

// Ajustado a la capacidad real de Vercel Hobby (free tier): con 20 VUs
// concurrentes contra una sola funcion serverless se observo 8.9% de
// error (ver docs/metricas.md) - un hallazgo real de stress, no un bug
// de la app. Para el gate de cada deploy usamos una carga que el free
// tier sostiene; la corrida de 20 VUs se documenta aparte como
// "stress ejecutado con resultados y umbrales" (nivel 2/3 del TP).
export const options = {
  stages: [
    { duration: "20s", target: 8 },
    { duration: "40s", target: 8 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95) < 800"],
    http_req_failed: ["rate < 0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}
