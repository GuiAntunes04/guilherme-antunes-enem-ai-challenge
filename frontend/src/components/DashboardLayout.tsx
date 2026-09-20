import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { SimulationAnswerSheet } from './simulation/SimulationAnswerSheet'
import { navItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'
import {
  SimulationQuizProvider,
  useSimulationQuizSidebarState,
} from '../contexts/SimulationQuizContext'

function navLinkClass(isActive: boolean) {
  return [
    'flex flex-col rounded-lg px-3 py-2.5 transition',
    isActive
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
  ].join(' ')
}

function DashboardLayoutContent() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const quizSidebar = useSimulationQuizSidebarState()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
          <div
            className={`shrink-0 border-b border-slate-800 px-6 ${quizSidebar ? 'py-3' : 'py-5'}`}
          >
            <Link to="/" className="text-lg font-semibold tracking-tight text-white">
              ENEM Prep AI
            </Link>
            {profile && (
              <p className="mt-1 truncate text-sm text-slate-400">{profile.name}</p>
            )}
          </div>

          <nav className={`shrink-0 space-y-0.5 ${quizSidebar ? 'px-3 py-2' : 'p-4'}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span className="text-sm font-medium">{item.label}</span>
                {!quizSidebar && (
                  <span className="mt-0.5 text-xs opacity-70">{item.description}</span>
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

          <div className={`shrink-0 border-t border-slate-800 ${quizSidebar ? 'p-3' : 'mt-auto p-4'}`}>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-4 md:hidden">
            <Link to="/" className="text-lg font-semibold text-white">
              ENEM Prep AI
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300"
              aria-expanded={menuOpen}
              aria-label="Abrir menu"
            >
              Menu
            </button>
          </header>

          {menuOpen && (
            <div className="border-b border-slate-800 p-4 md:hidden">
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
                <div className="mt-4 border-t border-slate-800 pt-4">
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

              <button
                type="button"
                onClick={() => signOut()}
                className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
              >
                Sair
              </button>
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
