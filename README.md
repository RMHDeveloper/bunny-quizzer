<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cbed5635-87fa-4b1c-8c2b-9814ae14980c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Google Gemini API key
   (get one free at https://aistudio.google.com/apikey; optionally set `VITE_GEMINI_MODEL`, default `gemini-flash-latest`)
3. Run the app:
   `npm run dev`

## Features

- **AI quizzes on any topic** — powered by Google Gemini, in 8 languages
  (English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada)
- **Streaming generation** — the first question appears while the rest are still being written
- **Timed mode** — optional 20-second countdown per question
- **50:50 hint** — remove two wrong options (limited uses per quiz)
- **Per-option explanations** — after answering, see why your choice and the correct choice are right or wrong
- **Bunny's Study Notes** — an AI summary of what to revise, based on the questions you missed
- **XP + bunny levels** — earn XP (scaled by difficulty), climb from Baby Bunny to Legend Bunny
- **Quiz of the Day** — a fresh topic every day, with your best score tracked
- **Topic suggestions** — quick-pick chips and a "Surprise me" button
- **Challenge a friend** — share a link containing the exact quiz; they try to beat your score

Progress (XP, history, daily best) is stored locally in the browser.
