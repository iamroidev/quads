import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import env from '../config/env';

describe('jwt utilities', () => {
  const payload = {
    userId: 'user-123',
    roles: ['buyer', 'seller'],
    viewMode: 'buyer',
  };

  it('generates access token with expected payload', () => {
    const token = generateToken(payload);
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

    expect(typeof token).toBe('string');
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.roles).toEqual(payload.roles);
    expect(decoded.viewMode).toBe(payload.viewMode);
  });

  it('generates refresh token with expected payload', () => {
    const token = generateRefreshToken(payload);
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

    expect(typeof token).toBe('string');
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.roles).toEqual(payload.roles);
    expect(decoded.viewMode).toBe(payload.viewMode);
  });

  it('verifyToken returns typed payload for valid token', () => {
    const token = generateToken(payload);

    expect(verifyToken(token)).toEqual(expect.objectContaining(payload));
  });

  it('verifyToken throws for invalid token', () => {
    expect(() => verifyToken('invalid.token.value')).toThrow();
  });
});
