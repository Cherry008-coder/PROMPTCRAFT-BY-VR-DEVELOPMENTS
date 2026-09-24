// PromptCraft V2 — Groq Brain with 3-Key Failover — by VR DEVELOPMENTS

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// State
let currentTask = 'general';
let craftedCount = parseInt(localStorage.getItem('pc_count')||'0');
let lastGroqKeyIndex = -1;

// DOM
const ideaInput = $('#ideaInput');
const taskGroup = $('#taskTypeGroup');
const toneSelect = $('#toneSelect');
const depthSelect = $('#depthSelect');
const modelSelect = $('#modelSelect');
const generateBtn = $('#generateBtn');
const generateBtnText = $('#generateBtnText');
const promptOutput = $('#promptOutput');
const outputEmpty = $('#outputEmpty');
const outputContent = $('#outputContent');
const wordCountEl = $('#wordCount');
const tokenEstEl = $('#tokenEst');
const miniQualityEl = $('#miniQuality');
const brainUsedEl = $('#brainUsed');
const copyBtn = $('#copyBtn');
const testQualityBtn = $('#testQualityBtn');
const statCount = $('#statCount');
const avgScoreEl = $('#avgScore');
const avgScoreLabelEl = $('#avgScoreLabel');
const latencyStat = $('#latencyStat');
const latencyLabel = $('#latencyLabel');
const brainModePill = $('#brainModePill');
const brainKeysPill = $('#brainKeysPill');
const emptySub = $('#emptySub');

const labInput = $('#labInput');
const analyzeBtn = $('#analyzeBtn');
const analyzeBtnText = $('#analyzeBtnText');
const clearLabBtn = $('#clearLabBtn');
const resultsEmpty = $('#resultsEmpty');
const resultsContent = $('#resultsContent');
const scoreCircle = $('#scoreCircle');
const scoreNum = $('#scoreNum');
const scoreLabel = $('#scoreLabel');
const scoreDesc = $('#scoreDesc');
const scoreVerdict = $('#scoreVerdict');
const metricsList = $('#metricsList');
const strengthsList = $('#strengthsList');
const weaknessesList = $('#weaknessesList');
const fixesList = $('#fixesList');
const autoFixBtn = $('#autoFixBtn');
const toastEl = $('#toast');

// Brain UI
const brainBtn = $('#brainBtn');
const brainLed = $('#brainLed');
const brainDot = $('#brainDot');
const brainStatusText = $('#brainStatusText');
const heroBadgeDot = $('#heroBadgeDot');
const footerDot = $('#footerDot');
const settingsBtn = $('#settingsBtn');
const heroSettingsBtn = $('#heroSettingsBtn');
const mobileBrainBtn = $('#mobileBrainBtn');
const modalOverlay = $('#modalOverlay');
const closeModalBtn = $('#closeModalBtn');
const saveKeysBtn = $('#saveKeysBtn');
const clearKeysBtn = $('#clearKeysBtn');
const apiKeyInputs = [$('#apiKey1'), $('#apiKey2'), $('#apiKey3')];
const keyStatusEls = [$('#keyStatus1'), $('#keyStatus2'), $('#keyStatus3')];

// Init
statCount.textContent = craftedCount;
updateBrainStatus();
updateTokenStats();

// Load config model
if(window.PROMPTCRAFT_CONFIG && modelSelect){
  modelSelect.value = window.PROMPTCRAFT_CONFIG.DEFAULT_MODEL || "llama-3.3-70b-versatile";
}

// Task pills
taskGroup.addEventListener('click', e=>{
  if(!e.target.classList.contains('pill')) return;
  $$('.pill').forEach(p=>p.classList.remove('active'));
  e.target.classList.add('active');
  currentTask = e.target.dataset.value;
});

// Demo
$('#demoBtn').addEventListener('click', ()=>{
  ideaInput.value = "I want to build a habit tracker app with streaks like Apple Fitness, with social sharing and AI coach that roasts me if I miss days. Make it feel premium and viral.";
  currentTask='coding';
  $$('.pill').forEach(p=>{p.classList.toggle('active', p.dataset.value===currentTask)});
  toneSelect.value='technical';
  depthSelect.value='ultra';
  modelSelect.value='llama-3.3-70b-versatile';
  ideaInput.focus();
  toast("Demo idea loaded — hit Craft!");
});

// Mobile menu
$('#mobileMenuBtn').addEventListener('click', ()=>{
  $('#mobileNav').classList.toggle('show');
});

