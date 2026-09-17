import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

export const meRouter = Router()

meRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error) {
    res.status(404).json({
      error: 'Profile not found',
      message: error.message,
    })
    return
  }

  res.json({
    user: {
      id: userId,
      email: req.user?.email,
    },
    profile,
  })
})
