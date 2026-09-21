# ENEM Prep AI

Plataforma web de estudos para o ENEM — desafio de estágio [Hyperflow](https://github.com/hyperflow-global/desafio-estagio).

## Demo

| Ambiente | URL |
|----------|-----|
| **Frontend (Vercel)** | _Adicionar após deploy — ver [DEPLOY.md](DEPLOY.md)_ |
| **Backend (Render)** | _Adicionar após deploy — ver [DEPLOY.md](DEPLOY.md)_ |

> Siga o guia em [`DEPLOY.md`](DEPLOY.md) para publicar frontend e backend. Substitua as URLs acima antes da entrega.

## Sobre o projeto

O **ENEM Prep AI** ajuda estudantes a se prepararem para o Exame Nacional do Ensino Médio com:

- **Simulados** com questões reais (EnemHub): prática por matéria ou tópico, 1º dia (90 questões), 2º dia (90 questões) e redação cronometrada
- **Tutor IA** (Google Gemini) em chat livre ou contextualizado por questão durante o simulado
- **Corretor de redação** com feedback nas 5 competências do ENEM, geração de temas e importação por foto/PDF/DOCX
- **Dashboard** com simulados realizados, redações enviadas, conversas com tutor, gráfico de evolução e desempenho por matéria

### Modos de simulado

| Modo | Descrição |
|------|-----------|
| Matéria específica | Questões aleatórias por matéria ENEM ou tópico, com cronômetro opcional |
| 1º dia ENEM | 90 questões — Linguagens + Humanas |
| 2º dia ENEM | 90 questões — Natureza + Matemática |
| Redação ENEM | Tema gerado pela IA, correção nas 5 competências |

## Uso da Inteligência Artificial

| Feature | Modelo | O que faz |
|---------|--------|-----------|
| **Tutor IA** | Gemini | Responde dúvidas em chat livre ou no contexto da questão atual do simulado |
| **Tema de redação** | Gemini | Gera proposta dissertativa com textos motivadores no estilo ENEM |
| **Correção de redação** | Gemini | Avalia C1–C5 (0–200 cada) e nota total 0–1000 com comentários |
| **Import OCR** | Gemini | Extrai texto de fotos/PDFs/DOCX enviados pelo estudante |

## Screenshots

Capturas e GIFs em [`docs/screenshots/`](docs/screenshots/):

| Arquivo | Conteúdo |
|---------|----------|
| `login.png` | Login e registro |
| `dashboard.png` | Dashboard com estatísticas |
| `simulado.png` | Simulado em andamento (tutor lateral) |
| `tutor.png` | Tutor IA com markdown/LaTeX |
| `redacao.png` | Corretor de redação com feedback por competência |

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, Vite, Tailwind CSS, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Banco | Supabase (PostgreSQL + Auth + RLS) |
| IA | Google Gemini API |
| Questões | EnemHub API (sync) + cache local no Supabase |
| Deploy | Vercel (frontend) + Render (backend) |

## Arquitetura das questões

O backend sincroniza o acervo EnemHub para a tabela `enem_questions_index` no Supabase:

- **Metadados** — ano, matéria, tópico, dificuldade, gabarito
- **Conteúdo** — enunciado e alternativas (JSONB)

Durante simulados, as questões são servidas **do Supabase**, evitando o rate limit da EnemHub (10 req/min no plano Free). A API EnemHub é usada apenas no sync inicial e como fallback pontual.

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
- API Key da [EnemHub](https://docs.enemhub.com.br/enem/quickstart) (produto ENEM)
- API Key do [Google AI Studio](https://aistudio.google.com/)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | Project URL (Supabase → Settings → API) |
| `SUPABASE_SECRET_KEY` | Secret key (somente backend) |
| `SUPABASE_JWKS_URL` | `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | Modelo Gemini (padrão: `gemini-3.5-flash-lite`) |
| `ENEMHUB_API_KEY` | EnemHub — produto ENEM |
| `FRONTEND_URL` | `http://localhost:5173` (lista separada por vírgula para CORS) |

Servidor: `http://localhost:3001`

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

Aplicação: `http://localhost:5173`

### Banco de dados (Supabase)

Aplique **todas** as migrations na ordem em [`supabase/README.md`](supabase/README.md) (10 arquivos SQL).

Verifique o schema após aplicar:

```bash
cd backend
npm run verify:schema
```

### Índice de questões (sync único)

Após as migrations:

```bash
cd backend
npm run sync:questions
```

Indexa ~4.800 questões com metadados, gabarito e conteúdo completo. Consome ~50 requisições à EnemHub (listagem paginada, 100 por página).

Alternativa via API autenticada: `POST /api/enem/sync`

> Reexecute o sync após atualizar migrations que alterem `enem_questions_index`.

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
- [x] **Fase 4** — Simulados com EnemHub + histórico
- [x] **Fase 5** — Tutor IA + Corretor de redação (Gemini)
- [ ] **Fase 6** — Deploy (Vercel + Render) + URLs e screenshots no README

## EnemHub API

Proxy no backend: `https://api.enemhub.com.br/v1/enem/questions`

Documentação: [docs.enemhub.com.br](https://docs.enemhub.com.br/enem/exemplos)

| Limite (Free) | Valor |
|---------------|-------|
| Requisições/mês | 5.000 |
| Requisições/min | 10 |

O sync inicial usa a API de listagem (~50 requests). Simulados em produção leem do Supabase.

## Licença

Projeto desenvolvido para fins educacionais e processo seletivo.
