# Project Notes

How I built this, what I was thinking, and what I'd do differently with more time.

## The idea

Build a mini Google Docs — realtime-ish doc editing with auth, sharing, and a rich text editor. The spec asked for Next.js + Firebase + Plate.js, so that's what I used.

## How I approached it

I started with the boring stuff first — Firebase setup, auth flow, basic routing. Then built outward:

1. **Auth first** — email/password + Google sign-in. Used Firebase Auth with `onAuthStateChanged` to keep track of the session. Wrapped it in a React context so any component can check who's logged in.

2. **Document CRUD** — Firestore collection called `documents`. Each doc stores title, content (Plate.js JSON), owner ID, timestamps, and a collaborators list. Built a service layer (`DocumentService`) to keep all the Firestore calls in one place instead of scattering `updateDoc` everywhere.

3. **Editor** — Plate.js on top of Slate. I didn't use the full plugin system because it felt heavy for what I needed. Instead I wrote a small custom toolbar (B/I/U, headings, lists) and wired up the Slate transforms directly. Not the prettiest code but it works and I understand every line of it.

4. **Auto-save** — Debounced at 2 seconds. The hook merges pending changes (so if you change the title and body before the timer fires, both go in one write). It also flushes immediately when you switch tabs or blur the window — no lost work.

5. **Realtime** — Firestore `onSnapshot` on the open document. When someone else edits, the snapshot fires and the editor updates. The tricky part was avoiding a loop: you save → Firestore echoes back your own write → you don't want to reset the editor. Solved it with a fingerprint ref — if the incoming content matches what you last wrote, skip the update.

6. **Sharing** — Owner can invite by email. This adds the email to a `sharedWith` array on the doc. Firestore rules check that array for read/write access. The sidebar query uses `array-contains` to show shared docs alongside your own. Optionally sends an email via Resend with a direct link.

7. **PDF export** — Opens a new window with clean HTML (just the editor content + title), triggers `window.print()`. The browser's print dialog handles the PDF conversion. Quick and works everywhere.

8. **Dark mode** — `next-themes` with system preference detection. Toggle in the sidebar.

## Tech decisions

**Why Firebase over Supabase?** The spec listed both. I went with Firebase because I've used it before and `onSnapshot` gives you realtime with zero extra setup. Supabase Realtime would work too but I'd need to learn their specific API.

**Why custom Plate toolbar?** Plate has an official toolbar plugin system but it pulls in a lot of dependencies and opinions about styling. I just needed bold/italic/underline/headings/lists, so I wrote toggle functions using the Slate API directly. Fewer moving parts.

**Why Resend for email?** Needed something with a free tier that I could call from a Next.js API route. Resend has a simple SDK and the free plan gives 100 emails/day. The invite still works without it — it just saves to Firestore without sending the notification.

**Why not OT/CRDT?** The spec said "simple sync is sufficient." Last-write-wins with Firestore listeners is good enough for a demo. If two people type at the exact same second, the last save wins. In practice with the 2s debounce, conflicts are rare.

## Folder structure reasoning

I moved everything into `src/` to keep the root clean. Inside:

- `src/types/` — all TypeScript interfaces in one place
- `src/lib/db/` — Firebase init. Separate from services so it's obvious where the DB config lives.
- `src/lib/services/` — auth and document operations. These are plain objects with async methods, no React.
- `src/lib/utils/` — pure functions (class merger, content normalization, error messages, access checks)
- `src/hooks/` — React hooks for auto-save and realtime subscriptions
- `src/context/` — auth state and workspace doc list providers
- `src/components/` — split into `ui/` (primitives), `layout/` (sidebar, topbar), `editor/`, and `dashboard/`

The `app/` folder only has pages and API routes. No business logic in there — just wiring components together.

## What I'd improve with more time

- **Proper roles** — the data model has viewer/editor but I didn't enforce viewer-only in the UI or rules. Would need a read-only editor mode and tighter Firestore rules.
- **Presence indicators** — show who else is currently viewing the doc. Could use Firestore with a `presence` subcollection and TTL.
- **Version history** — save snapshots on each meaningful edit. Firestore doesn't have built-in versioning so you'd need a `versions` subcollection.
- **Better conflict handling** — even without full CRDT, you could detect conflicts (incoming fingerprint differs from both local and last-saved) and show a warning.
- **Tests** — no unit or integration tests. Would add them for the service layer and the auto-save hook at minimum.
- **Image support** — Plate supports it but you'd need Firebase Storage for uploads.

## Dependencies

| Package | What it does |
|---------|-------------|
| `next` | Framework — App Router, API routes, SSR |
| `react` / `react-dom` | UI |
| `firebase` | Auth + Firestore |
| `platejs` | Rich text editor (built on Slate) |
| `slate` | Low-level editor operations |
| `next-themes` | Dark/light mode |
| `sonner` | Toast notifications |
| `lucide-react` | Icons |
| `radix-ui` | Accessible UI primitives (dialog, dropdown) |
| `class-variance-authority` | Button variants |
| `clsx` + `tailwind-merge` | Class name utilities |
| `date-fns` | Relative timestamps |
| `lodash` | Debounce (used in one place) |
| `resend` | Email sending API |
| `zod` | Schema validation (available, used lightly) |
| `react-hook-form` | Form state (available) |
| `tailwindcss` | Styling |

## Time spent

Roughly 7-8 hours across a few sittings. Auth and basic CRUD was the fastest part. The auto-save + realtime sync loop took the most debugging — getting the fingerprint comparison right so the editor doesn't fight with Firestore echoes.
