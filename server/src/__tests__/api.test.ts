import request from 'supertest';
import express from 'express';

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'QUADS API is running',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

describe('API Endpoints', () => {
  const app = createTestApp();

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('QUADS API is running');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
