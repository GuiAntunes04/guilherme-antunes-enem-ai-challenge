import type { LucideIcon } from 'lucide-react'
import { Bot, ClipboardList, LayoutDashboard, PenLine } from 'lucide-react'

export type NavItem = {
  label: string
  path: string
  description: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Visão geral dos seus estudos',
    icon: LayoutDashboard,
  },
  {
    label: 'Simulados',
    path: '/simulados',
    description: 'Questões reais de ENEMs anteriores',
    icon: ClipboardList,
  },
  {
    label: 'Tutor IA',
    path: '/tutor',
    description: 'Tire dúvidas de matérias e conteúdos',
    icon: Bot,
  },
  {
    label: 'Redação',
    path: '/redacao',
    description: 'Correção nas 5 competências do ENEM',
    icon: PenLine,
  },
]
