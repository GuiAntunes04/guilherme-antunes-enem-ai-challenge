import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { SimulationAnswerSheet } from './simulation/SimulationAnswerSheet'
import { navItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'
import {
  SimulationQuizProvider,
  useSimulationQuizSidebarState,
} from '../contexts/SimulationQuizContext'
import { BrandMark } from './ui/BrandMark'
import { Button } from './ui/Button'
import { cn } from '../lib/cn'

const SIDEBAR_COLLAPSED_KEY = 'enem-prep-sidebar-collapsed'

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function navLinkClass(isActive: boolean, collapsed: boolean) {
  return cn(
    'relative rounded-lg transition motion-reduce:transition-none',
    collapsed
      ? 'flex items-center justify-center px-2 py-2.5'
      : 'flex flex-col px-3 py-2.5',
    isActive
      ? 'bg-accent/10 text-accent'
      : 'text-muted hover:bg-surface-overlay hover:text-foreground',
    isActive &&
      !collapsed &&
      'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-accent',
    isActive && collapsed && 'ring-1 ring-accent/40',
  )
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {collapsed ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="m14 9 3 3-3 3" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="m13 9-3 3 3 3" />
        </>
      )}
    </svg>
  )
}

function DashboardLayoutContent() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const quizSidebar = useSimulationQuizSidebarState()

  const sidebarNarrow = sidebarCollapsed && !quizSidebar

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
    } catch {
      /* ignore quota / private mode */
    }
  }, [sidebarCollapsed])

  return (
    <div className="relative min-h-screen bg-surface text-foreground">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,var(--color-accent-glow),transparent_50%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        <aside
          className={cn(
            'hidden shrink-0 border-r border-border-subtle md:sticky md:top-0 md:flex md:h-screen md:flex-col md:bg-surface-raised/40 md:backdrop-blur-sm',
            'transition-[width] duration-200 ease-out motion-reduce:transition-none',
            sidebarNarrow ? 'w-[4.5rem]' : 'w-64',
          )}
        >
          <div
            className={cn(
              'shrink-0 border-b border-border-subtle',
              sidebarNarrow ? 'flex flex-col items-center gap-2 px-2 py-3' : 'px-5',
              !sidebarNarrow && (quizSidebar ? 'py-3' : 'py-5'),
            )}
          >
            <div
              className={cn(
                'flex w-full items-center',
                sidebarNarrow ? 'justify-center' : 'justify-between gap-2',
              )}
            >
              <BrandMark to="/" compact={sidebarNarrow} className={sidebarNarrow ? 'justify-center' : undefined} />
              {!quizSidebar && !sidebarNarrow && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2"
                  onClick={() => setSidebarCollapsed(true)}
                  aria-expanded
                  aria-label="Recolher menu lateral"
                >
                  <SidebarToggleIcon collapsed={false} />
                </Button>
              )}
            </div>
            {!quizSidebar && sidebarNarrow && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={() => setSidebarCollapsed(false)}
                aria-expanded={false}
                aria-label="Expandir menu lateral"
              >
                <SidebarToggleIcon collapsed />
              </Button>
            )}
            {profile && !sidebarNarrow && (
              <p className="mt-3 truncate text-sm text-muted">{profile.name}</p>
            )}
          </div>

          <nav
            className={cn(
              'shrink-0 space-y-0.5',
              sidebarNarrow ? 'px-2 py-2' : quizSidebar ? 'px-3 py-2' : 'p-3',
            )}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={sidebarNarrow ? item.label : undefined}
                aria-label={sidebarNarrow ? item.label : undefined}
                className={({ isActive }) => navLinkClass(isActive, sidebarNarrow)}
              >
                {sidebarNarrow ? (
                  <span className="text-xs font-bold tabular-nums">{item.abbr}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {!quizSidebar && (
                      <span className="mt-0.5 text-xs opacity-75">{item.description}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {quizSidebar && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SimulationAnswerSheet
                total={quizSidebar.total}
                currentIndex={quizSidebar.currentIndex}
                answers={quizSidebar.answers}
                questionIds={quizSidebar.questionIds}
                goToQuestion={quizSidebar.goToQuestion}
              />
            </div>
          )}

          <div
            className={cn(
              'shrink-0 border-t border-border-subtle',
              quizSidebar ? 'p-3' : 'mt-auto p-3',
              sidebarNarrow && 'px-2',
            )}
          >
            <Button
              variant="secondary"
              fullWidth={!sidebarNarrow}
              className={sidebarNarrow ? 'px-2' : undefined}
              onClick={() => signOut()}
              aria-label={sidebarNarrow ? 'Sair' : undefined}
              title={sidebarNarrow ? 'Sair' : undefined}
            >
              {sidebarNarrow ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              ) : (
                'Sair'
              )}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border-subtle px-4 py-4 md:hidden">
            <BrandMark to="/" compact />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Abrir menu"
            >
              Menu
            </Button>
          </header>

          {menuOpen && (
            <div className="border-b border-border-subtle bg-surface-raised/95 p-4 md:hidden">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => navLinkClass(isActive, false)}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {quizSidebar && (
                <div className="mt-4 border-t border-border-subtle pt-4">
                  <SimulationAnswerSheet
                    compact
                    total={quizSidebar.total}
                    currentIndex={quizSidebar.currentIndex}
                    answers={quizSidebar.answers}
                    questionIds={quizSidebar.questionIds}
                    goToQuestion={(index) => {
                      quizSidebar.goToQuestion(index)
                      setMenuOpen(false)
                    }}
                  />
                </div>
              )}

              <Button variant="secondary" fullWidth className="mt-4" onClick={() => signOut()}>
                Sair
              </Button>
            </div>
          )}

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <SimulationQuizProvider>
      <DashboardLayoutContent />
    </SimulationQuizProvider>
  )
}
