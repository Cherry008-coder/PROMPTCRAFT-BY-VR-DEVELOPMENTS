# 🔑 Option B: GitHub Secrets Setup — Step by Step

This is the **recommended setup for private demos** where you want the site to work instantly without asking users for API keys.

### How it works:
- Keys are stored in GitHub repo **Secrets** (encrypted, not visible in code)
- On every push to `main`, GitHub Action injects them into `js/config.js`
- Keys are **NOT in git history** ✅
- But **ARE visible** in deployed JS bundle (DevTools → Sources) ⚠️
- Perfect for private repos / internal tools / client demos

---

### Step 1: Get 3 Groq API Keys (Free)

1. Go to https://console.groq.com/keys
2. Create 3 keys (or 1 key is enough, 3 is for failover)
   - Key 1: Click "Create API Key" → copy `gsk_...`
   - Key 2: Create another
   - Key 3: Create another
3. Free tier: 14,400 requests/day per key = 43,200/day with 3 keys

### Step 2: Add Secrets to GitHub Repo

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these 3 secrets:

| Name | Value |
|------|-------|
| `GROQ_API_KEY_1` | `gsk_xxxxxxxxxxxx...` (your first key) |
| `GROQ_API_KEY_2` | `gsk_yyyyyyyyyyyy...` (second key, optional) |
| `GROQ_API_KEY_3` | `gsk_zzzzzzzzzzzz...` (third key, optional) |

> You can add just 1 key, but 3 gives you automatic failover if one hits rate limit.

### Step 3: Push Code

```bash
git add .
git commit -m "Deploy PromptCraft with Groq brain"
git push origin main
```

GitHub Action will:
1. Inject keys into `js/config.js`
2. Deploy to GitHub Pages
3. Your site is live with brain online!

### Step 4: Enable GitHub Pages (First Time Only)

1. Repo → **Settings** → **Pages**
2. Source: **GitHub Actions** (not branch)
3. Save

Your site will be at: `https://YOURUSERNAME.github.io/REPO_NAME/`

### Verify It Works:

1. Open your deployed site
2. Top bar should show: **"Brain: Online • 3 key(s)"** with green dot
3. Open DevTools Console → you should see: `🔑 Groq keys available: 3`
4. Try crafting a prompt — should say "via Groq Key 1"

### Security Notes for Option B:

- ✅ Keys NOT in git log / repo files
- ⚠️ Keys ARE in deployed JS bundle — anyone can see via DevTools → Sources → js/config.js
- 🔒 Safe if repo is private or keys are free tier disposable
- 🔒 For public repo with paid keys, use Option C (Cloudflare Worker proxy) instead
- 🔄 Rotate keys anytime at console.groq.com if leaked

### Troubleshooting:

**Brain shows Offline:**
- Check Actions tab → did deploy workflow run?
- Check workflow logs → "Injected X key(s)"?
- Check repo Secrets → names must be exactly `GROQ_API_KEY_1`, `_2`, `_3`

**Rate limited:**
- Add 2 more keys — failover will auto-switch
- Groq free tier resets daily

**Want fully secure (keys never in browser)?**
- Use Option C: Deploy `worker.js` to Cloudflare Workers with `wrangler secret put`
- Set `GROQ_PROXY_URL` in config.js to your worker URL
- Keys stay server-side, never touch frontend

---

Built by VR DEVELOPMENTS — Hyderabad, 2026
