// k6: two hundred guardians opening the overview at once.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE || "http://localhost:3000";
const data = JSON.parse(open(__ENV.COOKIES || "./cookies.json"));

export const options = {
  scenarios: {
    overview: { executor: "ramping-vus", startVUs: 0, stages: [{ duration: "1m", target: 200 }, { duration: "3m", target: 200 }, { duration: "30s", target: 0 }] },
  },
  thresholds: { "http_req_duration{name:overview}": ["p(95)<800"], http_req_failed: ["rate<0.01"] },
};

export default function () {
  const p = data.parents[__VU % data.parents.length];
  const res = http.get(`${BASE}/parent`, { headers: { Cookie: p.cookie }, tags: { name: "overview" } });
  check(res, { "200": (r) => r.status === 200 });
  sleep(5);
}