// Settings modal
function openModal(){
  loadKeysToModal();
  modalOverlay.classList.add('show');
  document.body.style.overflow='hidden';
}
function closeModal(){
  modalOverlay.classList.remove('show');
  document.body.style.overflow='';
}
settingsBtn.addEventListener('click', openModal);
brainBtn.addEventListener('click', openModal);
heroSettingsBtn.addEventListener('click', openModal);
if(mobileBrainBtn) mobileBrainBtn.addEventListener('click', ()=>{ $('#mobileNav').classList.remove('show'); openModal(); });
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e=>{ if(e.target===modalOverlay) closeModal(); });

// Toggle password visibility
$$('[data-toggle]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-toggle');
    const input = document.getElementById(id);
    input.type = input.type==='password' ? 'text' : 'password';
    btn.textContent = input.type==='password' ? '👁' : '🙈';
  });
});

// Test single key
$$('[data-test]').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const idx = parseInt(btn.getAttribute('data-test'))-1;
    const key = apiKeyInputs[idx].value.trim();
    if(!key || !key.startsWith('gsk_')){ toast("Enter valid key starting with gsk_"); return; }
    btn.textContent='...';
    const ok = await testGroqKey(key);
    btn.textContent='Test';
    if(ok){
      keyStatusEls[idx].textContent='✓ Valid';
      keyStatusEls[idx].className='key-status ok';
      toast(`Key ${idx+1} valid ✓`);
    } else {
      keyStatusEls[idx].textContent='✕ Invalid';
      keyStatusEls[idx].className='key-status bad';
      toast(`Key ${idx+1} failed ✕`);
    }
  });
});

function loadKeysToModal(){
  try{
    const stored = JSON.parse(localStorage.getItem('pc_groq_keys')||'[]');
    apiKeyInputs.forEach((inp,i)=>{
      inp.value = stored[i]||'';
      updateKeyStatusUI(i, stored[i]||'');
    });
  }catch(e){
    apiKeyInputs.forEach((inp,i)=>{ inp.value=''; updateKeyStatusUI(i,''); });
  }
  // Also show hardcoded keys count
  const hardcoded = window.getAllGroqKeys ? window.getAllGroqKeys().length : 0;
  if(hardcoded>0 && !localStorage.getItem('pc_groq_keys')){
    // show hint
  }
}
function updateKeyStatusUI(idx, key){
  const el = keyStatusEls[idx];
  if(!key){ el.textContent='Not set'; el.className='key-status'; }
  else if(key.startsWith('gsk_') && key.length>20){ el.textContent='● Set (masked)'; el.className='key-status ok'; }
  else { el.textContent='Invalid format'; el.className='key-status bad'; }
}
apiKeyInputs.forEach((inp,i)=>{
  inp.addEventListener('input', ()=> updateKeyStatusUI(i, inp.value.trim()));
});

saveKeysBtn.addEventListener('click', ()=>{
  const keys = apiKeyInputs.map(inp=>inp.value.trim()).filter(k=>k.length>0);
  // Validate at least one starts with gsk_
  const valid = keys.filter(k=>k.startsWith('gsk_') && k.length>20);
  if(keys.length>0 && valid.length===0){
    toast("Keys must start with gsk_ and be valid");
    return;
  }
  localStorage.setItem('pc_groq_keys', JSON.stringify(keys));
  updateBrainStatus();
  closeModal();
  toast(`Brain connected with ${valid.length} key(s) 🧠⚡`);
});

clearKeysBtn.addEventListener('click', ()=>{
  if(confirm("Clear all Groq keys from this browser?")){
    localStorage.removeItem('pc_groq_keys');
    apiKeyInputs.forEach(inp=>inp.value='');
    keyStatusEls.forEach(el=>{ el.textContent='Not set'; el.className='key-status'; });
    updateBrainStatus();
    toast("Keys cleared — using local engine");
  }
});

