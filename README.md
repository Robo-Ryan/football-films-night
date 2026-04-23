# Films Night

A karaoke-style video queue app for team film review. The host opens the app on a laptop (hooked up to a TV), the team scans the QR code from their phones and uploads their football clips, and the host plays through the queue with slow-motion controls and fullscreen scrubbing.

## What you get

- **Host view (`/`)** — video player + queue + QR code, all on one screen
- **Upload view (`/upload`)** — phone-friendly page, name + multi-file upload
- **Custom video player** — speeds 0.2x / 0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x, scrub bar, and **custom controls that work in fullscreen** (native fullscreen hides the sub-0.25x speeds on most browsers — this player doesn't)
- **Queue management** — drag to reorder, delete, click to play. Persists in Supabase so a refresh doesn't wipe it.
- **Keyboard shortcuts** — Space = play/pause, F = fullscreen, ← / → = skip 2s

## Tech

Next.js 14 (App Router) · Tailwind · Supabase (Postgres + Storage) · `@dnd-kit` for drag-and-drop · `qrcode.react` · deployed on Vercel.

## One-time setup

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. In **SQL Editor**, open `supabase/schema.sql` from this repo and run it. This creates the `videos` table, the `films` storage bucket, and open read/write policies (trusted-room model — tighten if you ever expose it publicly).
3. In **Project Settings → API**, grab:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Local dev

```bash
cp .env.local.example .env.local
# fill in the two Supabase values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the host view, [http://localhost:3000/upload](http://localhost:3000/upload) for the phone view. To test the QR flow locally, put your computer and phone on the same Wi-Fi and use your computer's LAN IP.

### 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com) → New Project → import the repo.
3. Add the three env vars under **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your deployed URL (e.g. `https://films-night.vercel.app`) — the QR code uses this
4. Deploy. Done.

## Running a films night

1. Open the deployed URL on the laptop hooked up to the TV.
2. Point everyone at the QR code. They pick multiple clips from their gallery, name themselves, upload.
3. Hit **Refresh queue** on the host view to pull new uploads.
4. Click any row's **Play** button to load that clip. Fullscreen, scrub, change speed from the overlay.
5. When the night ends, hit **Clear all** to wipe the storage bucket and DB table so the next week starts clean.

## Limits to know

- Supabase free tier: **1 GB storage total** and **50 MB per file**. 20–30-second phone clips are usually 10–30 MB, so a typical films night (~30 clips) fits comfortably, but keep an eye on it if people upload 4K. Upgrading to Pro lifts this substantially.
- The RLS policies are wide open — anyone with the URL can upload or delete. That's fine for a room full of teammates but don't post the link on the internet.
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
  supabase.ts         Supabase browser client
  types.ts
supabase/
  schema.sql          One-shot schema + bucket + policies
```
