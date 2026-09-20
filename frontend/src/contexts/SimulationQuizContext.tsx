import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type SimulationQuizSidebarState = {
  total: number
  currentIndex: number
  answers: Record<string, string>
  questionIds: string[]
  goToQuestion: (index: number) => void
}

type SimulationQuizContextValue = {
  sidebar: SimulationQuizSidebarState | null
  setSidebar: (state: SimulationQuizSidebarState | null) => void
}

const SimulationQuizContext = createContext<SimulationQuizContextValue | null>(null)

export function SimulationQuizProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<SimulationQuizSidebarState | null>(null)

  const value = useMemo(
    () => ({
      sidebar,
      setSidebar,
    }),
    [sidebar],
  )

  return (
    <SimulationQuizContext.Provider value={value}>{children}</SimulationQuizContext.Provider>
  )
}

function useSimulationQuizContext(): SimulationQuizContextValue {
  const context = useContext(SimulationQuizContext)
  if (!context) {
    throw new Error('useSimulationQuizContext must be used within SimulationQuizProvider')
  }
  return context
}

export function useSimulationQuizSidebar(state: SimulationQuizSidebarState | null): void {
  const { setSidebar } = useSimulationQuizContext()

  useEffect(() => {
    setSidebar(state)
    return () => setSidebar(null)
  }, [state, setSidebar])
}

export function useSimulationQuizSidebarState(): SimulationQuizSidebarState | null {
  return useSimulationQuizContext().sidebar
}
