import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response) => {
  sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    404,
    'NOT_FOUND'
  );
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.error('Unhandled Application Error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = (err as any).code || 'INTERNAL_SERVER_ERROR';

  sendError(
    res,
    message,
    statusCode,
    code,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
};
