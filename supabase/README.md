# Supabase

## Aplicar migrations

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) do seu projeto
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo de `migrations/20250917100000_initial_schema.sql`
4. Clique em **Run**

## Tabelas criadas

| Tabela | Uso |
|--------|-----|
| `profiles` | Perfil do estudante (criado automaticamente no signup) |
| `simulation_attempts` | Histórico de simulados |
| `attempt_answers` | Respostas de cada simulado |
| `essays` | Redações enviadas ao corretor IA |
| `tutor_sessions` | Sessões do tutor IA |
| `tutor_messages` | Mensagens do chat com o tutor |

Todas as tabelas possuem **Row Level Security (RLS)** — cada usuário acessa apenas os próprios dados.
