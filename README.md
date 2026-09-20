# ENEM Prep AI

Plataforma web de estudos para o ENEM — desafio de estágio [Hyperflow](https://github.com/hyperflow-global/desafio-estagio).

## Demo

| Ambiente | URL |
|----------|-----|
| **Frontend (Vercel)** | _Configure após deploy — ver [DEPLOY.md](DEPLOY.md)_ |
| **Backend (Render)** | _Configure após deploy — ver [DEPLOY.md](DEPLOY.md)_ |

> Siga o guia em [`DEPLOY.md`](DEPLOY.md) para publicar frontend e backend. Após o deploy, substitua as URLs acima.

## Sobre o projeto

O **ENEM Prep AI** ajuda estudantes a se prepararem para o Exame Nacional do Ensino Médio com:

- **Simulados** com questões reais de provas anteriores (EnemHub), incluindo 1º dia, 2º dia, matéria específica e redação cronometrada
- **Tutor IA** (Google Gemini) para tirar dúvidas durante simulados ou em chat livre
- **Corretor de redação** com feedback nas 5 competências do ENEM, geração de temas e importação por foto/documento

## Uso da Inteligência Artificial

| Feature | Modelo | O que faz |
|---------|--------|-----------|
| **Tutor IA** | Gemini | Responde dúvidas em chat livre ou contextualizadas por questão do simulado (enunciado + alternativas) |
| **Tema de redação** | Gemini | Gera proposta dissertativa com textos motivadores no estilo ENEM |
| **Correção de redação** | Gemini | Avalia C1–C5 (0–200 cada) e nota total 0–1000 com comentários |
| **Import OCR** | Gemini | Extrai texto de fotos/PDFs/DOCX enviados pelo estudante |

## Screenshots

Adicione capturas em [`docs/screenshots/`](docs/screenshots/) antes da entrega:

- Login e registro
- Dashboard com estatísticas
- Simulado em andamento (com tutor lateral)
- Tutor IA com markdown/LaTeX
- Corretor de redação com feedback por competência

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, Vite, Tailwind CSS, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Banco | Supabase (PostgreSQL + Auth + RLS) |
| IA | Google Gemini API |
| Questões | EnemHub API |
| Deploy | Vercel (frontend) + Render (backend) |

## Estrutura do repositório

```
├── frontend/       # React + Vite + Tailwind
├── backend/        # Express + TypeScript
├── supabase/       # Migrations SQL
├── docs/           # Screenshots e documentação visual
├── render.yaml     # Blueprint Render (backend)
└── DEPLOY.md       # Guia de deploy
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm
- Conta no [Supabase](https://supabase.com)
- API Key da [EnemHub](https://docs.enemhub.com.br/enem/quickstart)
- API Key do [Google AI Studio](https://aistudio.google.com/)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Preencha no `backend/.env`:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | Project URL (Supabase → Settings → API) |
| `SUPABASE_SECRET_KEY` | Secret key (somente backend) |
| `SUPABASE_JWKS_URL` | `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `GEMINI_API_KEY` | Google AI Studio |
| `ENEMHUB_API_KEY` | EnemHub ENEM product |
| `FRONTEND_URL` | `http://localhost:5173` (pode ser lista separada por vírgula) |

O servidor sobe em `http://localhost:3001`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `VITE_API_URL` | `http://localhost:3001` |

A aplicação abre em `http://localhost:5173`.

### Banco de dados (Supabase)

Aplique **todas** as migrations na ordem listada em [`supabase/README.md`](supabase/README.md) (8 arquivos SQL).

### Índice de questões (sync único)

Após as migrations:

```bash
cd backend
npm run sync:questions
```

Indexa ~4.800 questões (metadados). O conteúdo completo é buscado na EnemHub sob demanda durante simulados.

Alternativa via API (autenticado): `POST /api/enem/sync`

### Testes

```bash
cd backend
npm test
```

## Roadmap de desenvolvimento

- [x] **Fase 0** — Setup do monorepo (frontend + backend)
- [x] **Fase 1** — Supabase (schema, RLS, auth middleware)
- [x] **Fase 2** — Autenticação (login, registro, sessão)
- [x] **Fase 3** — Dashboard do estudante
- [x] **Fase 4** — Simulados com EnemHub API + histórico
- [x] **Fase 5** — Tutor IA + Corretor de redação (Gemini)
- [ ] **Fase 6** — Deploy (Vercel + Render) + README final com URLs e screenshots

## EnemHub API

Questões oficiais via proxy no backend: `https://api.enemhub.com.br/v1/enem/questions`.

Documentação: [docs.enemhub.com.br](https://docs.enemhub.com.br/enem/exemplos)

> Plano Free: 5.000 requisições/mês. O sync inicial consome ~50 requests uma única vez.

## Licença

Projeto desenvolvido para fins educacionais e processo seletivo.
