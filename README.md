# Ideal Dating — Prototype (React + Vite + Tailwind + Framer Motion)

Romantic‑minimal dashboard for singles/couples with onboarding (email → password → verify → age ≥20 → profile), theme settings, discovery scoring, and couple unlock.

## Quickstart

```bash
# 1) Install deps
npm i

# 2) Run locally
npm run dev

# 3) Build for production
npm run build && npm run preview
```

## Deploy FREE (pick one)

- **Vercel** (recommended): import this folder in vercel.com → Framework preset: *Vite* → deploy.
- **Netlify**: new site from git → build cmd `npm run build`, publish dir `dist`.
- **Render (static)**: build `npm run build`, publish `dist`.
- **GitHub Pages**: use `peaceiris/actions-gh-pages` to push the `dist` folder.

## Notes

- Tailwind is preconfigured; classes are compiled from `src/**/*.{js,jsx}`.
- Framer Motion powers the subtle animations.
- Replace the inline demo matching with your real backend when ready.
