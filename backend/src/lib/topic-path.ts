export const TOPIC_PATH_SEPARATOR = ' > '

const FOREIGN_LANGUAGE_TOPIC_ROOTS = new Set(['Inglês', 'Espanhol'])

/**
 * EnemHub uses subject.name for discipline (Inglês/Espanhol) and subject.area for skill paths
 * that often omit the language. Prefix area so topic practice and meta include language roots.
 */
export function normalizeSubjectAreaForTopics(
  subjectName: string | null | undefined,
  subjectArea: string | null | undefined,
): string | null {
  const name = subjectName?.trim()
  if (!name || !FOREIGN_LANGUAGE_TOPIC_ROOTS.has(name)) {
    const trimmed = subjectArea?.trim()
    return trimmed || null
  }

  const area = subjectArea?.trim() ?? ''
  if (!area) {
    return name
  }

  if (area === name || area.startsWith(`${name}${TOPIC_PATH_SEPARATOR}`)) {
    return area
  }

  return `${name}${TOPIC_PATH_SEPARATOR}${area}`
}

export function topicPathPrefixes(fullPath: string): string[] {
  const parts = fullPath
    .split(TOPIC_PATH_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  const prefixes: string[] = []
  for (let index = 0; index < parts.length; index += 1) {
    prefixes.push(parts.slice(0, index + 1).join(TOPIC_PATH_SEPARATOR))
  }

  return prefixes
}

export function topicPathDepth(fullPath: string): number {
  return Math.max(0, topicPathPrefixes(fullPath).length - 1)
}

export function matchesTopicPathPrefix(
  subjectArea: string | null | undefined,
  selectedPrefix: string,
): boolean {
  if (!subjectArea?.trim() || !selectedPrefix.trim()) return false

  const area = subjectArea.trim()
  const prefix = selectedPrefix.trim()

  if (area === prefix) return true

  return area.startsWith(`${prefix}${TOPIC_PATH_SEPARATOR}`)
}

/** Escape `%` and `_` for PostgreSQL LIKE patterns. */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function quotePostgrestValue(value: string): string {
  if (/^[A-Za-z0-9_*.-]+$/.test(value)) {
    return value
  }

  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function buildSubjectAreaPrefixOrFilter(prefix: string): string {
  const trimmed = prefix.trim()
  const likePattern = `${escapeLikePattern(trimmed + TOPIC_PATH_SEPARATOR)}%`

  return [
    `subject_area.eq.${quotePostgrestValue(trimmed)}`,
    `subject_area.like.${quotePostgrestValue(likePattern)}`,
  ].join(',')
}
