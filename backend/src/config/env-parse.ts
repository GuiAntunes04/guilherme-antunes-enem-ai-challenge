export function parseCsvList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** Primary first, then extras; duplicates removed. */
export function buildApiKeyList(primary: string | undefined, extrasCsv: string | undefined): string[] {
  const all = [primary, ...parseCsvList(extrasCsv)].filter(Boolean) as string[]
  return [...new Set(all)]
}

export function buildModelList(
  primary: string | undefined,
  fallbacksCsv: string | undefined,
  defaultPrimary: string,
): string[] {
  const main = primary?.trim() || defaultPrimary
  return [...new Set([main, ...parseCsvList(fallbacksCsv)])]
}
