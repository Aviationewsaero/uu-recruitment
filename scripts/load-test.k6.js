// HTTP-layer load test using k6.
// Install k6:  brew install k6
// Run:         k6 run scripts/load-test.k6.js --env BASE=https://careers.ews.aero
//
// Default: 50 virtual users ramping to 200 over 1 minute, then steady for 4 min.
// Simulates the registration burst when QR codes go live.

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "30s", target: 200 },
    { duration: "3m", target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"], // <2% errors
    http_req_duration: ["p(95)<1500"], // 95% under 1.5s
  },
};

const BASE = __ENV.BASE || "http://localhost:3001";

export default function () {
  // Hit the landing page (cheap server component render)
  const land = http.get(`${BASE}/`);
  check(land, { "landing 200": (r) => r.status === 200 });

  // Hit the register page (heavier — RHF + zod hydration)
  const reg = http.get(`${BASE}/register`);
  check(reg, { "register 200": (r) => r.status === 200 });

  // Display board (polling endpoint, the most-hit page during drive)
  const disp = http.get(`${BASE}/display`);
  check(disp, { "display 200": (r) => r.status === 200 });

  sleep(Math.random() * 2 + 1);
}
