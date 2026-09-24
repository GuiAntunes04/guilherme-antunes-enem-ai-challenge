import { useState } from 'react'
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

function navLinkClass(isActive: boolean) {
  return cn(
    'relative flex flex-col rounded-lg px-3 py-2.5 transition',
    isActive
      ? 'bg-accent/10 text-accent'
      : 'text-muted hover:bg-surface-overlay hover:text-foreground',
    isActive &&
      'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-accent',
  )
}

function DashboardLayoutContent() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const quizSidebar = useSimulationQuizSidebarState()

  return (
    <div className="relative min-h-screen bg-surface text-foreground">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,var(--color-accent-glow),transparent_50%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-border-subtle md:sticky md:top-0 md:flex md:h-screen md:flex-col md:bg-surface-raised/40 md:backdrop-blur-sm">
          <div
            className={cn(
              'shrink-0 border-b border-border-subtle px-5',
              quizSidebar ? 'py-3' : 'py-5',
            )}
          >
            <BrandMark to="/" />
            {profile && (
              <p className="mt-3 truncate text-sm text-muted">{profile.name}</p>
            )}
          </div>

          <nav className={cn('shrink-0 space-y-0.5', quizSidebar ? 'px-3 py-2' : 'p-3')}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span className="text-sm font-medium">{item.label}</span>
                {!quizSidebar && (
                  <span className="mt-0.5 text-xs opacity-75">{item.description}</span>
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
            )}
          >
            <Button variant="secondary" fullWidth onClick={() => signOut()}>
              Sair
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
                    className={({ isActive }) => navLinkClass(isActive)}
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
