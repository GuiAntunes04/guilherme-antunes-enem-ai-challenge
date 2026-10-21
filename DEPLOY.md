# Deploy — ENEM Prep AI

## Demo (produção do autor)

| Ambiente | URL |
|----------|-----|
| **Frontend** | [enemprep-ai.com.br](https://enemprep-ai.com.br/) · [enem-prep-ai.vercel.app](https://enem-prep-ai.vercel.app/) |
| **Backend (Render)** | [guilherme-antunes-enem-ai-challenge.onrender.com](https://guilherme-antunes-enem-ai-challenge.onrender.com) |

Health check do backend: `GET /api/health`

Ao fazer fork/deploy próprio, substitua essas URLs pelas suas em Supabase Auth, `FRONTEND_URL`, `VITE_API_URL` e CORS.

## Backend (Render)

1. Crie um **Web Service** no [Render](https://render.com/) conectado ao repositório GitHub
2. Use o blueprint [`render.yaml`](render.yaml) ou configure manualmente:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Defina as variáveis de ambiente (ver [`backend/.env.example`](backend/.env.example))

| Variável | Produção |
|----------|----------|
| `FRONTEND_URL` | URL(s) do frontend, separadas por vírgula (ex.: `https://enemprep-ai.com.br,https://enem-prep-ai.vercel.app,http://localhost:5173`) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SECRET_KEY` | Secret key |
| `SUPABASE_JWKS_URL` | `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `GEMINI_API_KEY` | Google AI Studio |
| `ENEMHUB_API_KEY` | EnemHub — produto ENEM |
| `QUESTION_INDEX_SYNC_SECRET` | (Opcional) Secret para `POST /api/enem/sync` |

## Frontend (Vercel)

1. Importe o repositório no [Vercel](https://vercel.com/)
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Variáveis de ambiente:

| Variável | Produção |
|----------|----------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `VITE_API_URL` | URL pública do backend Render (ex.: `https://guilherme-antunes-enem-ai-challenge.onrender.com`) |

O arquivo [`frontend/vercel.json`](frontend/vercel.json) configura fallback SPA para React Router.

### Domínio customizado (opcional)

No Registro.br (ou outro DNS): **A** `@` → IP da Vercel (ex.: `76.76.21.21`); **CNAME** `www` → `cname.vercel.app`. Adicione o domínio no projeto Vercel e inclua a URL em `FRONTEND_URL` no Render e nas Redirect URLs do Supabase.

## Supabase Auth

Em **Authentication → URL Configuration**, use a URL canônica do **seu** frontend:

| Campo | Exemplo (demo) |
|-------|----------------|
| **Site URL** | `https://enemprep-ai.com.br` |
| **Redirect URLs** | `https://enemprep-ai.com.br/**`, `https://enem-prep-ai.vercel.app/**`, `http://localhost:5173/**` |

Sem isso, o link de confirmação de e-mail pode redirecionar para `localhost`.

## Pós-deploy

1. Aplique todas as migrations listadas em [`supabase/README.md`](supabase/README.md) (12 arquivos SQL)
2. Verifique o schema:

```bash
cd backend
npm run verify:schema
```

3. Sincronize o índice EnemHub (uma vez):

```bash
cd backend
npm run sync:questions
```

4. Confirme CORS: `FRONTEND_URL` no Render inclui todas as origens do frontend
5. Teste o fluxo completo: registro → confirmação de e-mail → simulado → tutor → redação
