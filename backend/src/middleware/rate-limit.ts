import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

function clientKey(req: Request): string {
  if (req.user?.id) return req.user.id
  const ip = req.ip
  if (!ip) return 'unknown'
  return ipKeyGenerator(ip)
}

const rateLimitMessage = {
  error: 'Too many requests',
  message: 'Aguarde um momento antes de tentar novamente.',
}

/** Gemini-backed routes (tutor, redação, tema de simulado). */
export const geminiRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: rateLimitMessage,
})

/** Starting simulations (includes essay theme generation). */
export const simulationStartRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: rateLimitMessage,
})
