# FadeGiveaways

Live giveaway site with email verification, secret admin panel, and automatic winner emails.

## Features

- Random nickname assigned on first visit
- Active giveaways with countdown timers
- Email verification flow (Verify Join → Refresh Verify → Verified)
- Winner emails with download link + keys
- Secret admin panel (type your env-configured phrase key-by-key)
- Admin: create giveaways, view participants, rig winners

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
| `ADMIN_PANEL_SECRET` | Phrase typed key-by-key to open admin panel (e.g. `adminpanel`) |
| `UPSTASH_REDIS_REST_URL` | From https://console.upstash.com (free Redis) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `RESEND_API_KEY` | From https://resend.com |
| `EMAIL_FROM` | Verified sender, e.g. `FadeGiveaways <giveaways@yourdomain.com>` |
| `SITE_URL` | Your live URL, e.g. `https://fade-giveaways.vercel.app` |
| `ADMIN_COOKIE_SECRET` | Random string (`openssl rand -hex 32`) |

**Set `ADMIN_PANEL_SECRET` in PowerShell before deploying locally:**

```powershell
# In .env.local for local dev:
"ADMIN_PANEL_SECRET=mysecretphrase" | Out-File -Append .env.local -Encoding utf8
```

**Set on Vercel via CLI:**

```powershell
vercel env add ADMIN_PANEL_SECRET production
# Paste your secret when prompted, e.g. mysecretphrase
```

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

1. On the live site, type your `ADMIN_PANEL_SECRET` value one key at a time (default: `adminpanel`)
2. Admin panel opens automatically when the sequence matches
3. **Create** tab: Name, Description, Vouch, Duration, Download Link, Keys
4. **Manage** tab: expand a giveaway → view participants → **Rig Giveaway**

Rigged participants automatically win when the giveaway duration ends.

## Ending giveaways (no cron needed)

Giveaways are checked automatically whenever someone loads the site or hits **Refresh** — the API runs winner selection in the background. No Vercel cron job required (Hobby plan only allows daily crons anyway).

---

## Project structure

```
public/          → Static site (HTML, CSS, JS)
api/             → Vercel serverless functions
lib/             → Shared logic (db, email, giveaways)
```
