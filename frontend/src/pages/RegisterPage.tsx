import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    const { error: signUpError, needsEmailConfirmation } = await signUp(
      name,
      email,
      password,
    )

    if (signUpError) {
      setError(signUpError)
      setSubmitting(false)
      return
    }

    if (needsEmailConfirmation) {
      setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a se preparar para o ENEM hoje"
      navLink={{ to: '/login', label: 'Entrar' }}
      marketing={{
        eyebrow: 'Comece grátis',
        headline: 'Monte sua rotina de estudos com apoio de IA',
        subheadline: 'Cadastro rápido, foco no que importa para a prova.',
        body: (
          <>
            Crie sua conta e acesse simulados, chat com tutor e correção de redação alinhados ao
            formato do ENEM.
          </>
        ),
        bullets: [
          'Dashboard com evolução por matéria',
          'Cronômetro nos simulados',
          'Temas e correção de redação com IA',
        ],
      }}
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-accent-strong hover:underline">
            Entrar
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
        {success && (
          <Alert tone="light" variant="success">
            {success}
          </Alert>
        )}

        <Input
          label="Nome"
          type="text"
          name="name"
          tone="light"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Mínimo de 6 caracteres"
        />

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
