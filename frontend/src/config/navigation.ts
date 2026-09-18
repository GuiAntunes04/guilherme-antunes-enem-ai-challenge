export type NavItem = {
  label: string
  path: string
  description: string
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Visão geral dos seus estudos',
  },
  {
    label: 'Simulados',
    path: '/simulados',
    description: 'Questões reais de ENEMs anteriores',
  },
  {
    label: 'Tutor IA',
    path: '/tutor',
    description: 'Tire dúvidas de matérias e conteúdos',
  },
  {
    label: 'Redação',
    path: '/redacao',
    description: 'Correção nas 5 competências do ENEM',
  },
]
