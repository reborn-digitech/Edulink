// k6: thirty registers in ten minutes. COOKIES is a JSON file of
// { teachers: [{ cookie, classId, dateKey, marks: [{ studentMembershipId, status }] }] }
// produced by `npm run load:check -- --emit-cookies ops/load/cookies.json`.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE || "http://localhost:3000";
const data = JSON.parse(open(__ENV.COOKIES || "./cookies.json"));

export const options = {
  scenarios: {
    registers: { executor: "constant-vus", vus: data.teachers.length, duration: "10m" },
  },
  thresholds: { "http_req_duration{name:attendance}": ["p(95)<300"], http_req_failed: ["rate<0.01"] },
};

export default function () {
  const t = data.teachers[__VU % data.teachers.length];
  // The school's own today, which load:check writes beside each register (TA-463); the UTC date is its yesterday
  // before 05:30 IST. An older cookies file without it falls back to the UTC date as before.
  const today = t.dateKey || new Date().toISOString().slice(0, 10);
  const res = http.post(
    `${BASE}/api/attendance`,
    JSON.stringify({ classId: t.classId, dateKey: today, marks: t.marks }),
    { headers: { "Content-Type": "application/json", Cookie: t.cookie }, tags: { name: "attendance" } },
  );
  check(res, { "200": (r) => r.status === 200 });
  sleep(20);
}
