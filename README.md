<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Bunny Quizzer

An AI quiz app (React + Vite + TypeScript). Quiz generation runs through a
Vercel Edge Function ([api/generate.ts](api/generate.ts)) so the Gemini API
key stays on the server and never reaches the browser.

## Run locally

**Prerequisites:** Node.js

1. `npm install`
2. Create `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here          # get one free at https://aistudio.google.com/apikey
   GEMINI_MODEL=gemini-flash-latest      # optional
   ```
   (server-side names — no `VITE_` prefix)
3. `npm run dev` — the dev server runs the `/api/generate` function via a
   small Vite middleware, so `npm run dev` is enough (no `vercel dev` needed).

## Deploy on Vercel

1. Import the repo (framework auto-detects as Vite).
2. Project → Settings → **Environment Variables**: add `GEMINI_API_KEY`
   (and optionally `GEMINI_MODEL`) for all environments.
3. Redeploy. The `api/` folder is deployed as an Edge Function automatically.

## Features

- **AI quizzes on any topic** — powered by Google Gemini, in 8 languages
  (English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada)
- **Streaming generation** — the first question appears while the rest are still being written
- **Every question is timed** — a 20-second countdown, auto-reveal on timeout
- **50:50 hint** — remove two wrong options (limited uses per quiz)
- **Per-option explanations** — after answering, every option shows why it is right or wrong
- **Bunny's Study Notes** — an AI summary of what to revise, based on the questions you missed
- **XP + bunny levels** — earn XP (scaled by difficulty), climb from Baby Bunny to Legend Bunny
- **Quiz of the Day** — a fresh topic every day, with your best score tracked
- **Surprise me** — one-tap random topic
- **Challenge a friend** — share a link containing the exact quiz; they try to beat your score

Progress (XP, history, daily best) is stored locally in the browser.
