import request from 'supertest';
import { app } from '../../src/server';

describe('Health and API Endpoints', () => {
  it('GET /health returns 200 with status ok and version', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/v1/non-existent returns 404 with standard error format', async () => {
    const res = await request(app).get('/api/v1/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Rejects unauthenticated request to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });
});
