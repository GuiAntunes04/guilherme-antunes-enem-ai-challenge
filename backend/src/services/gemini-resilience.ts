import { env } from '../config/env.js'
import { classifyGeminiError } from '../lib/gemini-error.js'

export type GeminiFallbackOptions = {
  apiKeys?: string[]
  models?: string[]
}

export async function withGeminiFallback<T>(
  run: (apiKey: string, model: string) => Promise<T>,
  options: GeminiFallbackOptions = {},
): Promise<T> {
  const keys = options.apiKeys ?? env.geminiApiKeys
  const models = options.models ?? env.geminiModels

  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY não configurada no backend')
  }

  let lastError: unknown

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const apiKey = keys[keyIndex]

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex]

      try {
        return await run(apiKey, model)
      } catch (err) {
        lastError = err
        const kind = classifyGeminiError(err)

        if ((kind === 'quota' || kind === 'overload') && modelIndex < models.length - 1) {
          console.warn('[gemini] tentando próximo modelo na mesma chave', {
            reason: kind,
            model,
            nextModel: models[modelIndex + 1],
            keyIndex: keyIndex + 1,
          })
          continue
        }

        if ((kind === 'quota' || kind === 'overload') && keyIndex < keys.length - 1) {
          console.warn('[gemini] modelos esgotados nesta chave, trocando chave', {
            reason: kind,
            keyIndex: keyIndex + 1,
            totalKeys: keys.length,
          })
          break
        }

        throw err
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