function updateBrainStatus(){
  const keys = window.getAllGroqKeys ? window.getAllGroqKeys() : [];
  const hasKeys = keys.length>0;
  const hasProxy = window.PROMPTCRAFT_CONFIG && window.PROMPTCRAFT_CONFIG.GROQ_PROXY_URL;

  if(hasKeys || hasProxy){
    brainLed.className='brain-led online';
    brainDot.className='mark-dot online';
    heroBadgeDot.className='badge-dot';
    footerDot.className='mark-dot small online';
    brainStatusText.textContent = hasProxy ? `Brain: Proxy • ${keys.length} keys` : `Brain: Online • ${keys.length} key(s)`;
    brainModePill.textContent = hasProxy ? `🧠 Proxy Brain • ${modelSelect.value}` : `🧠 Groq Brain • ${modelSelect.value}`;
    brainModePill.className='brain-pill';
    brainKeysPill.textContent = `${keys.length} key(s) active • Failover enabled`;
    brainKeysPill.className='brain-pill';
    generateBtnText.textContent = `Craft with Groq • ${keys.length} key failover`;
    avgScoreEl.textContent='Groq';
    avgScoreLabelEl.textContent='Brain Online • 3-Key Failover';
    latencyStat.textContent='~1.2s';
    latencyLabel.textContent='Groq API • Ultra Fast';
    emptySub.textContent='Groq Brain connected — will generate 95+ prompts with AI';
  } else {
    brainLed.className='brain-led offline';
    brainDot.className='mark-dot offline';
    heroBadgeDot.className='badge-dot offline';
    footerDot.className='mark-dot small offline';
    brainStatusText.textContent='Brain: Offline • Local Mode';
    brainModePill.textContent='⚡ Local Engine Active';
    brainModePill.className='brain-pill offline';
    brainKeysPill.textContent='No keys — Add in Settings to unlock Groq (free at console.groq.com)';
    brainKeysPill.className='brain-pill muted';
    generateBtnText.textContent='Craft Perfect Prompt (Local)';
    avgScoreEl.textContent='Local';
    avgScoreLabelEl.textContent='Avg Quality • Offline Mode';
    latencyStat.textContent='0ms';
    latencyLabel.textContent='100% Local • No API';
    emptySub.textContent='Add Groq keys in Settings for AI-powered generation';
  }
}

// Canvas BG VFX
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles=[];
function resizeCanvas(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
resizeCanvas(); window.addEventListener('resize', resizeCanvas);
class P{
  constructor(){this.reset()}
  reset(){
    this.x=Math.random()*canvas.width;
    this.y=Math.random()*canvas.height;
    this.vx=(Math.random()-0.5)*0.3;
    this.vy=(Math.random()-0.5)*0.3;
    this.r=Math.random()*1.5+0.3;
    this.a=Math.random()*0.5+0.1;
  }
  update(){
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset();
  }
  draw(){
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(180,180,255,${this.a})`;
    ctx.fill();
  }
}
for(let i=0;i<90;i++) particles.push(new P());
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{p.update();p.draw()});
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      let dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
      let d=Math.sqrt(dx*dx+dy*dy);
      if(d<110){
        ctx.beginPath();
        ctx.moveTo(particles[i].x,particles[i].y);
        ctx.lineTo(particles[j].x,particles[j].y);
        ctx.strokeStyle=`rgba(138,92,255,${0.08*(1-d/110)})`;
        ctx.lineWidth=0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(loop);
}
loop();

// ===== GROQ BRAIN ENGINE WITH 3-KEY FAILOVER =====

async function testGroqKey(key){
  try{
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
      body: JSON.stringify({
        model:"llama-3.1-8b-instant",
        messages:[{role:"user", content:"Hi"}],
        max_tokens:5
      })
    });
    return res.ok;
  }catch(e){ return false; }
}

async function callGroqWithFailover(messages, model, temperature=0.7, max_tokens=2000){
  const keys = window.getAllGroqKeys ? window.getAllGroqKeys() : [];
  const proxyUrl = window.PROMPTCRAFT_CONFIG?.GROQ_PROXY_URL;

  // If proxy configured, try proxy first (proxy handles its own failover server-side)
  if(proxyUrl){
    try{
      const res = await fetch(proxyUrl, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model, messages, temperature, max_tokens })
      });
      if(res.ok){
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || data.content || "";
        if(content) return { content, keyIndex: -1, via: "proxy" };
      }
      console.warn("Proxy failed, falling back to direct keys", await res.text());
    }catch(e){
      console.warn("Proxy error, fallback to direct", e);
    }
  }

  // Direct Groq calls with failover
  if(keys.length===0){
    throw new Error("NO_KEYS");
  }

  let lastError = null;
  for(let i=0;i<keys.length;i++){
    const key = keys[i];
    try{
      console.log(`Trying Groq key ${i+1}/${keys.length}`);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${key}`
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens })
      });

      if(!res.ok){
        const errText = await res.text();
        console.warn(`Key ${i+1} failed: ${res.status} ${errText}`);
        lastError = new Error(`Key ${i+1} failed: ${res.status}`);
        // If rate limit or invalid key, try next
        if(res.status===429 || res.status===401 || res.status===403){
          await new Promise(r=>setTimeout(r, 1200)); // wait before retry
          continue;
        }
        if(res.status>=500){
          await new Promise(r=>setTimeout(r, 800));
          continue;
        }
        throw new Error(errText);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      if(!content) throw new Error("Empty response");
      
      lastGroqKeyIndex = i;
      return { content, keyIndex: i, via: "direct" };

    }catch(e){
      console.warn(`Key ${i+1} error:`, e);
      lastError = e;
      if(i < keys.length-1){
        await new Promise(r=>setTimeout(r, 1200));
        continue;
      }
    }
  }
  throw lastError || new Error("All Groq keys failed");
}

