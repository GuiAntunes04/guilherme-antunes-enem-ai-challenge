import { Link } from 'react-router-dom'

type ComingSoonPageProps = {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
        Em breve
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-400">{description}</p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
        <p className="text-slate-400">
          Esta funcionalidade será implementada na próxima fase do projeto.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
