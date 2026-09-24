// PromptCraft Groq Brain Proxy — Cloudflare Worker
// by VR DEVELOPMENTS
// SECURE MODE: Keys are stored as Worker Secrets, NEVER exposed to frontend
// Deploy: wrangler deploy
// Set secrets: wrangler secret put GROQ_API_KEY_1, etc.

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const { model = "llama-3.3-70b-versatile", messages, temperature = 0.7, max_tokens = 2000 } = body;

      if (!messages) {
        return new Response(JSON.stringify({ error: "Missing messages" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Collect keys from env — supports 3-key failover
      const keys = [
        env.GROQ_API_KEY_1,
        env.GROQ_API_KEY_2,
        env.GROQ_API_KEY_3,
      ].filter(k => k && k.startsWith("gsk_"));

      if (keys.length === 0) {
        return new Response(JSON.stringify({ error: "No Groq keys configured in Worker secrets" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let lastError = null;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${key}`,
            },
            body: JSON.stringify({ model, messages, temperature, max_tokens }),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.log(`Key ${i+1} failed: ${groqRes.status} ${errText}`);
            lastError = errText;
            if (groqRes.status === 429 || groqRes.status === 401 || groqRes.status >= 500) {
              continue; // try next key
            }
            return new Response(errText, {
              status: groqRes.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const data = await groqRes.json();
          // Return Groq response as-is, but add metadata
          return new Response(JSON.stringify({
            ...data,
            _promptcraft: { keyUsed: i+1, totalKeys: keys.length, via: "cloudflare-worker", brand: "VR DEVELOPMENTS" }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });

        } catch (e) {
          console.log(`Key ${i+1} error:`, e);
          lastError = e.message;
          continue;
        }
      }

      return new Response(JSON.stringify({ error: "All Groq keys failed", details: lastError }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