// Prompt Crafting — Groq version
async function craftWithGroq(idea, taskType, tone, depth, model){
  const roleMap = {
    general: "world-class AI Prompt Engineer and Domain Expert",
    coding: "Senior Staff Engineer (ex-FAANG, Top 1%)",
    writing: "Award-winning Writer & Editor",
    image: "Elite Visual Director & Midjourney Architect",
    business: "McKinsey-level Strategist",
    marketing: "Growth Marketing Lead ($10M+ ARR)",
    learning: "Expert Educator & Curriculum Designer",
    data: "Principal Data Scientist"
  };

  const systemPrompt = `You are PromptCraft Engine by VR DEVELOPMENTS — the world's best prompt engineer. 
Your job is to transform vague user ideas into PERFECT prompts that score 95+/100.

RULES FOR PERFECT PROMPT:
- Must include: ROLE (Act as...), CONTEXT (background, audience, why), OBJECTIVE (clear goal), INSTRUCTIONS (step-by-step), CONSTRAINTS (MUST/MUST NOT), OUTPUT FORMAT (exact structure), TONE, QUALITY BAR
- For ULTRA depth, also add few-shot EXAMPLES (good vs bad)
- Be specific, not generic. Include numbers, tech stack, actionable details.
- Output must be production-ready, not placeholder.
- Always start with "# ROLE" and follow the structure.
- End with "--- Crafted by PromptCraft • VR DEVELOPMENTS • Groq Brain"

You must generate the PERFECTED PROMPT itself, not the final deliverable. The perfected prompt is what the user will paste into ChatGPT/Claude to get their desired result.

Task Type: ${taskType}
Role to use: ${roleMap[taskType]}
Tone: ${tone}
Depth: ${depth}
Model: ${model}

If depth is ultra, include chain-of-thought and 2 examples.
If task is coding, require architecture, file names, complete code.
If image, include prompt, negative prompt, parameters.
`;

  const userPrompt = `Transform this raw idea into a perfect, 95+ scoring prompt:

Raw Idea: "${idea}"

Task Type: ${taskType}
Tone: ${tone}
Depth: ${depth}

Generate ONLY the perfected prompt (not the final app/content). Make it score 95+ in quality lab.
Use this exact structure:
# ROLE
# CONTEXT
# OBJECTIVE
# INSTRUCTIONS
# CONSTRAINTS
# OUTPUT FORMAT
# QUALITY BAR
# TONE
${depth==='ultra' ? '# EXAMPLES' : ''}
# FINAL TASK

Make it detailed, specific, and ready to copy-paste into any LLM.`;

  const result = await callGroqWithFailover([
    { role:"system", content: systemPrompt },
    { role:"user", content: userPrompt }
  ], model, 0.7, depth==='ultra' ? 3000 : 2000);

  return result.content.trim();
}

