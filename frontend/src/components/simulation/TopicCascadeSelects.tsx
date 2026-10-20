import { useMemo } from 'react'
import {
  buildTopicCascadeLevels,
  buildTopicTree,
  cascadeLevelLabel,
  topicLeafLabel,
} from '../../lib/topic-tree'
import type { EnemSubjectArea } from '../../types/simulation'

type TopicCascadeSelectsProps = {
  areas: EnemSubjectArea[]
  value: string
  onChange: (path: string) => void
  disabled?: boolean
}

const selectClassName =
  'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent disabled:opacity-60'

export function TopicCascadeSelects({
  areas,
  value,
  onChange,
  disabled = false,
}: TopicCascadeSelectsProps) {
  const tree = useMemo(() => buildTopicTree(areas), [areas])
  const levels = useMemo(() => buildTopicCascadeLevels(tree, value), [tree, value])

  if (levels.length === 0) {
    return <p className="text-sm text-muted">Nenhum tópico disponível no índice.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {levels.map((level, levelIndex) => (
        <label key={`${level.parentPath}-${levelIndex}`} className="block">
          <span className="mb-1.5 block text-sm text-muted-foreground">
            {cascadeLevelLabel(levelIndex)}
          </span>
          <select
            value={
              levelIndex === 0
                ? level.selectedPath
                : level.selectedPath || level.parentPath
            }
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className={selectClassName}
          >
            {levelIndex > 0 && level.parentPath && (
              <option value={level.parentPath}>
                Todo em {topicLeafLabel(level.parentPath)} (
                {findCount(areas, level.parentPath)} questões)
              </option>
            )}
            {level.options.map((option) => (
              <option key={option.path} value={option.path}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

function findCount(areas: EnemSubjectArea[], path: string): number {
  return areas.find((item) => item.area === path)?.count ?? 0
}
