import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'

type LayoutSidebarContextValue = {
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>
}

const LayoutSidebarContext = createContext<LayoutSidebarContextValue | null>(null)

export function LayoutSidebarProvider({
  value,
  children,
}: {
  value: LayoutSidebarContextValue
  children: ReactNode
}) {
  return (
    <LayoutSidebarContext.Provider value={value}>{children}</LayoutSidebarContext.Provider>
  )
}

export function useLayoutSidebar(): LayoutSidebarContextValue {
  const context = useContext(LayoutSidebarContext)
  if (!context) {
    throw new Error('useLayoutSidebar must be used within LayoutSidebarProvider')
  }
  return context
}
