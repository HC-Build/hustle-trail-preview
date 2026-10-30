// June's voice, server side. The browser never sees XAI_API_KEY.
const WINDOW_MS = 60_000, MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();
const ALLOWED = ["https://hc-build.github.io"];
const MODEL = Deno.env.get("XAI_MODEL") || "grok-4.20-0309-non-reasoning";

function okOrigin(o: string) {
  return ALLOWED.includes(o) || o.startsWith("http://localhost") || o.startsWith("http://127.0.0.1");
}
function cors(req: Request) {
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": okOrigin(o) ? o : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}
function json(b: unknown, s: number, req: Request) {
  return new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...cors(req) } });
}
function allowRate(ip: string) {
  const now = Date.now();
  const row = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (row.length >= MAX_PER_WINDOW) { hits.set(ip, row); return false; }
  row.push(now); hits.set(ip, row);
  if (hits.size > 5000) hits.clear();
  return true;
}
function clip(t: unknown, max: number) {
  let s = String(t ?? "").replace(/[\u2013\u2014]/g, ",").trim();
  return s.length > max ? s.slice(0, max) : s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json({ error: "POST only" }, 405, req);
  if (!okOrigin(req.headers.get("Origin") || "")) return json({ error: "origin" }, 403, req);
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!allowRate(ip)) return json({ error: "slow down" }, 429, req);
  const raw = await req.text();
  if (raw.length > 8000) return json({ error: "too large" }, 413, req);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400, req); }
  const key = Deno.env.get("XAI_API_KEY");
  if (!key) return json({ error: "unconfigured" }, 500, req);
  const message = clip(body?.message, 500);
  if (!message) return json({ error: "empty" }, 400, req);
  const state = body?.state && typeof body.state === "object" ? body.state : {};
  const memory = Array.isArray(body?.memory) ? body.memory.slice(-6).map((l: unknown) => clip(l, 180)) : [];
  const system = [
    "You are June Harlow, trail boss in the game Hustle Trail.",
    "You are snarky, funny, and loyal. You gossip about fictional startups only.",
    "Never name real people or real companies. Never use an em dash or an en dash.",
    "Keep the reply under 80 words. You are the player's friend, not their boss.",
    "The game was built to make them learn and to push them into public work they avoid.",
  ].join(" ");
  const user = "Game state: " + clip(JSON.stringify(state), 1200) + "\nRecent notes: " + memory.join(" | ") + "\nPlayer says: " + message;
  try {
    const up = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 240, temperature: 0.8,
        messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!up.ok) return json({ error: "upstream" }, 502, req);
    const data = await up.json();
    const text = clip(data?.choices?.[0]?.message?.content, 600);
    if (!text) return json({ error: "empty reply" }, 502, req);
    return json({ text }, 200, req);
  } catch { return json({ error: "upstream" }, 502, req); }
});
