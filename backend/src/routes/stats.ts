import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { buildDashboardStats } from '../services/stats-aggregator.js'

export const statsRouter = Router()

statsRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id

  const [simulations, essays, dashboard] = await Promise.all([
    supabaseAdmin
      .from('simulation_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('finished_at', 'is', null),
    supabaseAdmin
      .from('essays')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done'),
    buildDashboardStats(userId),
  ])

  if (simulations.error || essays.error) {
    res.status(500).json({
      error: 'Failed to load stats',
      message: simulations.error?.message ?? essays.error?.message,
    })
    return
  }

  res.json({
    simulations: simulations.count ?? 0,
    essays: essays.count ?? 0,
    subjectPerformance: dashboard.subjectPerformance,
    simulationTrend: dashboard.simulationTrend,
  })
})
