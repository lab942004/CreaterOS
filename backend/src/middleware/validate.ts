import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError, infer as ZodInfer } from 'zod';

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed
 * value (so defaults / coercions are what route handlers actually see).
 */
export const validateBody =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body ?? {});
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          Object.assign(new Error('Validation failed'), {
            name: 'ZodError',
            issues: err.issues,
          })
        );
      }
      return next(err);
    }
  };

export const parse = <T extends ZodType>(schema: T, value: unknown): ZodInfer<T> =>
  schema.parse(value ?? {}) as ZodInfer<T>;
