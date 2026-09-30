/** True when another API key may help (rate limit / quota). */
export function isEnemHubQuotaResponse(status: number, body: string): boolean {
  if (status === 429) return true

  if (status === 403 || status === 402) {
    const lower = body.toLowerCase()
    return (
      lower.includes('quota') ||
      lower.includes('limit') ||
      lower.includes('rate') ||
      lower.includes('exceeded')
    )
  }

  return false
}