// Local fallback (same as V1 but enhanced)
function craftLocalFallback(idea, taskType, tone, depth){
  const ROLE_MAP = {
    general: "world-class AI Prompt Engineer and Domain Expert",
    coding: "Senior Staff Engineer (Top 1% — ex-FAANG, 10+ years shipping production code)",
    writing: "Award-winning Writer, Editor & Storytelling Strategist",
    image: "Elite Visual Director & Midjourney / DALL·E Prompt Architect",
    business: "McKinsey-level Business Strategist & Operator",
    marketing: "Growth Marketing Lead (scaled 3 startups to $10M+ ARR)",
    learning: "Expert Educator & Curriculum Designer (PhD, learning science)",
    data: "Principal Data Scientist & Analytics Architect"
  };
  const domain = idea.toLowerCase().split(/\W+/).filter(w=>w.length>3).slice(0,8).join(", ") || "the stated domain";
  const ideaClean = idea.trim().replace(/\s+/g,' ');
  const toneInstruction = {
    professional: "Tone: Professional, precise, confident. No fluff.",
    friendly: "Tone: Friendly, conversational, encouraging.",
    technical: "Tone: Technical, exact, implementation-focused.",
    creative: "Tone: Creative, bold, inspiring.",
    concise: "Tone: Concise, direct, high signal-to-noise."
  }[tone];

  return `# ROLE
Act as a ${ROLE_MAP[taskType]}. You are known for delivering exceptional, production-ready work. You think step-by-step and never skip quality.

# CONTEXT
User's raw idea: "${ideaClean}"
Background:
- Domain / keywords: ${domain}
- Audience: Someone who needs to accomplish the goal effectively without wasting time.
- Why this matters: Output will be used directly — must be actionable, not generic.

# OBJECTIVE
Your objective is to transform the idea into a complete, high-quality deliverable that achieves the user's underlying intent.
Primary Goal: ${ideaClean}

# INSTRUCTIONS
1. Restate goal in 1 sentence.
2. Break work into clear steps/phases. Think edge cases.
3. ${taskType==='coding' ? 'Design architecture, data models, UI/UX before coding. Use modern best practices. Provide complete code.' : 'Deliver structured, actionable output with clear sections.'}
4. Ensure quality, not just completion.
5. ${depth!=='standard' ? 'Use chain-of-thought: Analyze → Plan → Execute → Review.' : 'Be methodical.'}

# CONSTRAINTS
- MUST be specific, not generic. Avoid placeholders.
- MUST be production-ready.
- MUST NOT hallucinate beyond scope unless flagged as Optional V2.
- Keep focused: Every line adds value.
- Provide realistic, working examples.

# OUTPUT FORMAT
${taskType==='coding' ? `Return:
## 1. Summary
## 2. Architecture / Tech Stack
## 3. Implementation (complete code with file names)
## 4. How to run / test
## 5. Next improvements` : `Return in clean Markdown with Executive Summary, Detailed Breakdown, Checklist, Final Deliverable`}

# QUALITY BAR
- Clarity: Would a junior understand it?
- Completeness: Could someone execute without follow-ups?
- Specificity: Includes numbers, examples, constraints?

# TONE
${toneInstruction}

${depth==='ultra' ? `# EXAMPLES
Example Good: Detailed, specific, with structure.
Example Bad: "Here's a basic page" — too vague.

# FINAL TASK
Now deliver for: "${ideaClean}"
Begin with "Understood: ..." then full output.` : `# FINAL TASK
Now deliver for: "${ideaClean}"`}

---
Crafted by PromptCraft • VR DEVELOPMENTS • Local Engine (Groq offline fallback)
`.trim();
}

// Quality Analyzer — Groq enhanced + local fallback
async function analyzeWithGroq(promptText, model){
  const system = `You are PromptCraft Quality Analyzer by VR DEVELOPMENTS. Analyze prompts across 10 dimensions and return JSON ONLY.

Dimensions: role, context, objective, specificity, constraints, format, examples, clarity, instruction, tone
Score each 0-100. Also provide overall score 0-100, label (Poor/Weak/Good/Strong/Exceptional), strengths[], weaknesses[], fixes[].

Return valid JSON like:
{
  "score": 92,
  "label": "Strong",
  "desc": "...",
  "metrics": {"role":90, "context":85, ...},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "fixes": ["..."]
}
No markdown, only JSON.`;

  const user = `Analyze this prompt and return JSON:

PROMPT TO ANALYZE:
"""
${promptText.slice(0, 4000)}
"""

Return JSON only.`;

  try{
    const result = await callGroqWithFailover([
      {role:"system", content: system},
      {role:"user", content: user}
    ], model, 0.3, 1000);
    
    // Try parse JSON
    let jsonStr = result.content.trim();
    // Extract JSON if wrapped in ```json
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if(match) jsonStr = match[0];
    const parsed = JSON.parse(jsonStr);
    return parsed;
  }catch(e){
    console.warn("Groq analysis failed, using local", e);
    return null;
  }
}

