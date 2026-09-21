# Supabase

## Aplicar migrations

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) do seu projeto
2. Vá em **SQL Editor** → **New query**
3. Cole e execute, **nesta ordem**:

| # | Arquivo |
|---|---------|
| 1 | `migrations/20250917100000_initial_schema.sql` |
| 2 | `migrations/20250917200000_add_question_indices.sql` (legado) |
| 3 | `migrations/20250918100000_enemhub_question_ids.sql` |
| 4 | `migrations/20250918200000_simulation_modes_and_timer.sql` |
| 5 | `migrations/20250918300000_enem_questions_index.sql` |
| 6 | `migrations/20250919100000_tutor_simulation_context.sql` |
| 7 | `migrations/20250919110000_quiz_started_at.sql` |
| 8 | `migrations/20250919200000_essay_simulation.sql` |
| 9 | `migrations/20250921100000_question_index_correct_alternative.sql` |
| 10 | `migrations/20250921120000_question_index_content.sql` |

> A migration `20250919200000` usa `drop policy if exists` antes de recriar a policy de update em `essays`, permitindo reexecução segura no Supabase Preview.

## Tabelas criadas

| Tabela | Uso |
|--------|-----|
| `profiles` | Perfil do estudante (criado automaticamente no signup) |
| `simulation_attempts` | Histórico de simulados |
| `attempt_answers` | Respostas de cada simulado |
| `enem_questions_index` | Cache local das questões EnemHub (sync via `npm run sync:questions`) |
| `essays` | Redações enviadas ao corretor IA |
| `tutor_sessions` | Sessões do tutor IA |
| `tutor_messages` | Mensagens do chat com o tutor |

Todas as tabelas possuem **Row Level Security (RLS)** — cada usuário acessa apenas os próprios dados.
