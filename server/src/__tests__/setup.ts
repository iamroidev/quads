// Jest setup file — runs before all tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-123456789012345678901234567890';
process.env.MONGODB_URI = 'mongodb://localhost:27017/quads_test';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_dummy';
process.env.CLIENT_URL = 'http://localhost:5173';
