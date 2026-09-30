import 'dotenv/config'
import { buildApiKeyList, buildModelList } from './env-parse.js'

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

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

const geminiApiKeys = buildApiKeyList(process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEYS)
const enemhubApiKeys = buildApiKeyList(process.env.ENEMHUB_API_KEY, process.env.ENEMHUB_API_KEYS)
const geminiModels = buildModelList(
  process.env.GEMINI_MODEL,
  process.env.GEMINI_MODEL_FALLBACKS,
  DEFAULT_GEMINI_MODEL,
)

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendOrigins: parseFrontendOrigins(),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL,
  geminiApiKey: geminiApiKeys[0],
  geminiApiKeys,
  geminiModel: geminiModels[0],
  geminiModels,
  enemhubApiKey: enemhubApiKeys[0],
  enemhubApiKeys,
}

export function validateProductionEnv(): void {
  if (env.nodeEnv !== 'production') return

  requireEnv('SUPABASE_URL')
  requireEnv('SUPABASE_SECRET_KEY')
  requireEnv('SUPABASE_JWKS_URL')

  if (geminiApiKeys.length === 0) {
    throw new Error('Missing required environment variable: GEMINI_API_KEY (or GEMINI_API_KEYS)')
  }

  if (enemhubApiKeys.length === 0) {
    throw new Error('Missing required environment variable: ENEMHUB_API_KEY (or ENEMHUB_API_KEYS)')
  }
}
