# SportsIQ Mockups — Vercel Setup (5 minutes)

## Step 1 — Deploy to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Import **LumenIQ25/sportsiq-mockups** from GitHub
4. Click **Deploy** (no build settings needed)

## Step 2 — Add Environment Variables
In your Vercel project → Settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `GITHUB_TOKEN` | `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` |
| `GITHUB_OWNER` | `LumenIQ25` |
| `GITHUB_REPO` | `sportsiq-mockups` |

Redeploy after adding vars: Deployments → ⋯ → Redeploy

## Step 3 — Set your password
Run this in any browser console to get your password hash:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('YourPasswordHere'))
  .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
```

Copy the hash, open `index.html`, find the line:
```
var HASH = 'b0c5b40b1fc27b9b0b6d71e90d282b3b4c6c9e6f7c0e1e5b2c3a4d5e6f7a8b9';
```
Replace the placeholder hash with your real one. Commit and push — Vercel auto-redeploys.

## Step 4 — Custom domain (design.lumen-iq.com)
1. Vercel project → Settings → Domains → Add `design.lumen-iq.com`
2. Vercel shows you a CNAME record to add to your DNS
3. Add that CNAME in wherever lumen-iq.com's DNS is managed (GoDaddy, Namecheap, Cloudflare, etc.)
4. Takes 5–60 minutes to go live

## How it works after setup
- Open https://design.lumen-iq.com on any device (phone, tablet, desktop)
- Enter your password → locked to you only
- Type a reply on any idea card → click **Send Reply** → saved instantly to GitHub
- Claude reads the file every hour and acts on your replies
- New ideas added via **+ Add New Item** also write directly to the file
