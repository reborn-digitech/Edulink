// k6: the college's concurrent users — faculty marking lectures with clientId
// batches, students reading academics and exams, guardians reading the ledger,
// one TPO on an open drive's eligibility, one IQAC on the predictor.
//
//   cd apps/web && node scripts/with-admin-db.mjs npx tsx --tsconfig scripts/tsconfig.json \
//     ../../ops/load/college-check.ts --emit-cookies ../../ops/load/college-cookies.json
//   k6 run -e BASE=https://staging.example -e COOKIES=ops/load/college-cookies.json \
//     -e FACULTY=10 -e STUDENTS=100 -e PARENTS=40 ops/load/college.js
//
// Unlike college-check.ts this does NOT restore the lecture marks it writes
// (all PRESENT): run it against staging, or rerun college-check.ts after it.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE || "http://localhost:3000";
const data = JSON.parse(open(__ENV.COOKIES || "./college-cookies.json"));
const n = (k, d) => Number(__ENV[k] || d);
const steady = (target) => [{ duration: "30s", target }, { duration: "2m", target }, { duration: "15s", target: 0 }];

export const options = {
  scenarios: {
    faculty: { executor: "ramping-vus", exec: "faculty", startVUs: 0, stages: steady(n("FACULTY", 10)) },
    students: { executor: "ramping-vus", exec: "students", startVUs: 0, stages: steady(n("STUDENTS", 100)) },
    parents: { executor: "ramping-vus", exec: "parents", startVUs: 0, stages: steady(n("PARENTS", 40)) },
    tpo: { executor: "constant-vus", exec: "tpo", vus: 1, duration: "2m45s" },
    iqac: { executor: "constant-vus", exec: "iqac", vus: 1, duration: "2m45s" },
  },
  thresholds: {
    "http_req_duration{name:mark}": ["p(95)<300"],
    "http_req_duration{name:mine}": ["p(95)<800"],
    "http_req_duration{name:exams}": ["p(95)<800"],
    "http_req_duration{name:ledger}": ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const uuid = () => "zz-load-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
let last = null;

export function faculty() {
  const f = data.faculty[__VU % data.faculty.length];
  // Every fifth batch is the outbox resending the previous one: same lecture, same clientId.
  const again = last !== null && __ITER % 5 === 4;
  const lecture = again ? last.lecture : f.lectures[__ITER % f.lectures.length];
  const clientId = again ? last.clientId : uuid();
  last = { lecture, clientId };
  const body = JSON.stringify({ clientId, entries: lecture.students.map((s) => ({ studentMembershipId: s, status: "PRESENT" })) });
  const res = http.post(`${BASE}/api/v1/academics/lectures/${lecture.id}/attendance`, body, { headers: { ...auth(f.token), "Content-Type": "application/json" }, tags: { name: "mark" } });
  check(res, { "200": (r) => r.status === 200 });
  sleep(2);
}

export function students() {
  const t = data.students[__VU % data.students.length];
  const res = __ITER % 2 === 0 ? http.get(`${BASE}/api/v1/academics/mine`, { headers: auth(t), tags: { name: "mine" } }) : http.get(`${BASE}/api/v1/exam-cell/mine`, { headers: auth(t), tags: { name: "exams" } });
  check(res, { "200": (r) => r.status === 200 });
  sleep(1);
}

export function parents() {
  const p = data.parents[__VU % data.parents.length];
  const res = http.get(`${BASE}/api/v1/student/ledger?childId=${p.childId}`, { headers: auth(p.token), tags: { name: "ledger" } });
  check(res, { "200": (r) => r.status === 200 });
  sleep(1);
}

export function tpo() {
  if (!data.tpo) return sleep(2);
  check(http.get(`${BASE}/api/v1/placement/drives/${data.drive}/eligibility`, { headers: auth(data.tpo), tags: { name: "eligibility" } }), { "200": (r) => r.status === 200 });
  sleep(2);
}

export function iqac() {
  if (!data.iqac) return sleep(2);
  check(http.get(`${BASE}/api/v1/iqac/cycles/${data.cycle}`, { headers: auth(data.iqac), tags: { name: "predictor" } }), { "200": (r) => r.status === 200 });
  sleep(2);
}
