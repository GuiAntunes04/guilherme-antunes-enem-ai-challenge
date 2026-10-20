import { useEffect, useId, useMemo, useRef, useState, type FocusEvent } from 'react'
import { cn } from '../../lib/cn'
import { inputToneClass } from './Input'

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
  depth?: number
}

type SearchableSelectProps = {
  value: string
  options: SearchableSelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
  /** Omit or set undefined to show all filtered options. */
  maxVisible?: number
}

function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function SearchableSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  maxVisible,
}: SearchableSelectProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? '')
    }
  }, [selected, open, value])

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim())
    if (!normalizedQuery) return options

    return options.filter((option) => {
      const haystack = normalizeSearch(`${option.label} ${option.description ?? ''}`)
      return haystack.includes(normalizedQuery)
    })
  }, [options, query])

  const limit = maxVisible ?? filtered.length
  const visibleOptions = filtered.slice(0, limit)
  const truncated = maxVisible !== undefined && filtered.length > maxVisible

  function handleSelect(option: SearchableSelectOption) {
    onChange(option.value)
    setQuery(option.label)
    setOpen(false)
  }

  function handleBlur(event: FocusEvent) {
    const next = event.relatedTarget
    if (next instanceof Node && rootRef.current?.contains(next)) {
      return
    }

    window.setTimeout(() => {
      setOpen(false)
      setQuery(selected?.label ?? '')
    }, 0)
  }

  const styles = inputToneClass.dark

  return (
    <div ref={rootRef} className="relative" onBlur={handleBlur}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (!disabled) setOpen(true)
        }}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-base outline-none transition focus:ring-2 sm:text-sm',
          styles.input,
        )}
      />

      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-surface-raised py-1 shadow-lg"
        >
          {visibleOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">{emptyMessage}</li>
          ) : (
            visibleOptions.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col py-2 pr-3 text-left text-sm transition hover:bg-surface-overlay',
                      isSelected && 'bg-accent/10 text-accent',
                    )}
                    style={{
                      paddingLeft: `${12 + (option.depth ?? 0) * 14}px`,
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="text-foreground">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted">{option.description}</span>
                    )}
                  </button>
                </li>
              )
            })
          )}
          {truncated && (
            <li className="border-t border-border-subtle px-3 py-2 text-xs text-muted">
              Mostrando {maxVisible} de {filtered.length}. Refine a busca.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
