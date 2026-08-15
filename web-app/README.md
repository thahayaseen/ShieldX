# A.E.G.I.S. Command Center Dashboard

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values.

```bash
cp .env.example .env.local
```

## Deploy to Vercel

1. Push `web-app/` folder to your repo
2. Connect to Vercel → set root directory to `web-app`
3. Add env vars in Vercel dashboard
4. Deploy

## Tech Stack

- Vite + React + TypeScript
- Vanilla CSS (design tokens in `src/styles/index.css`)
- Socket.IO Client (real-time updates)
- Supabase JS Client
- Axios (REST API calls)
- react-markdown (AI agent responses)
