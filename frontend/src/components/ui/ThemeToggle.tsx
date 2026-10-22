import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import type { ThemePreference } from '../../lib/theme'
import { cn } from '../../lib/cn'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Escuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
]

type ThemeToggleProps = {
  compact?: boolean
  className?: string
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme()

  if (compact) {
    const active = OPTIONS.find((option) => option.value === preference) ?? OPTIONS[2]
    const ActiveIcon = active.Icon
    const nextIndex = (OPTIONS.findIndex((option) => option.value === preference) + 1) % OPTIONS.length
    const next = OPTIONS[nextIndex]

    return (
      <button
        type="button"
        className={cn(
          'flex items-center justify-center rounded-lg p-2 text-muted transition hover:bg-surface-overlay hover:text-foreground',
          className,
        )}
        onClick={() => setPreference(next.value)}
        title={`Tema: ${active.label}. Clique para ${next.label.toLowerCase()}.`}
        aria-label={`Tema ${active.label}. Alternar para ${next.label.toLowerCase()}.`}
      >
        <ActiveIcon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      </button>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted">Tema</span>
      <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface p-1">
        {OPTIONS.map(({ value, label, Icon }) => {
          const selected = preference === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPreference(value)}
              aria-pressed={selected}
              title={label}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition',
                selected
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:bg-surface-overlay hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
