import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Strips passwordHash and any internal credentials before returning user to client.
 */
export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser as Omit<T, 'passwordHash'>;
}