function analyzeLocal(text){
  const t = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wc = words.length;
  const checks = {
    role: /act as|you are a|you are an|role:|expert|specialist|strategist/i.test(text),
    context: /(context|background|audience|domain|why this matters|situation)/i.test(text) && wc>40,
    objective: /(objective|goal|task:|your objective|primary goal)/i.test(text) || /(create|build|generate|write|design|analyze)/i.test(t),
    specificity: (text.match(/\d+/g)||[]).length>0 || wc>80,
    constraints: /(must|must not|should not|avoid|constraint|requirement|never|always)/i.test(text),
    format: /(format|structure|return as|output as|json|markdown|table|list|##|###)/i.test(text),
    examples: /(example|e\.g\.|for instance|such as|few-shot)/i.test(text),
    clarity: wc>25 && wc<800 && !/(asdf|xxx|???)/i.test(text),
    instruction: /(step|instructions|1\.|2\.|first|then|finally)/i.test(text),
    tone: /(tone:|professional|friendly|technical|creative)/i.test(text)
  };
  const weights = { role:15, context:15, objective:12, specificity:12, constraints:10, format:12, examples:8, clarity:8, instruction:5, tone:3 };
  let score=0, max=0, metrics=[];
  for(let k in weights){
    max+=weights[k];
    let has = checks[k];
    let s = has ? 100 : (k==='specificity' && wc>30 ? 45 : k==='clarity' && wc>15 ? 50 : 15);
    if(k==='clarity' && wc>60) s = Math.min(100, s+20);
    if(k==='specificity' && wc>120) s = Math.min(100, s+30);
    score += (s/100)*weights[k];
    metrics.push({key:k, score:s, has, weight:weights[k]});
  }
  score = Math.round((score/max)*100);
  if(wc<15) score = Math.min(score, 28);
  else if(wc<30) score = Math.min(score, 55);
  if(wc>80 && checks.role && checks.format) score = Math.min(100, score+8);

  const labelMap = { role:"Role Definition", context:"Context & Background", objective:"Objective Clarity", specificity:"Specificity & Detail", constraints:"Constraints & Rules", format:"Output Format", examples:"Examples (Few-shot)", clarity:"Clarity & Readability", instruction:"Step-by-step Instructions", tone:"Tone Guidance" };
  let strengths=[], weaknesses=[], fixes=[];
  metrics.forEach(m=>{
    if(m.score>=75) strengths.push(`${labelMap[m.key]} is well-defined`);
    else if(m.score<60) weaknesses.push(`${labelMap[m.key]} is missing or weak`);
  });
  if(!checks.role) fixes.push(`Add ROLE: "Act as a world-class [expert]..."`);
  if(!checks.context) fixes.push(`Add CONTEXT: who, why, background`);
  if(!checks.objective) fixes.push(`State OBJECTIVE with strong verb`);
  if(!checks.constraints) fixes.push(`Add CONSTRAINTS: 3-5 MUST / MUST NOT`);
  if(!checks.format) fixes.push(`Define OUTPUT FORMAT: exact structure`);
  if(!checks.examples) fixes.push(`Add 1-2 EXAMPLES`);
  if(!checks.specificity) fixes.push(`Add specifics: numbers, stack, audience`);
  if(wc<40) fixes.push(`Expand to 80-150 words — current ${wc} too vague`);
  if(!checks.instruction) fixes.push(`Add numbered INSTRUCTIONS`);
  if(fixes.length===0) fixes.push("Excellent! To hit 99%, add Quality Bar checklist.");

  let label, desc, color;
  if(score>=95){label="Exceptional"; desc="Top 1% prompt. Ready for production."; color="#4eff9c"}
  else if(score>=85){label="Strong"; desc="Very good — reliable results with minor tweaks."; color="#4ee8ff"}
  else if(score>=70){label="Good"; desc="Decent but missing key elements."; color="#ffcc4e"}
  else if(score>=45){label="Weak"; desc="Likely generic results. Needs role, format, constraints."; color="#ff8c4e"}
  else{label="Poor"; desc="Too vague — model will guess."; color="#ff5c7a"}

  return {score, label, desc, color, metrics, strengths, weaknesses, fixes, wc, labelMap, metricsObj: Object.fromEntries(metrics.map(m=>[m.key, m.score]))};
}

function updateTokenStats(){
  const txt = promptOutput.textContent || "";
  const wc = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  const tokens = Math.round(wc*1.3);
  wordCountEl.textContent = `${wc} words`;
  tokenEstEl.textContent = `~${tokens} tokens`;
}

// Generate handler
generateBtn.addEventListener('click', async ()=>{
  const idea = ideaInput.value.trim();
  if(!idea){
    toast("Describe your idea first!");
    ideaInput.focus();
    ideaInput.style.borderColor="#ff5c7a";
    setTimeout(()=>ideaInput.style.borderColor="",800);
    return;
  }
  const taskType = currentTask;
  const tone = toneSelect.value;
  const depth = depthSelect.value;
  const model = modelSelect.value;

  generateBtn.disabled=true;
  const origText = generateBtnText.textContent;
  generateBtnText.textContent='◍ Crafting...';
  let usedGroq = false;
  let keyUsed = -1;
  let startTime = Date.now();

  try{
    const keys = window.getAllGroqKeys ? window.getAllGroqKeys() : [];
    const hasProxy = window.PROMPTCRAFT_CONFIG?.GROQ_PROXY_URL;
    let prompt = "";

    if(keys.length>0 || hasProxy){
      try{
        // Try Groq
        prompt = await craftWithGroq(idea, taskType, tone, depth, model);
        usedGroq = true;
        keyUsed = lastGroqKeyIndex;
      }catch(e){
        console.warn("Groq failed, fallback to local", e);
        if(e.message==="NO_KEYS"){
          toast("No Groq keys — using local engine. Add keys in Settings for AI power.");
        } else {
          toast(`Groq failed (${e.message}) — using local engine fallback`);
        }
        prompt = craftLocalFallback(idea, taskType, tone, depth);
        usedGroq = false;
      }
    } else {
      prompt = craftLocalFallback(idea, taskType, tone, depth);
      usedGroq = false;
      toast("Local engine used — add Groq keys in Settings for 99% quality");
    }

    promptOutput.textContent = prompt;
    outputEmpty.classList.add('hidden');
    outputContent.classList.remove('hidden');
    updateTokenStats();
    
    const elapsed = Date.now() - startTime;
    latencyStat.textContent = usedGroq ? `${(elapsed/1000).toFixed(1)}s` : `0ms`;
    
    // Analyze
    const analysis = analyzeLocal(prompt);
    miniQualityEl.textContent = `Quality: ${analysis.score}/100 • ${analysis.label}`;
    miniQualityEl.style.color = analysis.color;
    miniQualityEl.style.borderColor = analysis.color+"40";
    brainUsedEl.textContent = usedGroq ? (keyUsed>=0 ? `🧠 Groq Key ${keyUsed+1}` : `🧠 Groq Proxy`) : `⚡ Local`;
    brainUsedEl.className = usedGroq ? 'brain-used' : 'brain-used';
    if(!usedGroq) brainUsedEl.style.background='rgba(255,255,255,0.06)';
    
    craftedCount++;
    localStorage.setItem('pc_count', craftedCount);
    statCount.textContent = craftedCount;
    avgScoreEl.textContent = `${analysis.score}%`;
    
    toast(`Perfect prompt crafted — ${analysis.score}/100 ${usedGroq ? `via Groq Key ${keyUsed+1} ✨` : 'via Local ⚡'}`);
    
    if(window.innerWidth<980){
      document.querySelector('.forge-output').scrollIntoView({behavior:'smooth', block:'start'});
    }

  }catch(err){
    console.error(err);
    toast("Failed to craft: "+err.message);
  }finally{
    generateBtn.disabled=false;
    generateBtnText.textContent=origText;
    updateBrainStatus();
  }
});

// Copy
copyBtn.addEventListener('click', async ()=>{
  const text = promptOutput.textContent;
  if(!text){toast("Nothing to copy");return;}
  try{ await navigator.clipboard.writeText(text); toast("Copied to clipboard!"); }
  catch{ toast("Copy failed — select manually"); }
});

// Test quality -> send to lab
testQualityBtn.addEventListener('click', ()=>{
  const text = promptOutput.textContent;
  if(!text){toast("Generate a prompt first");return;}
  labInput.value = text;
  analyzeAndRender(text);
  document.getElementById('lab').scrollIntoView({behavior:'smooth'});
});

// Lab analyze
analyzeBtn.addEventListener('click', ()=>{
  const text = labInput.value.trim();
  if(!text){toast("Paste a prompt to analyze");return;}
  analyzeAndRender(text);
});
clearLabBtn.addEventListener('click', ()=>{
  labInput.value="";
  resultsContent.classList.add('hidden');
  resultsEmpty.classList.remove('hidden');
});

async function analyzeAndRender(text){
  const keys = window.getAllGroqKeys ? window.getAllGroqKeys() : [];
  const hasProxy = window.PROMPTCRAFT_CONFIG?.GROQ_PROXY_URL;
  const model = modelSelect.value;

  analyzeBtn.disabled=true;
  analyzeBtnText.textContent='Analyzing...';

  let analysis = null;
  let usedGroq = false;

  // Try Groq analysis if keys available
  if(keys.length>0 || hasProxy){
    try{
      const groqResult = await analyzeWithGroq(text, model);
      if(groqResult && groqResult.score){
        // Convert Groq JSON to our format
        const metricsObj = groqResult.metrics || {};
        const labelMap = { role:"Role Definition", context:"Context & Background", objective:"Objective Clarity", specificity:"Specificity & Detail", constraints:"Constraints & Rules", format:"Output Format", examples:"Examples (Few-shot)", clarity:"Clarity & Readability", instruction:"Step-by-step Instructions", tone:"Tone Guidance" };
        const metrics = Object.keys(labelMap).map(k=>({key:k, score: metricsObj[k]||50}));
        const score = groqResult.score;
        let color = score>=95 ? "#4eff9c" : score>=85 ? "#4ee8ff" : score>=70 ? "#ffcc4e" : score>=45 ? "#ff8c4e" : "#ff5c7a";
        analysis = {
          score,
          label: groqResult.label || (score>=95?"Exceptional":score>=85?"Strong":score>=70?"Good":score>=45?"Weak":"Poor"),
          desc: groqResult.desc || "Groq AI analysis",
          color,
          metrics,
          strengths: groqResult.strengths || [],
          weaknesses: groqResult.weaknesses || [],
          fixes: groqResult.fixes || [],
          wc: text.split(/\s+/).length,
          labelMap
        };
        usedGroq = true;
        $('#analyzerTag').textContent = `VR • GROQ ANALYZER • Key ${lastGroqKeyIndex+1}`;
      }
    }catch(e){
      console.warn("Groq analysis failed", e);
    }
  }

  // Fallback to local
  if(!analysis){
    analysis = analyzeLocal(text);
    $('#analyzerTag').textContent = `VR • LOCAL ANALYZER V2`;
  }

  resultsEmpty.classList.add('hidden');
  resultsContent.classList.remove('hidden');

  // Score ring
  const circumference = 2*Math.PI*44;
  const offset = circumference - (analysis.score/100)*circumference;
  scoreCircle.style.strokeDasharray = circumference;
  scoreCircle.style.strokeDashoffset = offset;
  scoreCircle.style.stroke = analysis.color;
  scoreNum.textContent = analysis.score;
  scoreNum.style.color = analysis.color;
  scoreLabel.textContent = analysis.label + (usedGroq ? " • Groq AI" : " • Local");
  scoreLabel.style.color = analysis.color;
  scoreDesc.textContent = analysis.desc;
  scoreVerdict.textContent = analysis.score>=90 ? "✓ VR CERTIFIED — SHIP IT" : analysis.score>=70 ? "◍ ALMOST THERE" : "✕ NEEDS WORK";
  scoreVerdict.style.background = analysis.color+"18";
  scoreVerdict.style.color = analysis.color;
  scoreVerdict.style.border = `1px solid ${analysis.color}30`;

  // Metrics
  metricsList.innerHTML = "";
  analysis.metrics.forEach(m=>{
    const div = document.createElement('div');
    div.className='metric';
    const color = m.score>=75 ? '#4eff9c' : m.score>=50 ? '#ffcc4e' : '#ff5c7a';
    div.innerHTML = `
      <div class="metric-top"><b>${analysis.labelMap[m.key]}</b><span style="color:${color}">${m.score}%</span></div>
      <div class="metric-bar"><i style="width:${m.score}%;background:${color};box-shadow:0 0 10px ${color}60"></i></div>
    `;
    metricsList.appendChild(div);
  });

  strengthsList.innerHTML = analysis.strengths.length ? analysis.strengths.map(s=>`<li>${s}</li>`).join('') : '<li>No clear strengths detected</li>';
  weaknessesList.innerHTML = analysis.weaknesses.length ? analysis.weaknesses.map(s=>`<li>${s}</li>`).join('') : '<li>No major weaknesses — solid prompt!</li>';
  fixesList.innerHTML = analysis.fixes.map(f=>`<li>${f}</li>`).join('');

  autoFixBtn.onclick = async ()=>{
    const idea = labInput.value.trim();
    if(!idea){ toast("Paste prompt to auto-fix"); return; }
    // Use current idea to craft perfect prompt
    ideaInput.value = idea;
    window.scrollTo({top: document.getElementById('forge').offsetTop, behavior:'smooth'});
    toast("Idea sent to Forge — hit Craft to auto-fix to 95+");
  };

  analyzeBtn.disabled=false;
  analyzeBtnText.textContent='Calculate Quality Score';
}

// Toast
let toastTimer;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toastEl.classList.remove('show'), 3200);
}

// Keyboard shortcut
document.addEventListener('keydown', e=>{
  if((e.metaKey||e.ctrlKey) && e.key==='Enter'){
    if(document.activeElement===ideaInput) generateBtn.click();
    if(document.activeElement===labInput) analyzeBtn.click();
  }
  if(e.key==='Escape' && modalOverlay.classList.contains('show')) closeModal();
});

// Model change updates brain status
modelSelect.addEventListener('change', updateBrainStatus);
