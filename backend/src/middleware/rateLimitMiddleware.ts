import rateLimit from 'express-rate-limit';

// General rate limit: 100 requests per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto.' },
});

// Strict limit for auth-sensitive routes: 20 req/min
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto.' },
});

// Purchase limiter: 10 req/min (prevent purchase spam)
export const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de compra. Intenta de nuevo en 1 minuto.' },
});

// Session/heartbeat limiter: 5 starts per minute, 120 heartbeats per minute
export const sessionStartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión de analítica.' },
});

export const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // Up to 2 per second
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados heartbeats.' },
});

// Payout limiter: 5 per 10 minutes
export const payoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de retiro. Intenta en 10 minutos.' },
});

// Gift limiter: 60 gifts per minute (1 per second max)
export const giftLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados regalos enviados. Intenta de nuevo en 1 minuto.' },
});
