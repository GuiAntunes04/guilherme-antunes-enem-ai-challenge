import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../contexts/AuthContext'
import { fetchEnemPracticeMeta } from '../../lib/simulations-api'
import { buildTopicTree, type TopicTreeNode } from '../../lib/topic-tree'
import { cn } from '../../lib/cn'

function practiceUrl(path: string): string {
  const params = new URLSearchParams({ pratica: 'topic', topico: path })
  return `/simulados?${params.toString()}`
}

type TopicTreeBranchProps = {
  node: TopicTreeNode
  depth?: number
}

function TopicTreeBranch({ node, depth = 0 }: TopicTreeBranchProps) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.children.length > 0

  return (
    <div className={cn(depth > 0 && 'ml-4 border-l border-border-subtle pl-3')}>
      <div className="flex flex-wrap items-center gap-2 rounded-lg py-2 pr-2 transition hover:bg-surface-raised/60">
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-sm text-muted hover:border-accent/40 hover:text-foreground"
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="inline-block h-8 w-8 shrink-0" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{node.label}</p>
          <p className="text-xs text-muted">
            {node.count} questões · inclui subtópicos
          </p>
        </div>

        <Link
          to={practiceUrl(node.path)}
          className="shrink-0 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20"
        >
          Praticar
        </Link>
      </div>

      {open &&
        hasChildren &&
        node.children.map((child) => (
          <TopicTreeBranch key={child.path} node={child} depth={depth + 1} />
        ))}
    </div>
  )
}

export function TopicExplorerPage() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tree, setTree] = useState<TopicTreeNode[]>([])

  useEffect(() => {
    if (!token) return

    fetchEnemPracticeMeta(token)
      .then(({ areas }) => setTree(buildTopicTree(areas)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar tópicos'))
      .finally(() => setLoading(false))
  }, [token])

  const totalTopics = useMemo(() => {
    let count = 0
    function walk(nodes: TopicTreeNode[]) {
      for (const node of nodes) {
        count += 1
        walk(node.children)
      }
    }
    walk(tree)
    return count
  }, [tree])

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Simulados"
        title="Explorar tópicos"
        description="Navegue pela árvore de tópicos do ENEM. Escolha um nível mais amplo ou um subtópico específico para praticar."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/simulados" className="text-accent hover:underline">
          ← Voltar para simulados
        </Link>
        {!loading && !error && (
          <span className="text-muted">{totalTopics} tópicos no índice</span>
        )}
      </div>

      {loading && <p className="text-muted">Carregando árvore de tópicos...</p>}
      {error && <p className="text-red-300">{error}</p>}

      {!loading && !error && tree.length === 0 && (
        <p className="text-muted">Nenhum tópico encontrado. Sincronize o índice de questões.</p>
      )}

      {!loading && !error && tree.length > 0 && (
        <section className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised/90 p-4 sm:p-6">
          <div className="space-y-1">
            {tree.map((node) => (
              <TopicTreeBranch key={node.path} node={node} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
