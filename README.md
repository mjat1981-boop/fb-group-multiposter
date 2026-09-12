# GroupPost

Chrome / Edge extension MVP: post the same Facebook group ad faster with **templates** and a **group list**. Ban-safe by design — we never auto-click **Post**.

## Load unpacked (weekend test)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder (the one that contains `manifest.json`)
4. Pin **GroupPost** from the puzzle menu

Edge: `edge://extensions` → same steps.

## How to use

1. Add a **template** (your ad text)
2. Add up to **3 groups** on Free (name + `https://www.facebook.com/groups/...` URL)
3. Select groups → **Open selected groups**
4. Each tab opens with text copied / best-effort composer fill
5. **You** review and click Post

Toggle **Pro unlocked (dev stub)** in the popup to test unlimited groups. Real Stripe comes later.

## Pricing (planned)

| Plan | Limits | Price |
|------|--------|-------|
| Free | 3 groups, templates | $0 |
| Pro | Unlimited groups + templates | **$9/mo** |

## Chrome Web Store draft

- **Name:** GroupPost – Facebook Group Multi-Poster
- **Short description:** Save ad templates and open multiple Facebook groups with your text ready. You still click Post.
- **Category:** Productivity / Social
- **Privacy:** Templates and group URLs stored in `chrome.storage.local` on your device. No analytics server in MVP. Host permission used only to help fill Facebook group composers.

## What NOT to build yet

- Auto-submit / silent posting
- Friend-request or DM bots
- Scraping member lists
- Full Meta/Google ad sync (that’s for the Shopify product later)

## Push to GitHub

If your empty repo is `mjat1981-boop/fb-group-multiposter`:

```bash
cd fb-group-multiposter
git init
git add .
git commit -m "Initial GroupPost Chrome extension MVP"
git branch -M main
git remote add origin https://github.com/mjat1981-boop/fb-group-multiposter.git
git push -u origin main
```

If the remote already has a README commit, use `git pull --rebase origin main` before push, or force only if you intend to replace it.

## Upgrade path

1. More reliable Facebook composer selectors (DOM changes often)
2. Stripe Checkout + license key instead of the Pro stub
3. Optional delay settings between tab opens

## Grok PR review (GitHub Actions)

Workflow: `.github/workflows/grok-pr-review.yml` using `0xr3ngar/grok-build-review-action@v1`.

1. On a machine with Grok CLI: `grok login`, then copy `~/.grok/auth.json`
2. Repo → Settings → Secrets → Actions → New secret `GROK_AUTH_JSON` (paste the JSON)
3. Open a PR (non-draft) — Grok reviews the diff via your SuperGrok / Grok Build subscription

No `XAI_API_KEY` required for this action.
