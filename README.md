# Mini Google Docs Clone

A collaborative document editor built with Next.js, TypeScript, Firebase, and Plate.js.

Live demo: _[add your Vercel URL here]_

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in your Firebase keys
pnpm dev
```

Full setup instructions (Firebase, auth, Firestore, env vars): **[SETUP.md](./SETUP.md)**

## What it does

- Sign up / login (email + Google OAuth)
- Create, rename, delete documents
- Rich text editing — bold, italic, underline, headings, lists
- Auto-save with 2s debounce, flushes on blur
- Realtime sync across tabs/users via Firestore listeners
- Share docs by email invite + copy link
- Download as PDF
- Dark/light theme
- Mobile responsive

## Tech stack

| Tech | Role |
|------|------|
| Next.js (App Router) | Framework, routing, API routes |
| TypeScript | Type safety |
| Firebase Auth + Firestore | Auth, database, realtime |
| Plate.js / Slate | Rich text editor |
| Resend | Email invites (optional) |
| Tailwind + ShadCN | Styling |

## Project structure

```
app/                    Pages & API routes
src/
  types/                TypeScript interfaces
  lib/
    db/                 Firebase config
    services/           Auth & document Firestore operations
    utils/              Helpers, error messages, access checks
  hooks/                Auto-save, realtime document hooks
  context/              Auth & workspace providers
  components/
    ui/                 Button, dialog, input, etc.
    layout/             Sidebar, top bar, providers
    editor/             Plate.js editor
    dashboard/          Document card
```

## Docs

- **[SETUP.md](./SETUP.md)** — How to set up and run the project
- **[PROJECT.md](./PROJECT.md)** — How I built it, tech decisions, trade-offs, what I'd improve
