import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
    code?: string;
  };
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  code = 'BAD_REQUEST',
  details?: unknown
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
  return res.status(statusCode).json(responsePayload);
};
