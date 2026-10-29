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
