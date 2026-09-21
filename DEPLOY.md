# Deploy — ENEM Prep AI

## Demo (produção)

| Ambiente | URL |
|----------|-----|
| **Frontend (Vercel)** | [enem-prep-ai.vercel.app](https://enem-prep-ai.vercel.app/) |
| **Backend (Render)** | [guilherme-antunes-enem-ai-challenge.onrender.com](https://guilherme-antunes-enem-ai-challenge.onrender.com) |

Health check do backend: `GET /api/health`

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
| `FRONTEND_URL` | `https://enem-prep-ai.vercel.app` (pode incluir `http://localhost:5173` separado por vírgula para dev local) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SECRET_KEY` | Secret key |
| `SUPABASE_JWKS_URL` | `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `GEMINI_API_KEY` | Google AI Studio |
| `ENEMHUB_API_KEY` | EnemHub — produto ENEM |

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
| `VITE_API_URL` | `https://guilherme-antunes-enem-ai-challenge.onrender.com` |

O arquivo [`frontend/vercel.json`](frontend/vercel.json) configura fallback SPA para React Router.

## Supabase Auth

Em **Authentication → URL Configuration**:

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://enem-prep-ai.vercel.app` |
| **Redirect URLs** | `https://enem-prep-ai.vercel.app/**`, `http://localhost:5173/**` |

Sem isso, o link de confirmação de e-mail pode redirecionar para `localhost`.

## Pós-deploy

1. Aplique todas as migrations listadas em [`supabase/README.md`](supabase/README.md) (10 arquivos SQL)
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

4. Confirme CORS: `FRONTEND_URL` no Render inclui a URL do Vercel
5. Teste o fluxo completo: registro → confirmação de e-mail → simulado → tutor → redação
