import { scrypt as scryptCallback, timingSafeEqual, randomBytes, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
  const salt = randomBytes(32).toString('hex');
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function checkPassword(password: unknown, encoded: string) {
  if (typeof password !== 'string' || password.length < 1 || password.length > 512) return false;
  const [kind, salt, value] = encoded.split(':');
  if(kind !== 'scrypt' || !/^[a-f0-9]{64}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(value || '')) return false;
  const hash = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(value,'hex'), hash);
}
export function credentialVersion(hash: string) { return createHash('sha256').update(hash).digest('hex').slice(0,24); }
