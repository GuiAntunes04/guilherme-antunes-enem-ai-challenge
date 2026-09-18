import { AppHeader } from '../components/AppHeader'
import { useAuth } from '../contexts/AuthContext'

const features = [
  {
    title: 'Simulados',
    description: 'Questões oficiais de ENEMs anteriores por área.',
    status: 'Em breve',
  },
  {
    title: 'Tutor IA',
    description: 'Tire dúvidas de matérias e conteúdos do vestibular.',
    status: 'Em breve',
  },
  {
    title: 'Corretor de redação',
    description: 'Feedback nas 5 competências do ENEM.',
    status: 'Em breve',
  },
]

export function HomePage() {
  const { profile, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader showLogout />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
            Área do estudante
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Olá, {profile?.name ?? 'estudante'}!
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            Bem-vindo à sua plataforma de estudos. Seu perfil está conectado
            {user?.email ? (
              <>
                {' '}
                ao e-mail <span className="text-slate-300">{user.email}</span>
              </>
            ) : (
              ''
            )}
            . Em breve você poderá fazer simulados, conversar com o tutor IA e
            enviar redações para correção.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-white">{feature.title}</h2>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {feature.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
