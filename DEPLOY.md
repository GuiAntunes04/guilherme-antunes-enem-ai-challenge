# Deploy — ENEM Prep AI

## Backend (Render)

1. Crie um **Web Service** no [Render](https://render.com/) conectado ao repositório GitHub
2. Use o blueprint [`render.yaml`](render.yaml) ou configure manualmente:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. Defina as variáveis de ambiente (ver [`backend/.env.example`](backend/.env.example))
4. Em `FRONTEND_URL`, inclua a URL do Vercel (pode ser lista separada por vírgula)

## Frontend (Vercel)

1. Importe o repositório no [Vercel](https://vercel.com/)
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_API_URL` → URL pública do backend Render

O arquivo [`frontend/vercel.json`](frontend/vercel.json) configura fallback SPA para React Router.

## Pós-deploy

1. Aplique todas as migrations listadas em [`supabase/README.md`](supabase/README.md)
2. Sincronize o índice EnemHub (uma vez):

```bash
cd backend
npm run sync:questions
```

3. Atualize `FRONTEND_URL` no Render com a URL final do Vercel
4. Teste: registro → simulado → tutor → redação
