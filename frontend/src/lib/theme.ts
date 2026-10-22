export const THEME_STORAGE_KEY = 'enem-prep-theme'

export type ThemePreference = 'light' | 'dark' | 'system'

export type ResolvedTheme = 'light' | 'dark'

export const THEME_META_COLORS: Record<ResolvedTheme, string> = {
  dark: '#080c14',
  light: '#f1f5f9',
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) return stored
  } catch {
    /* private mode */
  }
  return 'system'
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.style.colorScheme = resolved

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', THEME_META_COLORS[resolved])
  }
}

export type ChartPalette = {
  grid: string
  tick: string
  tickMuted: string
  line: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  fill: string
}

export const CHART_PALETTES: Record<ResolvedTheme, ChartPalette> = {
  dark: {
    grid: '#243047',
    tick: '#94a3b8',
    tickMuted: '#64748b',
    line: '#2dd4bf',
    tooltipBg: '#0f1623',
    tooltipBorder: '#243047',
    tooltipText: '#eef2f9',
    fill: '#2dd4bf',
  },
  light: {
    grid: '#cbd5e1',
    tick: '#64748b',
    tickMuted: '#94a3b8',
    line: '#0d9488',
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1',
    tooltipText: '#0f172a',
    fill: '#0d9488',
  },
}
