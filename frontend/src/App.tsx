function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            ENEM Prep AI
          </span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Em desenvolvimento
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
            Plataforma de estudos para o ENEM
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simulados reais, tutor IA e correção de redação
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            Questões de provas anteriores via{' '}
            <a
              href="https://docs.enem.dev/introduction"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline-offset-4 hover:underline"
            >
              API ENEM
            </a>
            , com apoio do Google Gemini para tirar dúvidas e corrigir suas
            redações.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Simulados',
              description: 'Questões oficiais de ENEMs anteriores por área.',
            },
            {
              title: 'Tutor IA',
              description: 'Tire dúvidas de matérias e conteúdos do vestibular.',
            },
            {
              title: 'Corretor de redação',
              description: 'Feedback nas 5 competências do ENEM.',
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <h2 className="font-semibold text-white">{feature.title}</h2>
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

export default App
