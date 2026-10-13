const AUTH_ERROR_MESSAGES_PT: Record<string, string> = {
  'New password should be different from the old password.':
    'A nova senha deve ser diferente da senha atual.',
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'User already registered': 'Já existe uma conta com este e-mail.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Informe um e-mail válido.',
  'For security purposes, you can only request this once every 60 seconds':
    'Por segurança, aguarde 60 segundos antes de solicitar outro link.',
}

export function translateAuthError(message: string | undefined | null): string | null {
  if (!message) return null
  return AUTH_ERROR_MESSAGES_PT[message] ?? message
}
