import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'bsplus-super-secret-key-for-jwt-signing';
const key = new TextEncoder().encode(secretKey);

export async function signToken(payload: any, expiresIn: string | number = '24h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn as any)
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}
