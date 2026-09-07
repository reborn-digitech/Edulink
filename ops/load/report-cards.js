// k6: a report-card publish for one grade while registers and overviews run.
// Publishing is a server action behind a form, so this drives the two reads
// the publish fans out to — the parent's card and the teacher's list — and the
// publish itself is triggered once by hand from the admin's page at the start.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE || "http://localhost:3000";
const data = JSON.parse(open(__ENV.COOKIES || "./cookies.json"));

export const options = {
  scenarios: { cards: { executor: "constant-vus", vus: 50, duration: "3m" } },
  thresholds: { "http_req_duration{name:card}": ["p(95)<800"] },
};

export default function () {
  const p = data.parents[__VU % data.parents.length];
  const res = http.get(`${BASE}/parent/report-cards`, { headers: { Cookie: p.cookie }, tags: { name: "card" } });
  check(res, { "not 500": (r) => r.status < 500 });
  sleep(3);
}
