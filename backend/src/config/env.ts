import 'dotenv/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseFrontendOrigins(): string[] {
  const raw = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendOrigins: parseFrontendOrigins(),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
  enemhubApiKey: process.env.ENEMHUB_API_KEY,
}

export function validateProductionEnv(): void {
  if (env.nodeEnv !== 'production') return

  requireEnv('SUPABASE_URL')
  requireEnv('SUPABASE_SECRET_KEY')
  requireEnv('SUPABASE_JWKS_URL')
  requireEnv('GEMINI_API_KEY')
  requireEnv('ENEMHUB_API_KEY')
}
