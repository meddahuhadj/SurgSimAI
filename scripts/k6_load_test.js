import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Montée progressive à 50 utilisateurs virtuels
    { duration: '1m', target: 100 },  // Maintien à 100 utilisateurs virtuels
    { duration: '30s', target: 0 },   // Descendance
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Erreurs HTTP < 1%
    http_req_duration: ['p(95)<200'],  // 95% des requêtes < 200ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // 1. Health check
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, { 'health is 200': (r) => r.status === 200 });

  // 2. Authentication simulation
  const loginRes = http.post(`${BASE_URL}/auth/token`, {
    username: 'dr.hadj',
    password: 'DemoPassword123!',
  });
  
  if (loginRes.status === 200) {
    const token = loginRes.json('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    // 3. OR Schedule query
    const resSchedule = http.get(`${BASE_URL}/or/schedule`, { headers });
    check(resSchedule, { 'schedule status 200': (r) => r.status === 200 });

    // 4. OR Procedures catalogue
    const resProcs = http.get(`${BASE_URL}/or/procedures`, { headers });
    check(resProcs, { 'procedures status 200': (r) => r.status === 200 });
  }

  sleep(1);
}
