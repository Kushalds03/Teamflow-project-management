import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * Hashes a plaintext password using bcrypt with configured work factor.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Safely compares a plaintext password with a hashed password.
 * Returns false if hash is empty, invalid, or comparison fails.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
