import { Card } from '../ui/Card'

type EssayThemePanelProps = {
  theme: string
  motivators: string[]
}

export function EssayThemePanel({ theme, motivators }: EssayThemePanelProps) {
  return (
    <Card as="section">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Tema</p>
      <h2 className="mt-2 font-display text-lg font-semibold text-foreground">{theme}</h2>
      {motivators.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
          <p className="text-xs font-medium text-muted">Textos motivadores</p>
          {motivators.map((motivator, index) => (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground">
              {motivator}
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}
