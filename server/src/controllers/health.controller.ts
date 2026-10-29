import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';

export const getHealth = async (req: Request, res: Response) => {
  let dbStatus: 'CONNECTED' | 'DISCONNECTED' = 'DISCONNECTED';
  let dbError: string | null = null;
  const startTime = Date.now();
  let dbLatencyMs: number | null = null;

  try {
    // Timeout probe after 5000ms so cold-start cloud handshakes do not prematurely time out
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 5000ms')), 5000)
      )
    ]);
    dbStatus = 'CONNECTED';
    dbLatencyMs = Date.now() - startTime;
  } catch (error: any) {
    dbStatus = 'DISCONNECTED';
    dbError = error?.message || 'Database unreachable';
  }

  const healthData = {
    service: 'TeamFlow API',
    status: 'ONLINE',
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      provider: 'postgresql',
      ...(dbLatencyMs !== null ? { latency: `${dbLatencyMs}ms` } : {}),
      ...(dbError ? { error: dbError } : {})
    }
  };

  // If client explicitly requests a strict readiness check (?ready=true) and DB is down, return 503
  if (req.query.ready === 'true' && dbStatus !== 'CONNECTED') {
    return res.status(503).json({
      success: false,
      data: healthData,
      meta: { timestamp: new Date().toISOString() }
    });
  }

  return sendSuccess(res, healthData);
};
