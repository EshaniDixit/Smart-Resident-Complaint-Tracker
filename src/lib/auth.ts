import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Fail fast in production if the secret is not configured.
// In development the .env file provides it; this guard prevents
// accidentally deploying with no secret set.
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
  throw new Error(
    'JWT_SECRET environment variable is not set. ' +
    'Set it in your hosting platform\'s env config before deploying.'
  );
}
const SIGNING_KEY = SECRET_KEY ?? 'dev-fallback-not-for-production';

export type JwtPayload = {
  id: string;
  username: string;
  role: string;
};

export async function signToken(payload: JwtPayload): Promise<string> {
  return jwt.sign(payload, SIGNING_KEY, { expiresIn: '1d' });
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, SIGNING_KEY) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getUserFromSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  return verifyToken(token);
}
