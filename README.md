# ENEM Prep AI

Plataforma web de estudos para o ENEM — desafio de estágio [Hyperflow](https://github.com/hyperflow-global/desafio-estagio).

## Demo

> Deploy em breve.

| Ambiente | URL |
|----------|-----|
| Frontend (Vercel) | _pendente_ |
| Backend (Render) | _pendente_ |

## Sobre o projeto

O **ENEM Prep AI** ajuda estudantes a se prepararem para o Exame Nacional do Ensino Médio com:

- **Simulados** com questões reais de provas anteriores, consumidas via [EnemHub API](https://docs.enemhub.com.br/enem/exemplos)
- **Tutor IA** (Google Gemini) para tirar dúvidas de matérias e conteúdos
- **Corretor de redação** com feedback baseado nas 5 competências do ENEM

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, Vite, Tailwind CSS, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Banco | Supabase (PostgreSQL) |
| IA | Google Gemini API |
| Deploy | Vercel (frontend) + Render (backend) |

## Estrutura do repositório

```
├── frontend/     # React + Vite + Tailwind
├── backend/      # Express + TypeScript
└── supabase/     # Migrations SQL (Fase 1)
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm
- Conta no [Supabase](https://supabase.com) (Fase 1)
- API Key da [EnemHub](https://docs.enemhub.com.br/enem/quickstart) (simulados)
- API Key do [Google AI Studio](https://aistudio.google.com/) (Fase 5)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Preencha no `backend/.env` (Supabase → Project Settings → API):

| Variável | Origem no Supabase |
|----------|-------------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SECRET_KEY` | Secret key (somente backend) |
| `SUPABASE_JWKS_URL` | JWKS URL (validação de JWT) |
| `ENEMHUB_API_KEY` | API Key do produto ENEM ([EnemHub](https://platform.enemhub.com.br)) |

O servidor sobe em `http://localhost:3001`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Preencha no `frontend/.env`:

| Variável | Origem no Supabase |
|----------|-------------------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (segura no browser) |

A aplicação abre em `http://localhost:5173`.

### Banco de dados (Supabase)

Após configurar o `.env`, aplique a migration inicial:

1. Supabase Dashboard → **SQL Editor**
2. Cole o arquivo `supabase/migrations/20250917100000_initial_schema.sql`
3. Execute a query

Instruções detalhadas em [`supabase/README.md`](supabase/README.md).

### Testar autenticação (após Fase 2)

Com um JWT válido do Supabase Auth:

```bash
curl http://localhost:3001/api/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Roadmap de desenvolvimento

- [x] **Fase 0** — Setup do monorepo (frontend + backend)
- [x] **Fase 1** — Supabase (schema, RLS, auth middleware)
- [x] **Fase 2** — Autenticação (login, registro, sessão)
- [x] **Fase 3** — Dashboard do estudante
- [x] **Fase 4** — Simulados com EnemHub API + histórico
- [ ] **Fase 5** — Tutor IA + Corretor de redação (Gemini)
- [ ] **Fase 6** — Deploy (Vercel + Render) + README final

## EnemHub API

Questões oficiais são obtidas via proxy no backend a partir de `https://api.enemhub.com.br/v1/enem/questions`.

Principais endpoints utilizados:

- `GET /v1/enem/questions?year=&page=&limit=` — listar questões (paginação até 100/página)
- `GET /v1/enem/questions/:id` — buscar questão por UUID

Documentação: [docs.enemhub.com.br](https://docs.enemhub.com.br/enem/exemplos)

> Plano Free: 5.000 requisições/mês. O backend faz cache em memória e retry automático em `429`.

## Licença

Projeto desenvolvido para fins educacionais e processo seletivo.
