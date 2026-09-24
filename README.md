# PromptCraft V2 — Groq Brain • GitHub Secrets Injection • by VR DEVELOPMENTS

**Turn vague ideas into perfect 95+ prompts — now with real Groq AI brain and 3-key failover.**

> **You selected Option B: GitHub Secrets Injection** — Keys hidden from git history, auto-injected at build time, visible in deployed bundle (perfect for private demos).

---

### 🎯 What You Get

- **Idea Forge:** Describe anything → Groq Llama 3.3 70B crafts perfect prompt with ROLE, CONTEXT, OBJECTIVE, CONSTRAINTS, FORMAT, EXAMPLES
- **Quality Lab:** Groq AI analyzes any prompt → 0-100 score + strengths/weaknesses + fixes to 95+
- **3-Key Failover:** If Key 1 rate-limited → auto tries Key 2 → Key 3 → local fallback
- **VFX UI:** Gradients, glassmorphism, particle canvas, VR DEVELOPMENTS branding
- **GitHub Pages Ready:** No server, deploy via Actions

---

### 🔑 Option B Setup (Your Choice)

#### 1. Get Groq Keys (Free)
Go to https://console.groq.com/keys → Create 3 API keys (free tier: 14k req/day each)

#### 2. Add to GitHub Secrets
Repo → Settings → Secrets and variables → Actions → New secret:

- `GROQ_API_KEY_1` = `gsk_...` (first key)
- `GROQ_API_KEY_2` = `gsk_...` (backup)
- `GROQ_API_KEY_3` = `gsk_...` (backup)

#### 3. Push to Deploy
```bash
git add .
git commit -m "Deploy PromptCraft"
git push origin main
```

GitHub Action auto-injects keys into `js/config.js` and deploys to Pages.

#### 4. Enable Pages
Settings → Pages → Source: **GitHub Actions**

Live at `https://USERNAME.github.io/REPO/`

See `SECRETS_SETUP.md` for detailed steps with screenshots.

---

### 📁 Project Structure
```
promptcraft/
├── index.html                    # Main site + brain status UI
├── css/style.css                 # VFX, gradients, modal
├── js/
│   ├── config.js                 # ← Keys injected here by Action
│   └── app.js                    # Groq failover engine
├── .github/workflows/deploy.yml  # ← Injects secrets at build
├── SECRETS_SETUP.md              # Step-by-step guide
├── worker.js                     # Option C: Secure proxy (optional)
├── api/proxy.js                  # Vercel alternative
└── README.md
```

### ⚡ How Failover Works
```js
User Idea → Try GROQ_API_KEY_1 → 429? → Wait 1.2s → Try KEY_2 → 429? → KEY_3 → Fail? → Local engine (90+)
```

### 🔒 Security for Option B
- ✅ Keys NOT in git history / repo files
- ⚠️ Keys ARE visible in deployed JS bundle (DevTools → Sources) — expected
- ✅ Safe for private repos / demos / free tier keys
- 🔒 For public repos with sensitive keys, use Option C (Cloudflare Worker)

### 🎨 Branding
**VR DEVELOPMENTS** — Crafting digital products that feel like magic.
Hyderabad, 2026 — PromptCraft v2.0

MIT License
