// Hustle Trail sign-in: Supabase magic link with plain fetch. Public anon key only.
(function (root) {
  var URL_BASE = "https://ycdbntuojctiruqkqiwt.supabase.co";
  var ANON = "sb_publishable_Qr4hcgBR728ZfSHoVomKqg_qo4moCXC";
  var SESSION_KEY = "hustle-trail-session";
  var PLAYS_KEY = "hustle-trail-plays";
  var FREE_PLAYS = 2;
  var REDIRECT = "https://hc-build.github.io/hustle-trail-preview/";

  function readSession() {
    try { var s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); return s && s.access_token ? s : null; } catch (e) { return null; }
  }
  function writeSession(s) { try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  function plays() { try { return parseInt(localStorage.getItem(PLAYS_KEY) || "0", 10) || 0; } catch (e) { return 0; } }
  function bumpPlays() { try { localStorage.setItem(PLAYS_KEY, String(plays() + 1)); } catch (e) {} }
  function userIdFrom(token) {
    try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; } catch (e) { return null; }
  }

  // Pick up #access_token=... after the magic link bounces back.
  (function captureHash() {
    if (!location.hash || location.hash.indexOf("access_token=") < 0) return;
    var p = new URLSearchParams(location.hash.slice(1));
    var s = {
      access_token: p.get("access_token"),
      refresh_token: p.get("refresh_token"),
      expires_at: Number(p.get("expires_at")) || Math.floor(Date.now() / 1000) + Number(p.get("expires_in") || 3600)
    };
    if (s.access_token) { writeSession(s); root.HT_JUST_SIGNED_IN = true; }
    history.replaceState(null, "", location.pathname + location.search);
  })();

  function freshToken() {
    var s = readSession();
    if (!s) return Promise.resolve(null);
    if (s.expires_at - 60 > Date.now() / 1000) return Promise.resolve(s.access_token);
    if (!s.refresh_token) return Promise.resolve(null);
    return fetch(URL_BASE + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.access_token) { writeSession(null); return null; }
      writeSession({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) });
      return d.access_token;
    }).catch(function () { return s.access_token; });
  }

  function sendLink(email) {
    return fetch(URL_BASE + "/auth/v1/otp?redirect_to=" + encodeURIComponent(REDIRECT), {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, create_user: true })
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  function rest(method, query, body) {
    return freshToken().then(function (tok) {
      if (!tok) return null;
      return fetch(URL_BASE + "/rest/v1/saves" + (query || ""), {
        method: method,
        headers: { apikey: ANON, Authorization: "Bearer " + tok, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) { return r.ok && method === "GET" ? r.json() : r.ok; }).catch(function () { return null; });
    });
  }

  function save(fields) {
    var s = readSession();
    var uid = s && userIdFrom(s.access_token);
    if (!uid) return Promise.resolve(false);
    var row = { user_id: uid, updated_at: new Date().toISOString() };
    if (fields.state !== undefined) row.state = fields.state;
    if (fields.best !== undefined) row.best = fields.best;
    return rest("POST", "?on_conflict=user_id", row);
  }
  function load() {
    return rest("GET", "?select=state,best").then(function (rows) { return Array.isArray(rows) && rows[0] ? rows[0] : null; });
  }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function showGate(onDone) {
    var wrap = el("div", "ht-gate");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    var card = el("div", "ht-gate-card");
    card.appendChild(el("div", "ht-gate-who", "June Harlow, trail boss"));
    var line = "Okay, this is our third date. Time to make this official. Drop your email, I'll send a magic link, and you get unlimited runs plus your progress saved.";
    card.appendChild(el("p", "ht-gate-line", line));
    var form = el("form", "ht-gate-form");
    var input = el("input");
    input.type = "email"; input.required = true; input.placeholder = "you@startup.com"; input.autocomplete = "email";
    var btn = el("button", "btn primary", "Send my magic link");
    btn.type = "submit";
    var note = el("p", "ht-gate-note", "No spam. No password. Just vibes and a link.");
    form.appendChild(input); form.appendChild(btn);
    card.appendChild(form); card.appendChild(note);
    var close = el("button", "btn ghost ht-gate-close", "Maybe later");
    close.type = "button";
    close.onclick = function () { wrap.remove(); };
    card.appendChild(close);
    wrap.appendChild(card);
    document.body.appendChild(wrap);
    if (root.HT_GUIDE && root.HT_GUIDE.say) { try { root.HT_GUIDE.say(line); } catch (e) {} }
    input.focus();
    form.onsubmit = function (ev) {
      ev.preventDefault();
      var email = input.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.textContent = "That email looks made up. I would know."; return; }
      btn.disabled = true; note.textContent = "Sending...";
      sendLink(email).then(function (ok) {
        btn.disabled = false;
        note.textContent = ok
          ? "Check your inbox and tap the link on this device. I'll be right here, pretending not to wait."
          : "The link did not send. Wait a minute and try again. Even I get rate limited.";
      });
    };
  }

  // Call before every new run. Runs cb when the player may play.
  function gate(cb) {
    if (readSession()) { cb(); return; }
    if (plays() < FREE_PLAYS) { bumpPlays(); cb(); return; }
    showGate(cb);
  }

  root.HT_AUTH = {
    gate: gate, save: save, load: load,
    signedIn: function () { return !!readSession(); },
    signOut: function () { writeSession(null); },
    justSignedIn: function () { return !!root.HT_JUST_SIGNED_IN; }
  };
})(window);
