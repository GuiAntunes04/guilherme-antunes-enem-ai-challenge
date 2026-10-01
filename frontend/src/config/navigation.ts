export type NavItem = {
  label: string
  path: string
  description: string
  /** Initial shown when the sidebar is collapsed */
  abbr: string
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Visão geral dos seus estudos',
    abbr: 'D',
  },
  {
    label: 'Simulados',
    path: '/simulados',
    description: 'Questões reais de ENEMs anteriores',
    abbr: 'S',
  },
  {
    label: 'Tutor IA',
    path: '/tutor',
    description: 'Tire dúvidas de matérias e conteúdos',
    abbr: 'T',
  },
  {
    label: 'Redação',
    path: '/redacao',
    description: 'Correção nas 5 competências do ENEM',
    abbr: 'R',
  },
]
