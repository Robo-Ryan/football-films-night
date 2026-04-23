# Films Night

A karaoke-style video queue app for team film review. The host opens the app on a laptop (hooked up to a TV), the team scans the QR code from their phones and uploads their football clips, and the host plays through the queue with slow-motion controls and fullscreen scrubbing.

## What you get

- **Host view (`/`)** — video player + queue + QR code, all on one screen
- **Upload view (`/upload`)** — phone-friendly page, name + multi-file upload
- **Custom video player** — speeds 0.2x / 0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x, scrub bar, and **custom controls that work in fullscreen** (native fullscreen hides the sub-0.25x speeds on most browsers — this player doesn't)
- **Queue management** — drag to reorder, delete, click to play. Persists in Firestore so a refresh doesn't wipe it.
- **Keyboard shortcuts** — Space = play/pause, F = fullscreen, ← / → = skip 2s

## Tech

Next.js 14 (App Router) · Tailwind · Firebase (Firestore + Storage) · `@dnd-kit` for drag-and-drop · `qrcode.react` · deployed on Vercel.

## One-time setup

### 1. Create a Firebase project

1. Go to [firebase.google.com](https://firebase.google.com) → **Go to console**.
2. Create a new project (free tier is fine).
3. In your project, enable **Firestore Database** (use the default region, click "Start in production mode").
4. In your project, enable **Cloud Storage** (use the default `[PROJECT].appspot.com`).
5. Go to **Project Settings** (gear icon) → **Your Apps** → register a **Web** app to get your config.
6. Copy all six values:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Set Firestore security rules

Go to **Firestore Database** → **Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /videos/{document=**} {
      allow read, write: if true;
    }
  }
}
```

(This is open-access for trusted rooms; tighten if you expose this publicly.)

### 3. Set Cloud Storage rules

Go to **Cloud Storage** → **Rules** and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /films/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Local dev

```bash
cp .env.local.example .env.local
# fill in the six Firebase values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the host view, [http://localhost:3000/upload](http://localhost:3000/upload) for the phone view. To test the QR flow locally, put your computer and phone on the same Wi-Fi and use your computer's LAN IP.

### 5. Deploy to Vercel

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com) → New Project → import the repo.
3. Add the six Firebase env vars under **Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (e.g. `https://films-night.vercel.app`) — the QR code uses this.
5. Deploy. Done.

## Running a films night

1. Open the deployed URL on the laptop hooked up to the TV.
2. Point everyone at the QR code. They pick multiple clips from their gallery, name themselves, upload.
3. Hit **Refresh queue** on the host view to pull new uploads.
4. Click any row's **Play** button to load that clip. Fullscreen, scrub, change speed from the overlay.
5. When the night ends, hit **Clear all** to wipe the database and storage so the next week starts clean.

## Limits to know

- Firebase free tier: **5 GB storage per month**, no per-file limit. A typical films night (~30 clips) uses <500 MB.
- The Firestore and Cloud Storage rules are wide open — anyone with the URL can upload or delete. That's fine for a room full of teammates but don't post the link on the internet.
- No auth means no "host mode" yet; anyone on the page can hit Play, reorder, or delete. Easy to add later if you need it.

## Project layout

```
app/
  page.tsx            Host view
  upload/page.tsx     Phone upload page
  layout.tsx
  globals.css
components/
  VideoPlayer.tsx     Custom player (fullscreen + speed + scrub)
  QueueList.tsx       Drag-and-drop reorder, play, delete
  QRDisplay.tsx       QR code pointing to /upload
lib/
  firebase.ts         Firebase client (Firestore + Storage)
  types.ts
```
