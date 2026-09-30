export type GeminiFailureKind = 'quota' | 'overload' | 'fatal'

type ErrorWithStatus = {
  status?: number
  message?: string
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

function errorStatus(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as ErrorWithStatus).status
    if (typeof status === 'number') return status
  }
  return undefined
}

export function classifyGeminiError(err: unknown): GeminiFailureKind {
  const msg = errorText(err).toLowerCase()
  const status = errorStatus(err)

  if (
    status === 429 ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource exhausted') ||
    msg.includes('too many requests')
  ) {
    return 'quota'
  }

  if (
    status === 503 ||
    status === 529 ||
    msg.includes('overloaded') ||
    msg.includes('overload') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('try again later')
  ) {
    return 'overload'
  }

  return 'fatal'
}
