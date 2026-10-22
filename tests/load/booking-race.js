import http from "k6/http";
import { check } from "k6";

// Hoy pega a /api/health como esfuerzo concurrente de referencia.
// Cuando exista POST /api/bookings (RN-01), esto pasa a disparar N VUs
// contra el mismo turno y valida: exactamente 1 "confirmed", el resto 409,
// cero 5xx.
export const options = {
  scenarios: {
    race: {
      executor: "shared-iterations",
      vus: 30,
      iterations: 30,
      maxDuration: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate < 0.01"],
    http_req_duration: ["p(95) < 800"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { "status 200": (r) => r.status === 200 });
}
