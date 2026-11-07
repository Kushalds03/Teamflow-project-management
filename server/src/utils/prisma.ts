import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const basePrisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

// Automatically ensure adequate timeout for interactive transactions over cloud database connections
const originalTransaction = basePrisma.$transaction.bind(basePrisma);
(basePrisma as any).$transaction = (arg: any, options?: any) => {
  if (typeof arg === 'function') {
    return originalTransaction(arg, {
      maxWait: 10000,
      timeout: 30000,
      ...options
    });
  }
  return originalTransaction(arg, options);
};

export const prisma = basePrisma;

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
