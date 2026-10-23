import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { navItems } from '../config/navigation'
import { useAuth } from '../contexts/AuthContext'
import { LayoutSidebarProvider } from '../contexts/LayoutSidebarContext'
import {
  SimulationQuizProvider,
  useSimulationQuizSidebarState,
} from '../contexts/SimulationQuizContext'
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react'
import { BrandMark } from './ui/BrandMark'
import { Button } from './ui/Button'
import { ThemeToggle } from './ui/ThemeToggle'
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
  const Icon = collapsed ? ChevronsRight : ChevronsLeft
  return <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
}

function DashboardLayoutContent() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const quizSidebar = useSimulationQuizSidebarState()

  const sidebarNarrow = sidebarCollapsed

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
    } catch {
      /* ignore quota / private mode */
    }
  }, [sidebarCollapsed])

  return (
    <LayoutSidebarProvider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
    <div
      className={cn(
        'relative overflow-x-hidden bg-surface text-foreground',
        quizSidebar ? 'min-h-dvh lg:h-dvh lg:overflow-hidden' : 'min-h-dvh',
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,var(--color-accent-glow),transparent_50%)]"
        aria-hidden
      />

      <div className={cn('relative flex w-full', quizSidebar ? 'min-h-dvh lg:h-dvh' : 'min-h-dvh')}>
        <aside
          className={cn(
            'hidden shrink-0 border-r border-border-subtle md:flex md:h-dvh md:max-h-dvh md:flex-col md:overflow-hidden md:bg-surface-raised/40 md:backdrop-blur-sm',
            !quizSidebar && 'md:sticky md:top-0',
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
              {!sidebarNarrow && (
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
            {sidebarNarrow && (
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
              'space-y-0.5',
              quizSidebar ? 'min-h-0 flex-1 overflow-y-auto' : 'shrink-0',
              sidebarNarrow ? 'px-2 py-2' : quizSidebar ? 'px-3 py-2' : 'p-3',
            )}
          >
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  title={sidebarNarrow ? item.label : undefined}
                  aria-label={sidebarNarrow ? item.label : undefined}
                  className={({ isActive }) => navLinkClass(isActive, sidebarNarrow)}
                >
                  {sidebarNarrow ? (
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                  ) : (
                    <>
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                        <span className="text-sm font-medium">{item.label}</span>
                      </span>
                      {!quizSidebar && (
                        <span className="mt-0.5 pl-7 text-xs opacity-75">{item.description}</span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div
            className={cn(
              'mt-auto shrink-0 space-y-2 border-t border-border-subtle p-3',
              sidebarNarrow && 'px-2',
            )}
          >
            <ThemeToggle compact={sidebarNarrow} />
            <Button
              variant="secondary"
              fullWidth={!sidebarNarrow}
              className={sidebarNarrow ? 'px-2' : undefined}
              onClick={() => signOut()}
              aria-label={sidebarNarrow ? 'Sair' : undefined}
              title={sidebarNarrow ? 'Sair' : undefined}
            >
              {sidebarNarrow ? (
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              ) : (
                'Sair'
              )}
            </Button>
          </div>
        </aside>

        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            quizSidebar && 'lg:min-h-0 lg:overflow-hidden',
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
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
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => navLinkClass(isActive, false)}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                        <span className="text-sm font-medium">{item.label}</span>
                      </span>
                    </NavLink>
                  )
                })}
              </nav>

              <ThemeToggle className="mt-4" />
              <Button variant="secondary" fullWidth className="mt-3" onClick={() => signOut()}>
                Sair
              </Button>
            </div>
          )}

          <main
            className={cn(
              'min-w-0 flex-1 px-3 sm:px-6 lg:px-8',
              quizSidebar
                ? 'py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:py-5 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden'
                : 'py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
    </LayoutSidebarProvider>
  )
}

export function DashboardLayout() {
  return (
    <SimulationQuizProvider>
      <DashboardLayoutContent />
    </SimulationQuizProvider>
  )
}
