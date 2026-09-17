import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  if (!env.supabaseJwksUrl) {
    throw new Error('SUPABASE_JWKS_URL is not configured')
  }

  jwks ??= createRemoteJWKSet(new URL(env.supabaseJwksUrl))
  return jwks
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = header.slice(7)

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: `${env.supabaseUrl}/auth/v1`,
    })

    if (!payload.sub) {
      res.status(401).json({ error: 'Invalid token payload' })
      return
    }

    req.user = {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
    }

    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
