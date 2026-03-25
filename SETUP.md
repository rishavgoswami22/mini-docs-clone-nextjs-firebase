# Project Setup

Step-by-step guide to get this running on your machine.

## Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn — just swap the commands)
- A Firebase project

## 1. Clone and install

```bash
git clone https://github.com/your-username/mini-docs-clone-nextjs-firebase.git
cd mini-docs-clone-nextjs-firebase
pnpm install
```

## 2. Firebase setup

Go to [console.firebase.google.com](https://console.firebase.google.com) and either use an existing project or create a new one.

### Authentication

1. Go to **Build > Authentication > Get started**
2. Enable **Email/Password** under Sign-in providers
3. Enable **Google** — pick a support email and save
4. Go to **Settings > Authorized domains** — `localhost` should already be there. Add your Vercel domain later when you deploy.

### Firestore

1. Go to **Build > Firestore Database > Create database**
2. Pick **Standard edition**, choose a region close to you
3. Start in **test mode** for now (we'll add proper rules next)
4. Once the DB is created, go to **Rules** tab and paste the contents of `firestore.rules` from this repo
5. Hit **Publish**

### Get your config keys

1. Go to **Project settings > General > Your apps**
2. If no web app exists, click **Add app > Web**
3. Copy the config values (apiKey, authDomain, projectId, etc.)

## 3. Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in the values from your Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Email invites (optional)

If you want invite emails to actually send:

1. Sign up at [resend.com](https://resend.com)
2. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
3. Add to your `.env.local`:

```
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=Mini Docs <onboarding@resend.dev>
```

Without these, sharing still works through Firestore — the other person just won't get a notification email.

## 4. Run it

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Create an account and start making docs.

## 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add all the env vars from your `.env.local` in the Vercel project settings
4. Deploy
5. Go back to Firebase Auth > Authorized domains and add your `*.vercel.app` URL

That's it. The build command (`next build`) and output directory are auto-detected by Vercel.

## Common issues

| Problem | Fix |
|---------|-----|
| "Database '(default)' not found" | You haven't created the Firestore database yet. Go to Firebase console > Firestore > Create database. |
| "Permission denied" on reads/writes | Paste `firestore.rules` into Firestore > Rules and publish. |
| Google login says "unauthorized domain" | Add your domain in Firebase Auth > Settings > Authorized domains. |
| Email invite says "validation_error" | Resend free tier only sends to your own email. Verify a domain at resend.com/domains to send to others. |
| Slow loading / "still fetching" | Likely a network or Firestore provisioning issue. Check browser console for specific errors. |
