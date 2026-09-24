// PromptCraft Config — by VR DEVELOPMENTS — Option B: GitHub Secrets Injection
// HOW IT WORKS:
// 1. You add secrets in GitHub repo → Settings → Secrets and variables → Actions
//    - GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3
// 2. On push to main, deploy.yml injects them into HARDCODED_KEYS below
// 3. Keys are NOT in git history, but ARE visible in deployed JS bundle (browser DevTools)
//    That's expected for Option B — good for private demos / internal tools
// 4. Users can still override with their own keys via Settings modal (BYOK fallback)

window.PROMPTCRAFT_CONFIG = {
  // For Option C (Secure Proxy), set your Cloudflare Worker URL here
  // Example: "https://promptcraft-brain.yourname.workers.dev"
  // Leave empty for Option B (direct Groq calls with injected keys)
  GROQ_PROXY_URL: "",

  // This array is auto-filled by GitHub Actions from secrets
  // If you run locally without secrets, it stays empty and BYOK modal is used
  HARDCODED_KEYS: [],

  // Default Groq model — best quality
  DEFAULT_MODEL: "llama-3.3-70b-versatile",

  // Branding
  BRAND: "VR DEVELOPMENTS",
  VERSION: "v2.0-github-secrets"
};

// Helper: Get all available keys (injected + user-added via Settings modal)
window.getAllGroqKeys = function() {
  const localKeys = [];
  try {
    const stored = JSON.parse(localStorage.getItem('pc_groq_keys') || '[]');
    stored.forEach(k => { 
      if(k && k.trim().startsWith('gsk_')) localKeys.push(k.trim()); 
    });
  } catch(e) {}

  const hardcoded = (window.PROMPTCRAFT_CONFIG.HARDCODED_KEYS || [])
    .filter(k => k && k.startsWith('gsk_'));

  // User keys first (BYOK), then injected hardcoded keys as fallback
  // Deduplicate
  const all = [...localKeys, ...hardcoded];
  return [...new Set(all)];
};

// Debug helper (visible in console)
console.log(
  `%c PromptCraft by VR DEVELOPMENTS %c ${window.PROMPTCRAFT_CONFIG.VERSION} `,
  'background: linear-gradient(135deg,#8a5cff,#4ee8ff); color:white; padding:4px 8px; border-radius:8px 0 0 8px; font-weight:bold;',
  'background:#1a1a25; color:#9aa0b8; padding:4px 8px; border-radius:0 8px 8px 0;'
);
console.log(`🔑 Groq keys available: ${window.getAllGroqKeys().length} (${window.PROMPTCRAFT_CONFIG.HARDCODED_KEYS.length} injected, ${JSON.parse(localStorage.getItem('pc_groq_keys')||'[]').length} from Settings)`);
