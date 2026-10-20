import type { EnemSubjectArea } from '../types/simulation'

export const TOPIC_PATH_SEPARATOR = ' > '

export type TopicTreeNode = {
  path: string
  label: string
  count: number
  depth: number
  children: TopicTreeNode[]
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

export function topicParentPath(fullPath: string): string | null {
  const separatorIndex = fullPath.lastIndexOf(TOPIC_PATH_SEPARATOR)
  if (separatorIndex === -1) return null
  return fullPath.slice(0, separatorIndex)
}

export function topicLeafLabel(fullPath: string): string {
  const parts = fullPath.split(TOPIC_PATH_SEPARATOR)
  return parts[parts.length - 1]?.trim() || fullPath
}

export function buildTopicTree(areas: EnemSubjectArea[]): TopicTreeNode[] {
  const sorted = [...areas].sort((a, b) => a.area.localeCompare(b.area))
  const nodeByPath = new Map<string, TopicTreeNode>()
  const roots: TopicTreeNode[] = []

  for (const area of sorted) {
    nodeByPath.set(area.area, {
      path: area.area,
      label: topicLeafLabel(area.area),
      count: area.count,
      depth: area.depth ?? topicPathPrefixes(area.area).length - 1,
      children: [],
    })
  }

  for (const area of sorted) {
    const node = nodeByPath.get(area.area)
    if (!node) continue

    const parentPath = topicParentPath(area.area)
    const parent = parentPath ? nodeByPath.get(parentPath) : undefined

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function findTopicNode(tree: TopicTreeNode[], path: string): TopicTreeNode | null {
  for (const node of tree) {
    if (node.path === path) return node
    const nested = findTopicNode(node.children, path)
    if (nested) return nested
  }

  return null
}

export function getTopicChildren(tree: TopicTreeNode[], parentPath: string): TopicTreeNode[] {
  if (!parentPath) return tree
  return findTopicNode(tree, parentPath)?.children ?? []
}

export type TopicCascadeLevel = {
  parentPath: string
  selectedPath: string
  options: TopicTreeNode[]
}

export function buildTopicCascadeLevels(
  tree: TopicTreeNode[],
  subjectArea: string,
): TopicCascadeLevel[] {
  const segments = subjectArea ? topicPathPrefixes(subjectArea) : []
  const levels: TopicCascadeLevel[] = []

  let parentPath = ''

  for (let index = 0; index <= segments.length; index += 1) {
    const options = getTopicChildren(tree, parentPath)
    if (options.length === 0 && levels.length > 0) break
    if (options.length === 0 && levels.length === 0) break

    const selectedPath = segments[index] ?? ''
    levels.push({ parentPath, selectedPath, options })

    if (!selectedPath) break

    parentPath = selectedPath

    if (index >= segments.length - 1) {
      const deeper = getTopicChildren(tree, parentPath)
      if (deeper.length > 0) {
        levels.push({ parentPath, selectedPath: '', options: deeper })
      }
      break
    }
  }

  return levels
}

export function cascadeLevelLabel(levelIndex: number): string {
  if (levelIndex === 0) return 'Tópico'
  if (levelIndex === 1) return 'Subtópico'
  return `Subtópico (${levelIndex})`
}
