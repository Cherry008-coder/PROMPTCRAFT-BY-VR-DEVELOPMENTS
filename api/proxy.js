// Vercel / Netlify Function Alternative to Cloudflare Worker
// Place this in /api/proxy.js for Vercel deployment
// Set env vars GROQ_API_KEY_1,2,3 in Vercel Dashboard

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { model = "llama-3.3-70b-versatile", messages, temperature = 0.7, max_tokens = 2000 } = req.body;

  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(k => k && k.startsWith("gsk_"));

  if (keys.length === 0) return res.status(500).json({ error: "No Groq keys in env" });

  for (let i = 0; i < keys.length; i++) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keys[i]}`,
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
      });

      if (!groqRes.ok) {
        if (groqRes.status === 429 || groqRes.status >= 500) continue;
        const err = await groqRes.text();
        return res.status(groqRes.status).json({ error: err });
      }

      const data = await groqRes.json();
      return res.status(200).json({ ...data, _promptcraft: { keyUsed: i+1 } });
    } catch (e) {
      continue;
    }
  }

  return res.status(502).json({ error: "All keys failed" });
}
