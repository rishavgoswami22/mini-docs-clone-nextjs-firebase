# Mini Google Docs Clone

A simplified collaborative document editor built with Next.js (App Router), TypeScript, Firebase, and Plate.js.

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Firebase web app keys
3. In the [Firebase console](https://console.firebase.google.com):
   - Enable **Authentication** (Email/Password + Google)
   - Create a **Firestore** database (Standard edition)
   - Paste the contents of `firestore.rules` into Firestore > Rules
4. Install and run:
   ```bash
   pnpm install
   pnpm dev
   ```

## Deploying to Vercel

- Add all `NEXT_PUBLIC_*` env vars plus `RESEND_API_KEY` in Vercel project settings
- Add your Vercel domain to Firebase Auth > Authorized domains

## Tech Stack

| Tech | Why |
|------|-----|
| **Next.js (App Router)** | File-based routing, layouts, API routes in one framework |
| **TypeScript** | Type safety across the whole codebase |
| **Firebase Auth + Firestore** | Auth with zero backend, Firestore listeners for realtime |
| **Plate.js** | Rich text editor built on Slate — used with a custom minimal toolbar |
| **Resend** | Email invites when sharing docs (optional, works without it) |
| **next-themes** | Dark/light mode toggle |
| **ShadCN / Radix UI** | Accessible UI primitives |

## What's implemented

- **Auth**: Email/password signup + login, Google OAuth, persistent sessions
- **Documents**: Create, rename, delete, list (sidebar + dashboard grid)
- **Rich text editor**: Bold, italic, underline, H1/H2, bullet lists, numbered lists
- **Auto-save**: 2s debounce after typing stops, immediate flush on blur/tab switch
- **Save status**: Shows Saving/Saved/Error in the editor header
- **Realtime sync**: Firestore `onSnapshot` — edits from other tabs/users show up live
- **Sharing**: Invite by email, copy link, collaborator access via Firestore rules
- **Email invites**: Sends a link via Resend (falls back gracefully without API key)
- **Download as PDF**: Print-friendly export from the editor
- **Dark mode**: System-aware with manual toggle
- **Mobile responsive**: Hamburger menu + slide-out sidebar on small screens
- **Error handling**: Global error boundary, 404 page, Firestore permission errors handled

## Project Structure

```
app/                    Pages & routes (Next.js)
  api/                  Backend API routes
src/
  types/                Interfaces & type definitions
  lib/
    db/                 Firebase configuration
    services/           Auth & document Firestore operations
    utils/              Helpers (class merger, normalization, access checks)
  hooks/                Custom React hooks (auto-save, realtime doc)
  context/              Auth & workspace state providers
  components/
    ui/                 Primitive UI components (button, dialog, input, etc.)
    layout/             App shell (sidebar, top bar, providers)
    editor/             Plate.js rich text editor
    dashboard/          Document card component
```

## Trade-offs

- **Sync model**: Last write wins — no OT/CRDT. Fine for the "simple sync" requirement.
- **Roles**: The data model supports viewer/editor but Firestore rules currently treat all collaborators as editors.
- **Email delivery**: Resend free tier only sends to your own email without a verified domain. Sharing via Firestore still works regardless.
