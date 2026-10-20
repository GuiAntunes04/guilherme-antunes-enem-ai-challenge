import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireQuestionIndexSyncSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secret = env.questionIndexSyncSecret

  if (!secret) {
    res.status(403).json({
      error: 'Sync via API is disabled',
      message: 'Execute npm run sync:questions no servidor.',
    })
    return
  }

  const provided = req.get('x-question-index-sync-secret')
  if (!provided || provided !== secret) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  next()
}
