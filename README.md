# FadeGiveaways

Live giveaway site with email verification, secret admin panel, and automatic winner emails.

## Features

- Random nickname assigned on first visit
- Active giveaways with countdown timers
- Email verification flow (Verify Join → Refresh Verify → Verified)
- Winner emails with download link + keys
- Sign up / log in accounts
- Admin via username `Admin000` (first signup only — duplicate shows "Already taken")
- Admin Panel tab for admin users

## Local dev

```powershell
cd C:\Users\Maddox\Projects\FadeGiveaways
npm install
copy .env.example .env.local
# Fill in .env.local values, then:
npx vercel dev
```

Open http://localhost:3000

Without Redis/Resend configured, data stays in memory and emails log to the terminal.

---

## Publish to Vercel from GitHub (PowerShell)

### 1. Create a GitHub repo and push

```powershell
cd C:\Users\Maddox\Projects\FadeGiveaways

git add .
git commit -m "Initial FadeGiveaways site"
git branch -M main

# Create repo on GitHub (requires gh CLI — https://cli.github.com)
gh repo create FadeGiveaways --public --source=. --remote=origin --push
```

If you already created the repo on github.com manually:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/FadeGiveaways.git
git push -u origin main
```

### 2. Import into Vercel

**Option A — Dashboard**

1. Go to https://vercel.com/new
2. Import your `FadeGiveaways` GitHub repo
3. Vercel auto-detects settings (`outputDirectory: public`)
4. Add environment variables (step 3 below)
5. Deploy

**Option B — Vercel CLI**

```powershell
npm install -g vercel
cd C:\Users\Maddox\Projects\FadeGiveaways
vercel login
vercel --prod
```

Link to your GitHub repo when prompted for continuous deployment.

### 3. Environment variables (Vercel Dashboard → Project → Settings → Environment Variables)

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | From https://console.upstash.com (free Redis) — **required for accounts** |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `RESEND_API_KEY` | From https://resend.com |
| `EMAIL_FROM` | Verified sender, e.g. `FadeGiveaways <giveaways@yourdomain.com>` |
| `SITE_URL` | Your live URL, e.g. `https://fade-giveaways.vercel.app` |

Repeat for each variable, or set them all in the Vercel dashboard.

After adding env vars, redeploy:

```powershell
vercel --prod
```

### 4. Upstash Redis setup

1. https://console.upstash.com → Create database
2. Copy **REST URL** and **REST TOKEN** into Vercel env vars

### 5. Resend email setup

1. https://resend.com → API Keys → create key
2. Add your domain (or use `onboarding@resend.dev` for testing)
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel

---

## Admin panel

1. Click **Sign Up** and create an account with username **`Admin000`** (exact caps) and any password
2. Only **one** `Admin000` account can exist — a second signup shows **Already taken**
3. Log in as `Admin000` → an **Admin Panel** tab appears in the nav
4. Use **Create** / **Manage** to run giveaways, view participants, and rig winners

Regular usernames (not `Admin000`) are normal accounts with no admin access.

## Ending giveaways (no cron needed)

Giveaways are checked automatically whenever someone loads the site or hits **Refresh** — the API runs winner selection in the background. No Vercel cron job required (Hobby plan only allows daily crons anyway).

---

## Project structure

```
public/          → Static site (HTML, CSS, JS)
api/             → Vercel serverless functions
lib/             → Shared logic (db, email, giveaways)
```
