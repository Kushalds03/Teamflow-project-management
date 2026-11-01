import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Express middleware that validates req.body against a Zod schema.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const issues = zodError.issues.map((e) => ({
        field: e.path.map(String).join('.') || 'body',
        message: e.message
      }));

      return sendError(
        res,
        'Request validation failed',
        400,
        'VALIDATION_ERROR',
        issues
      );
    }

    req.body = result.data;
    next();
  };
};

/**
 * Express middleware that validates req.params against a Zod schema.
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const issues = zodError.issues.map((e) => ({
        field: e.path.map(String).join('.') || 'params',
        message: e.message
      }));

      return sendError(
        res,
        'Invalid parameter(s)',
        400,
        'VALIDATION_ERROR',
        issues
      );
    }

    req.params = result.data as any;
    next();
  };
};

/**
 * Express middleware that validates req.query against a Zod schema.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const issues = zodError.issues.map((e) => ({
        field: e.path.map(String).join('.') || 'query',
        message: e.message
      }));

      return sendError(
        res,
        'Invalid query parameter(s)',
        400,
        'VALIDATION_ERROR',
        issues
      );
    }

    req.query = result.data as any;
    next();
  };
};

