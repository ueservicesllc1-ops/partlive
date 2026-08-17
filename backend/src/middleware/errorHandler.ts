import { Request, Response, NextFunction } from 'express';

// ─── Structured error logger ──────────────────────────────────────────────────

const formatError = (err: any, req: Request) => ({
  timestamp: new Date().toISOString(),
  method: req.method,
  path: req.path,
  status: err.status || err.statusCode || 500,
  message: err.message || 'Internal Server Error',
  // Only include stack in non-production
  ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
});

// ─── Not Found handler (404) ──────────────────────────────────────────────────

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
};

// ─── Global error handler ─────────────────────────────────────────────────────

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const formatted = formatError(err, req);

  // Always log to console (Railway captures stdout)
  if (formatted.status >= 500) {
    console.error('❌ [ERROR]', JSON.stringify(formatted));
  } else {
    console.warn('⚠️  [WARN]', JSON.stringify(formatted));
  }

  // Avoid sending sensitive stack traces in production
  res.status(formatted.status).json({
    error: formatted.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: formatted.stack }),
  });
};
