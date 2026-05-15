// import { createRemoteJWKSet, jwtVerify } from 'jose';
import ApiError from './ApiError';
const { createRemoteJWKSet, jwtVerify } = require('jose');

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string | string[];
  role?: string;
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export const verifySupabaseToken = async (token: string): Promise<SupabaseJwtPayload> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw ApiError.badRequest('SUPABASE_URL is not configured on server.');
  }

  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const authIssuer = `${baseUrl}/auth/v1`;
  const allowedIssuers = [authIssuer, baseUrl];
  
  console.log(`[SupabaseJwt] Verifying token for issuer: ${authIssuer}`);
  const jwks = createRemoteJWKSet(new URL(`${authIssuer}/.well-known/jwks.json`));

  for (const issuer of allowedIssuers) {
    try {
      console.log(`[SupabaseJwt] Trying issuer: ${issuer}`);
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: 'authenticated',
      });

      console.log('[SupabaseJwt] Token verified successfully');
      return payload as SupabaseJwtPayload;
    } catch (err: any) {
      console.log(`[SupabaseJwt] Verification failed for issuer ${issuer}: ${err.message}`);
    }
  }

  console.error('[SupabaseJwt] All issuers failed verification');
  throw ApiError.unauthorized('Invalid Supabase token.');
};
