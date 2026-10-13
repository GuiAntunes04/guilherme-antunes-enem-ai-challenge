import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { PasswordInput } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, loading, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError)
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return (
      <AuthLayout
        title="Link inválido ou expirado"
        subtitle="Solicite um novo link para redefinir sua senha"
        navLink={{ to: '/login', label: 'Entrar' }}
        marketing={{
          eyebrow: 'Recuperação de acesso',
          headline: 'Não foi possível abrir a redefinição',
          subheadline: 'Links de senha expiram após algum tempo.',
          body: (
            <>
              Volte à tela de recuperação, informe seu e-mail novamente e use o link mais recente
              que receber.
            </>
          ),
        }}
        footer={
          <>
            <Link to="/forgot-password" className="font-medium text-accent-strong hover:underline">
              Solicitar novo link
            </Link>
          </>
        }
      >
        <Alert tone="light" variant="error">
          Abra o link enviado por e-mail ou peça um novo envio.
        </Alert>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Nova senha"
      subtitle="Escolha uma senha segura para sua conta"
      navLink={{ to: '/login', label: 'Entrar' }}
      marketing={{
        eyebrow: 'Quase lá',
        headline: 'Defina sua nova senha',
        subheadline: 'Depois disso você já pode continuar estudando.',
        body: (
          <>
            Use pelo menos 6 caracteres. Evite reutilizar senhas de outros serviços.
          </>
        ),
      }}
      footer={
        <>
          <Link to="/login" className="font-medium text-accent-strong hover:underline">
            Voltar ao login
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

        <PasswordInput
          label="Nova senha"
          name="password"
          tone="light"
          required
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Mínimo de 6 caracteres"
        />

        <PasswordInput
          label="Confirmar senha"
          name="confirmPassword"
          tone="light"
          required
          autoComplete="new-password"
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
          {submitting ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthLayout>
  )
}
