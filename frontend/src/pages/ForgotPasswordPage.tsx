import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    const { error: resetError } = await requestPasswordReset(email)

    if (resetError) {
      setError(resetError)
      setSubmitting(false)
      return
    }

    setSuccess(
      'Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha.',
    )
    setSubmitting(false)
  }

  return (
    <AuthLayout
      title="Esqueci a senha"
      subtitle="Informe seu e-mail para receber o link de redefinição"
      navLink={{ to: '/login', label: 'Entrar' }}
      marketing={{
        eyebrow: 'Recuperação de acesso',
        headline: 'Volte aos estudos em poucos cliques',
        subheadline: 'Redefina sua senha com segurança pelo e-mail cadastrado.',
        body: (
          <>
            O link de redefinição é válido por tempo limitado. Se não encontrar o e-mail, verifique
            a caixa de spam.
          </>
        ),
        bullets: [
          'E-mail com link de redefinição',
          'Mesma conta para simulados, tutor e redação',
          'Verifique também a caixa de spam',
        ],
      }}
      footer={
        <>
          Lembrou a senha?{' '}
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
          label="E-mail"
          type="email"
          name="email"
          tone="light"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
          {submitting ? 'Enviando...' : 'Enviar link'}
        </Button>
      </form>
    </AuthLayout>
  )
}
