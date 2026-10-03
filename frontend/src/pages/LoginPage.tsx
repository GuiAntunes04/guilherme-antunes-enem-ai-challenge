import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para continuar estudando"
      navLink={{ to: '/register', label: 'Criar conta' }}
      marketing={{
        eyebrow: 'ENEM Prep AI',
        headline: 'Estude para o ENEM com simulados, tutor IA e redação',
        subheadline: 'Sua preparação em um só lugar.',
        body: (
          <>
            Faça simulados com questões reais, tire dúvidas com o tutor inteligente e receba
            correção de redação nas cinco competências do exame.
          </>
        ),
        bullets: [
          'Simulados por matéria ou prova completa',
          'Tutor IA contextualizado nas questões',
          'Redação com feedback C1–C5',
        ],
      }}
      footer={
        <>
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-accent-strong hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert tone="light" variant="error">
            {error}
          </Alert>
        )}

        <Input
          label="E-mail"
          type="email"
          name="email"
          tone="light"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Senha"
          type="password"
          name="password"
          tone="light"
          required
          autoComplete="current-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
