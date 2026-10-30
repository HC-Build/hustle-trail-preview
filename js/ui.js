(function () {
  var HT = window.HT;
  var app = document.getElementById("app");
  var BEST_KEY = "hustle-trail-best";
  var MUTE_KEY = "hustle-trail-mute";

  var state = {
    screen: "title",
    best: readBest(),
    mute: false,
    speed: 1,
    party: HT.createParty(Math.random),
    difficulty: "founder",
    warmIntro: false,
    helpOpen: false,
    run: null,
    timer: null,
    overlayKey: "",
    eventTimer: null,
    pitchRAF: null,
    huntTimers: [],
    audio: null,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  try { state.mute = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { state.mute = false; }

  function readBest() {
    try {
      var raw = localStorage.getItem(BEST_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      if (typeof data.score !== "number" || !isFinite(data.score)) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeBest(record) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(record)); } catch (e) {}
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function commas(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function signed(n) {
    var v = Math.round(n * 10) / 10;
    if (Math.abs(v - Math.round(v)) < 0.05) v = Math.round(v);
    return (v > 0 ? "+" : "") + v;
  }

  function unlock() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!state.audio) state.audio = new AC();
    if (state.audio.state === "suspended") state.audio.resume();
  }

  function beep(freq, dur, type, gain) {
    if (state.mute || !state.audio) return;
    var o = state.audio.createOscillator();
    var g = state.audio.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    g.gain.value = gain || 0.04;
    o.connect(g);
    g.connect(state.audio.destination);
    o.start();
    var stopAt = state.audio.currentTime + dur;
    g.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    o.stop(stopAt);
  }

  function toneGood() { beep(523, 0.08, "square", 0.04); setTimeout(function () { beep(659, 0.12, "square", 0.04); }, 90); }
  function toneBad() { beep(196, 0.12, "sawtooth", 0.03); setTimeout(function () { beep(140, 0.16, "sawtooth", 0.03); }, 100); }
  function toneClick() { beep(440, 0.05, "square", 0.03); }

  function fanfare() {
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.14, "square", 0.04); }, i * 120);
    });
  }

  function dirge() {
    [392, 349, 311, 262].forEach(function (f, i) {
      setTimeout(function () { beep(f, 0.16, "triangle", 0.04); }, i * 140);
    });
  }

  function toggleMute() {
    state.mute = !state.mute;
    try { localStorage.setItem(MUTE_KEY, state.mute ? "1" : "0"); } catch (e) {}
    var btn = document.getElementById("mute");
    if (btn) btn.textContent = state.mute ? "Sound off" : "Sound on";
  }

  function toolbar() {
    var bar = el("div", "toolbar");
    var mute = el("button", "icon-btn", state.mute ? "Sound off" : "Sound on");
    mute.id = "mute";
    mute.type = "button";
    mute.addEventListener("click", function () { unlock(); toggleMute(); });
    bar.appendChild(mute);
    return bar;
  }

  function wagonMark() {
    var wrap = el("div", "mark");
    wrap.innerHTML = "<svg viewBox='0 0 160 78' aria-hidden='true'><rect x='36' y='28' width='78' height='22' rx='3' fill='#8a4b24' stroke='#24170f' stroke-width='3'/><path d='M48 30c0-16 14-22 28-22s30 8 30 22' fill='#f4ead7' stroke='#24170f' stroke-width='3'/><rect x='78' y='16' width='18' height='12' fill='#243044' stroke='#24170f' stroke-width='2'/><circle cx='58' cy='56' r='14' fill='#f4ead7' stroke='#24170f' stroke-width='4'/><circle cx='108' cy='56' r='14' fill='#f4ead7' stroke='#24170f' stroke-width='4'/><circle cx='58' cy='56' r='3' fill='#24170f'/><circle cx='108' cy='56' r='3' fill='#24170f'/></svg>";
    return wrap;
  }

  function render() {
    if (state.screen === "title") renderTitle();
    else if (state.screen === "setup") renderSetup();
    else if (state.screen === "trail") renderTrail();
    else if (state.screen === "recap") renderRecap();
  }

  function renderTitle() {
    app.replaceChildren();
    var wrap = el("div", "title-screen");
    wrap.appendChild(toolbar());
    var hero = el("section", "hero");
    hero.appendChild(wagonMark());
    hero.appendChild(el("p", "eyebrow", "Startup and Oregon Trail had a kid"));
    hero.appendChild(el("h1", "wordmark", "Hustle Trail"));
    hero.appendChild(el("p", "lede", "Roll a company from a garage to mile 2000. The tank, the cap table, and the people in the wagon can all end the trip."));
    var best = el("div", "best-card");
    if (state.best) {
      best.appendChild(el("div", null, "Best score"));
      var line = el("strong", null, commas(state.best.score));
      best.appendChild(line);
      var diff = HT.DIFFICULTIES[state.best.difficulty];
      var ending = HT.DATA.ENDINGS[state.best.ending];
      best.appendChild(el("p", null, (state.best.company || "A wagon") + " · " + (diff ? diff.label : "") + " · " + (ending ? ending.title : state.best.status)));
    } else {
      best.appendChild(el("div", null, "Best score"));
      best.appendChild(el("strong", null, "None yet"));
      best.appendChild(el("p", null, "Finish a run and this browser keeps the number."));
    }
    hero.appendChild(best);
    var row = el("div", "row");
    var start = el("button", "primary", "Hit the trail");
    start.type = "button";
    start.addEventListener("click", function () { unlock(); state.screen = "setup"; renderSetup(); });
    var how = el("button", "ghost", state.helpOpen ? "Hide the rules" : "How to play");
    how.type = "button";
    how.addEventListener("click", function () { state.helpOpen = !state.helpOpen; renderTitle(); });
    row.appendChild(start);
    row.appendChild(how);
    hero.appendChild(row);
    wrap.appendChild(hero);
    if (state.helpOpen) {
      var help = el("section", "help");
      var list = el("ol");
      HT.DATA.HELP.forEach(function (line) { list.appendChild(el("li", null, line)); });
      help.appendChild(list);
      wrap.appendChild(help);
    }
    app.appendChild(wrap);
    if (window.HT_GUIDE) HT_GUIDE.onScreen("title");
  }

  function renderSetup() {
    app.replaceChildren();
    var wrap = el("div", "setup-screen");
    wrap.appendChild(toolbar());
    wrap.appendChild(el("h1", null, "Name the wagon"));
    var card = el("section", "sheet-card");
    card.appendChild(el("label", null, "Company"));
    var name = el("input");
    name.type = "text";
    name.id = "company";
    name.maxLength = 24;
    name.placeholder = "Wagon Labs";
    name.value = state.company || "";
    name.autocomplete = "off";
    card.appendChild(name);
    card.appendChild(el("p", "hint", "This is what the trail calls you. Twenty-four letters is plenty."));
    card.appendChild(el("label", null, "What it does"));
    var pitch = el("input");
    pitch.type = "text";
    pitch.id = "pitch";
    pitch.maxLength = 90;
    pitch.placeholder = "Software for people who are tired.";
    pitch.value = state.pitchLine || "";
    card.appendChild(pitch);
    wrap.appendChild(card);

    var diffCard = el("section", "sheet-card");
    diffCard.appendChild(el("h2", null, "Difficulty"));
    var diffs = el("div", "diffs");
    Object.keys(HT.DIFFICULTIES).forEach(function (id) {
      var d = HT.DIFFICULTIES[id];
      var btn = el("button", "diff" + (state.difficulty === id ? " on" : ""));
      btn.type = "button";
      btn.appendChild(el("strong", null, d.label));
      btn.appendChild(el("span", null, d.blurb));
      btn.addEventListener("click", function () {
        rememberForm();
        state.difficulty = id;
        renderSetup();
      });
      diffs.appendChild(btn);
    });
    diffCard.appendChild(diffs);
    wrap.appendChild(diffCard);

    var warmCard = el("section", "sheet-card");
    var check = el("label", "check");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.id = "warm";
    box.checked = state.warmIntro;
    check.appendChild(box);
    var words = el("span");
    words.appendChild(el("strong", null, "Warm intro"));
    words.appendChild(document.createTextNode(" Start at 90% equity with a little traction. Bad odds shrink by a tenth. You owe someone a favor, which is the whole trade."));
    check.appendChild(words);
    warmCard.appendChild(check);
    wrap.appendChild(warmCard);

    var partyCard = el("section", "sheet-card");
    partyCard.appendChild(el("h2", null, "Cofounders"));
    partyCard.appendChild(el("p", "hint", "Three people. Their habits change the math. If all three quit, the run is over."));
    var party = el("div", "party");
    party.id = "party-row";
    partyCard.appendChild(party);
    var reroll = el("button", "ghost", "Reroll the party");
    reroll.type = "button";
    reroll.addEventListener("click", function () {
      rememberForm();
      state.party = HT.createParty(Math.random);
      fillParty();
    });
    partyCard.appendChild(reroll);
    wrap.appendChild(partyCard);

    var go = el("button", "primary", "Leave the garage");
    go.type = "button";
    go.addEventListener("click", function () { unlock(); startRun(); });
    wrap.appendChild(go);
    var back = el("button", "texty", "Back");
    back.type = "button";
    back.addEventListener("click", function () { rememberForm(); state.screen = "title"; renderTitle(); });
    wrap.appendChild(back);
    app.appendChild(wrap);
    fillParty();
    name.focus();
    if (window.HT_GUIDE) HT_GUIDE.onScreen("setup");
  }

  function fillParty() {
    var row = document.getElementById("party-row");
    if (!row) return;
    row.replaceChildren();
    state.party.forEach(function (c) {
      var card = el("article", "person");
      card.appendChild(el("h3", null, c.name));
      card.appendChild(el("p", "trait", c.traitName));
      card.appendChild(el("p", "muted", c.traitBlurb));
      row.appendChild(card);
    });
  }

  function rememberForm() {
    var name = document.getElementById("company");
    var pitch = document.getElementById("pitch");
    var warm = document.getElementById("warm");
    if (name) state.company = name.value;
    if (pitch) state.pitchLine = pitch.value;
    if (warm) state.warmIntro = warm.checked;
  }

  function startRun() {
    rememberForm();
    clearMinigames();
    state.run = HT.createGame({
      company: state.company,
      pitchLine: state.pitchLine,
      difficulty: state.difficulty,
      warmIntro: state.warmIntro,
      cofounders: state.party.map(function (c) {
        return {
          id: c.id,
          name: c.name,
          trait: c.trait,
          traitName: c.traitName,
          traitBlurb: c.traitBlurb,
          alive: true,
          reason: ""
        };
      })
    });
    state.company = state.run.company;
    state.pitchLine = state.run.pitchLine;
    state.overlayKey = "";
    state.screen = "trail";
    renderTrail();
    startLoop();
    toneClick();
    if (window.HT_GUIDE) HT_GUIDE.onRun(state.run);
  }

  function startLoop() {
    if (state.timer) clearInterval(state.timer);
    var ms = state.speed === 2 ? 700 : 1400;
    state.timer = setInterval(tick, ms);
  }

  function tick() {
    if (document.hidden) return;
    var run = state.run;
    if (!run || state.screen !== "trail") return;
    if (run.phase !== "travel" || run.paused || run.status !== "playing") return;
    HT.travelDay(run);
    afterChange();
  }

  function afterChange() {
    if (!state.run) return;
    if (window.HT_GUIDE && state.run.phase !== "ended") HT_GUIDE.onChange(state.run);
    if (state.run.phase === "ended") {
      enterRecap();
      return;
    }
    if (state.screen === "trail") {
      paintTrail();
      syncOverlay();
    }
  }

  function renderTrail() {
    var run = state.run;
    app.replaceChildren();
    var root = el("div", "trail");
    var top = el("header", "top span-2");
    top.appendChild(toolbar());
    top.appendChild(el("h1", null, run.company));
    top.appendChild(el("p", "objective", "Win at mile 2000. Lose if runway hits 0, equity hits 0, or every cofounder quits."));
    var meta = el("div", "meta");
    meta.appendChild(pill("Day", "day", run.day));
    meta.appendChild(pill("Score", "score", commas(run.score)));
    meta.appendChild(pill("Best", "best", state.best ? commas(state.best.score) : "0"));
    meta.appendChild(el("span", "pill", HT.DIFFICULTIES[run.difficulty].label));
    meta.appendChild(el("span", "pill", run.warmIntro ? "Warm intro" : "Cold start"));
    top.appendChild(meta);
    var next = el("p", "objective");
    next.id = "next-goal";
    top.appendChild(next);
    var map = el("div", "map");
    var track = el("div", "map-track");
    var fill = el("div", "map-fill");
    fill.id = "map-fill";
    track.appendChild(fill);
    HT.DATA.MILESTONES.forEach(function (m) {
      var pin = el("div", "map-pin");
      pin.style.left = (m.mile / 2000 * 100) + "%";
      pin.title = m.name + " · mile " + m.mile;
      pin.dataset.mile = String(m.mile);
      track.appendChild(pin);
    });
    var you = el("div", "map-you");
    you.id = "map-you";
    track.appendChild(you);
    map.appendChild(track);
    var labels = el("div", "map-labels");
    labels.appendChild(el("span", null, "Garage"));
    labels.appendChild(el("span", null, "Exit 2000"));
    map.appendChild(labels);
    top.appendChild(map);
    root.appendChild(top);

    var scene = el("section", "scene");
    scene.id = "scene";
    scene.appendChild(el("div", "stars"));
    var stars = scene.querySelector(".stars");
    for (var i = 0; i < 18; i++) {
      var star = document.createElement("i");
      star.style.left = (5 + (i * 47) % 90) + "%";
      star.style.top = (6 + (i * 29) % 40) + "%";
      stars.appendChild(star);
    }
    scene.appendChild(el("div", "sun"));
    scene.appendChild(el("div", "hills"));
    scene.appendChild(el("div", "ground-line"));
    var sign = el("div", "sign");
    sign.appendChild(el("strong", null, ""));
    sign.querySelector("strong").id = "sign-name";
    var miles = el("span");
    miles.id = "sign-miles";
    sign.appendChild(miles);
    scene.appendChild(sign);
    var quote = el("p", "quote");
    quote.id = "quote";
    scene.appendChild(quote);
    var wagon = el("div", "wagon");
    wagon.id = "wagon";
    wagon.appendChild(el("div", "riders"));
    wagon.appendChild(el("div", "cover"));
    wagon.appendChild(el("div", "laptop"));
    wagon.appendChild(el("div", "bed"));
    var back = el("div", "wheel back");
    var front = el("div", "wheel front");
    back.id = "wheel-a";
    front.id = "wheel-b";
    wagon.appendChild(back);
    wagon.appendChild(front);
    scene.appendChild(wagon);
    var paused = el("div", "pause-banner");
    paused.id = "pause-banner";
    paused.hidden = true;
    paused.textContent = "Camped. Nothing burns until you roll.";
    scene.appendChild(paused);
    root.appendChild(scene);

    var sheet = el("section", "sheet");
    ["runway", "equity", "morale", "traction", "unicorn"].forEach(function (key) {
      var row = el("div", "meter");
      row.id = "meter-" + key;
      var head = el("div", "meter-head");
      head.appendChild(el("span", null, labelFor(key)));
      var b = el("b");
      b.id = "stat-" + key;
      head.appendChild(b);
      row.appendChild(head);
      var bar = el("div", "track");
      var fillBar = el("div", "fill");
      fillBar.id = "bar-" + key;
      bar.appendChild(fillBar);
      row.appendChild(bar);
      sheet.appendChild(row);
    });
    sheet.appendChild(el("p", "section-label", "Goals"));
    var goals = el("ul", "goals");
    goals.id = "goals";
    sheet.appendChild(goals);
    sheet.appendChild(el("p", "hint", "Quiet Wealth: reach the exit without raising, still holding 68% equity. The bell wants traction of 70. Selling looks respectable at 40% equity."));
    sheet.appendChild(el("p", "section-label", "Team"));
    var team = el("ul", "team");
    team.id = "team";
    sheet.appendChild(team);
    sheet.appendChild(el("p", "hint", run.pitchLine));
    root.appendChild(sheet);

    var actions = el("section", "actions span-2");
    ["steady", "hustle", "crunch"].forEach(function (id) {
      var pace = HT.PACES[id];
      var btn = el("button", "pace");
      btn.type = "button";
      btn.dataset.pace = id;
      btn.appendChild(document.createTextNode(pace.label));
      var small = el("small", null, pace.blurb);
      btn.appendChild(small);
      btn.addEventListener("click", function () { setPace(id); });
      actions.appendChild(btn);
    });
    actions.appendChild(actionButton("rest", "Rest", function () { doRest(); }));
    actions.appendChild(actionButton("email", "Cold email", function () { doEmail(); }));
    actions.appendChild(actionButton("hunt", "User hunt", function () { doHunt(); }));
    var pause = actionButton("pause", "Hold up", function () { togglePause(); });
    actions.appendChild(pause);
    var fast = actionButton("fast", "Fast travel", function () { toggleSpeed(); });
    actions.appendChild(fast);
    var questsBtn = actionButton("quests", "Side quests", function () { openQuests(); });
    actions.appendChild(questsBtn);
    root.appendChild(actions);

    var log = el("section", "log span-2");
    var ol = document.createElement("ol");
    ol.id = "log";
    log.appendChild(ol);
    log.setAttribute("aria-live", "polite");
    root.appendChild(log);
    root.appendChild(el("p", "hints span-2", "Keys: 1 steady, 2 hustle, 3 crunch, R rest, C cold email, U user hunt, P pause, F fast travel, M mute. In an event, 1 to 4 chooses. Space continues."));
    app.appendChild(root);
    paintTrail();
    syncOverlay();
  }

  function pill(label, id, value) {
    var node = el("span", "pill");
    node.appendChild(document.createTextNode(label + " "));
    var b = el("strong", null, String(value));
    b.id = id + "-val";
    node.appendChild(b);
    return node;
  }

  function labelFor(key) {
    return { runway: "Runway", equity: "Equity", morale: "Morale", traction: "Traction", unicorn: "Unicorn Glow" }[key];
  }

  function actionButton(id, text, fn) {
    var btn = el("button", "action");
    btn.type = "button";
    btn.id = "btn-" + id;
    btn.textContent = text;
    btn.addEventListener("click", function () { unlock(); fn(); });
    return btn;
  }

  function paintTrail() {
    var run = state.run;
    if (!run || !document.getElementById("scene")) return;
    setText("day-val", run.day);
    setText("score-val", commas(run.score));
    setText("best-val", state.best ? commas(state.best.score) : "0");
    paintStat("runway", run.runway, 100);
    paintStat("equity", run.equity, 100);
    paintStat("morale", run.morale, 100);
    paintStat("traction", run.traction, 100);
    paintStat("unicorn", run.unicorn || 0, 100);
    var seg = HT.segmentInfo(run.miles);
    var scene = document.getElementById("scene");
    scene.dataset.segment = seg.id;
    setText("sign-name", seg.name);
    setText("sign-miles", Math.round(run.miles) + " mi");
    setText("quote", HT.quoteFor(run));
    var next = HT.nextMilestone(run);
    setText("next-goal", next
      ? "Next goal: " + next.name + " at mile " + next.mile + ". " + Math.max(0, Math.round(next.mile - run.miles)) + " miles to go. " + next.goal + "."
      : "The exit is under the wheels. Choose how the company ends.");
    var pct = Math.max(0, Math.min(100, run.miles / 2000 * 100));
    document.getElementById("map-fill").style.width = pct + "%";
    document.getElementById("map-you").style.left = pct + "%";
    var pins = document.querySelectorAll(".map-pin");
    pins.forEach(function (pin) {
      var mile = Number(pin.dataset.mile);
      var done = run.milestonesHit.some(function (h) { return h.mile === mile; });
      pin.classList.toggle("done", done);
      pin.classList.toggle("current", !!(next && next.mile === mile));
    });
    var wagon = document.getElementById("wagon");
    var moving = run.phase === "travel" && !run.paused && !state.reduced;
    wagon.classList.toggle("moving", moving);
    var rot = "rotate(" + (run.miles * 14) + "deg)";
    document.getElementById("wheel-a").style.transform = rot;
    document.getElementById("wheel-b").style.transform = rot;
    var riders = wagon.querySelector(".riders");
    riders.replaceChildren();
    run.cofounders.forEach(function (c) {
      riders.appendChild(el("span", "rider" + (c.alive ? "" : " gone")));
    });
    document.getElementById("pause-banner").hidden = !run.paused;
    document.querySelectorAll(".pace").forEach(function (btn) {
      var on = btn.dataset.pace === run.pace;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var rest = document.getElementById("btn-rest");
    rest.textContent = "";
    rest.appendChild(document.createTextNode("Rest"));
    rest.appendChild(el("small", null, "-" + HT.campCost(run) + " runway, morale up"));
    var email = document.getElementById("btn-email");
    email.disabled = run.emails <= 0 || run.phase !== "travel";
    email.textContent = "";
    email.appendChild(document.createTextNode("Cold email (" + run.emails + ")"));
    email.appendChild(el("small", null, "Spend a day. No equity."));
    var hunt = document.getElementById("btn-hunt");
    hunt.disabled = run.hunts <= 0 || run.phase !== "travel";
    hunt.textContent = "";
    hunt.appendChild(document.createTextNode("User hunt (" + run.hunts + ")"));
    hunt.appendChild(el("small", null, "9 seconds, tap the users"));
    document.getElementById("btn-pause").textContent = run.paused ? "Roll again" : "Hold up";
    document.getElementById("btn-fast").textContent = state.speed === 2 ? "Fast travel on" : "Fast travel";
    var goals = document.getElementById("goals");
    goals.replaceChildren();
    HT.goals(run).forEach(function (g) {
      var li = el("li", (g.done ? "done" : "") + (g.current ? " current" : ""));
      li.appendChild(el("span", null, (g.done ? "Done: " : g.current ? "Now: " : "Ahead: ") + g.name));
      li.appendChild(el("span", null, "mile " + g.mile));
      goals.appendChild(li);
    });
    var team = document.getElementById("team");
    team.replaceChildren();
    run.cofounders.forEach(function (c) {
      var li = el("li");
      li.appendChild(el("span", null, c.name + " · " + c.traitName));
      li.appendChild(el("span", null, c.alive ? "On the wagon" : c.reason));
      team.appendChild(li);
    });
    var log = document.getElementById("log");
    log.replaceChildren();
    run.log.forEach(function (line) {
      var li = el("li", line.tone || "", "Day " + line.day + ". " + line.text);
      log.appendChild(li);
    });
    ["rest", "email", "hunt", "pause", "fast", "quests"].forEach(function (id) {
      var btn = document.getElementById("btn-" + id);
      if (id === "email" || id === "hunt") return;
      if (btn) btn.disabled = run.phase !== "travel";
    });
    document.querySelectorAll(".pace").forEach(function (btn) {
      btn.disabled = run.phase !== "travel";
    });
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function paintStat(key, value, max) {
    setText("stat-" + key, key === "traction" ? String(Math.round(value)) : String(Math.round(value)));
    var bar = document.getElementById("bar-" + key);
    if (bar) bar.style.width = Math.max(0, Math.min(100, (value / max) * 100)) + "%";
    var row = document.getElementById("meter-" + key);
    if (!row) return;
    row.classList.toggle("danger", key !== "traction" && value <= 25);
    row.classList.toggle("good", key === "traction" && value >= 40);
  }

  function setPace(id) {
    if (!state.run || state.run.phase !== "travel") return;
    HT.setPace(state.run, id);
    toneClick();
    paintTrail();
  }

  function togglePause() {
    if (!state.run || state.run.phase !== "travel") return;
    state.run.paused = !state.run.paused;
    paintTrail();
  }

  function toggleSpeed() {
    state.speed = state.speed === 2 ? 1 : 2;
    startLoop();
    paintTrail();
  }

  function doRest() {
    if (!state.run || state.run.phase !== "travel") return;
    HT.rest(state.run);
    toneClick();
    afterChange();
  }

  function doEmail() {
    if (!state.run || state.run.phase !== "travel" || state.run.emails <= 0) return;
    HT.coldEmail(state.run);
    toneClick();
    afterChange();
  }

  function loadQuestClock() {
    try {
      var raw = localStorage.getItem("hustle-trail-sidequests");
      var data = raw ? JSON.parse(raw) : {};
      data.at = data.at || {};
      data.globalAt = data.globalAt || 0;
      return data;
    } catch (e) {
      return { at: {}, globalAt: 0 };
    }
  }

  function saveQuestClock(clock) {
    try { localStorage.setItem("hustle-trail-sidequests", JSON.stringify(clock)); } catch (e) {}
  }

  function openQuests() {
    if (!state.run || state.run.phase !== "travel") return;
    state.run.paused = true;
    state.questOpened = state.questOpened || {};
    mountQuests();
    paintTrail();
  }

  function closeQuests() {
    var old = document.getElementById("overlay");
    if (old) old.remove();
    state.overlayKey = "";
    document.body.classList.remove("overlay-open");
    var guide = document.getElementById("guide");
    if (guide) guide.classList.remove("auto-min");
    if (state.run && state.run.phase === "travel") state.run.paused = false;
    paintTrail();
  }

  function mountQuests() {
    var run = state.run;
    var old = document.getElementById("overlay");
    if (old) old.remove();
    document.body.classList.add("overlay-open");
    var guide = document.getElementById("guide");
    if (guide) guide.classList.add("auto-min");
    var overlay = el("div");
    overlay.id = "overlay";
    var card = el("section", "card");
    card.appendChild(el("p", "kicker", "Hustle side quests"));
    card.appendChild(el("h2", null, "The work founders dodge"));
    var clock = loadQuestClock();
    var streak = el("p", "body");
    streak.id = "quest-streak";
    streak.textContent = "Do it in the real world, then claim it. Quick posts pay runway. Boring consistency pays traction. Vulnerable work pays Unicorn Glow. Streak: " + (clock.streak || 0) + ".";
    card.appendChild(streak);
    if (window.HT_GUIDE) card.appendChild(juneAside("This game is here to make you learn, and to push you into the public work you avoid. Showing up pays off. Watch the clip, like it, comment in the dare, then paste it here. Keep it kind and on topic."));
    card.appendChild(el("h3", null, "Watch and Engage"));
    HT.watchClips().forEach(function (clip, index) { card.appendChild(clipCard(run, clip, index)); });
    card.appendChild(el("h3", null, "The other grind"));
    var list = HT.DATA.SIDE_QUESTS.entries;
    list.forEach(function (quest) { card.appendChild(questCard(run, quest)); });
    var close = el("button", "ghost", "Back to the trail");
    close.type = "button";
    close.addEventListener("click", closeQuests);
    card.appendChild(close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function clipCard(run, clip, index) {
    var box = el("article", "quest");
    var style = window.HT_GUIDE ? HT_GUIDE.styleForClip(run, index) : null;
    box.appendChild(el("p", "kicker", clip.category || "Clip"));
    box.appendChild(el("h3", null, clip.title));
    box.appendChild(el("p", null, clip.lesson || ""));
    box.appendChild(el("p", "trait", rewardLabel(clip.reward)));
    if (!HT.isRealUrl(clip.url)) box.appendChild(el("p", "hint", "PLACEHOLDER_URL. Matt: paste a real link in WATCH_CLIPS."));
    if (style) {
      var dareLine = el("p", null, (style.featured ? "Featured dare: " : "Dare: ") + style.label);
      box.appendChild(dareLine);
    }
    box.appendChild(el("p", "hint", "Watch it, like it, leave a real comment in that style. Kind, and about the clip. Then paste it here."));
    var status = el("p", "hint");
    status.id = "qstatus-clip-" + index;
    box.appendChild(status);
    var open = el("button", "choice", HT.isRealUrl(clip.url) ? "Open the clip" : "Clip link not in yet");
    open.type = "button";
    open.disabled = !HT.isRealUrl(clip.url);
    open.addEventListener("click", function () {
      state.questOpened["clip-" + index] = true;
      window.open(clip.url, "_blank", "noopener,noreferrer");
      status.textContent = "Clip opened. Watch, like, comment, then paste it.";
      if (window.HT_GUIDE && style) HT_GUIDE.say(style.announce, "june");
    });
    box.appendChild(open);
    var note = el("input");
    note.type = "text";
    note.maxLength = 240;
    note.placeholder = "Paste your comment or one takeaway";
    note.addEventListener("input", function () {
      if (!style || !window.HT_GUIDE) return;
      var rated = HT_GUIDE.rateComment(style, note.value);
      status.textContent = rated.reaction;
    });
    box.appendChild(note);
    var claim = el("button", "primary", "I watched, liked, and commented");
    claim.type = "button";
    claim.addEventListener("click", function () { finishClip(index, clip, style, note.value); });
    box.appendChild(claim);
    return box;
  }

  function finishClip(index, clip, style, note) {
    var rated = style && window.HT_GUIDE ? HT_GUIDE.rateComment(style, note) : null;
    var status = document.getElementById("qstatus-clip-" + index);
    function speak(line) {
      if (status) status.textContent = line;
      if (window.HT_GUIDE) HT_GUIDE.say(line, "june");
    }
    if (!HT.isRealUrl(clip.url)) {
      var wait = window.HT_GUIDE ? HT_GUIDE.sideQuestLine("placeholder") : "Placeholder URL.";
      speak((rated ? rated.reaction + " " : "") + wait);
      return;
    }
    var clock = loadQuestClock();
    var result = HT.claimWatchClip(state.run, index, {
      opened: !!(state.questOpened && state.questOpened["clip-" + index]),
      note: note,
      bonus: rated && rated.nailed ? rated.bonus : null
    }, Date.now(), clock);
    if (!result.ok) {
      var line = window.HT_GUIDE ? HT_GUIDE.sideQuestLine(result.reason, { title: clip.title }) : "Not yet.";
      if (rated && result.reason !== "short") line = rated.reaction + " " + line;
      speak(line);
      return;
    }
    HT.markQuestClaim(state.run, result.id, Date.now(), clock);
    saveQuestClock(clock);
    HT.playBeat(state.run, result.beat);
    var cheer = window.HT_GUIDE ? HT_GUIDE.sideQuestLine("watch-ok", null, result.streak) : "Paid.";
    if (rated) cheer = rated.reaction + " " + cheer;
    speak(cheer);
    paintTrail();
    var streakLine = document.getElementById("quest-streak");
    if (streakLine) streakLine.textContent = "Streak: " + (clock.streak || 1);
  }

  function rewardLabel(rewards) {
    if (!rewards) return "";
    var bits = [];
    if (rewards.runway) bits.push("+" + rewards.runway + " runway");
    if (rewards.traction) bits.push("+" + rewards.traction + " traction");
    if (rewards.unicorn) bits.push("+" + rewards.unicorn + " Unicorn Glow");
    return bits.join(", ");
  }

  function dare(quest) {
    if (window.HT_GUIDE) HT_GUIDE.say(HT_GUIDE.sideQuestLine("dare", quest), "june");
  }

  function openChannel(run, quest, channel) {
    state.questOpened[quest.id] = true;
    var text = HT.fillDraft(run, quest.draft || "");
    var url = HT.channelUrl(channel, text);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    var status = document.getElementById("qstatus-" + quest.id);
    if (status) status.textContent = channel === "linkedin" ? "LinkedIn starter opened. Post your words, then confirm." : "X draft opened. Post it, then confirm.";
    dare(quest);
  }

  function questCard(run, quest) {
    var box = el("article", "quest");
    var pace = quest.pace === "vulnerable" ? "Vulnerable" : quest.pace === "steady" ? "Slow and boring" : "Quick";
    box.appendChild(el("h3", null, quest.title));
    box.appendChild(el("p", "trait", pace + " · " + rewardLabel(quest.rewards)));
    box.appendChild(el("p", null, quest.blurb));
    var status = el("p", "hint");
    status.id = "qstatus-" + quest.id;
    box.appendChild(status);
    if (quest.kind === "post") {
      (quest.channels || ["x"]).forEach(function (channel) {
        var label = channel === "linkedin" ? "Start on LinkedIn" : "Start on X";
        var btn = el("button", "choice", label);
        btn.type = "button";
        btn.addEventListener("click", function () { openChannel(run, quest, channel); });
        box.appendChild(btn);
      });
      var did = el("button", "primary", "I posted it");
      did.type = "button";
      did.addEventListener("click", function () { finishQuest(quest, { started: true }); });
      box.appendChild(did);
    } else if (quest.kind === "comment") {
      var note = el("input");
      note.type = "text";
      note.maxLength = 200;
      note.placeholder = "The comment you will actually leave";
      box.appendChild(note);
      var left = el("button", "primary", "I posted that comment");
      left.type = "button";
      left.addEventListener("click", function () {
        dare(quest);
        finishQuest(quest, { done: true, note: note.value });
      });
      box.appendChild(left);
    } else if (quest.kind === "dm") {
      var count = 0;
      var mark = el("button", "choice", "Mark a DM sent (0/3)");
      mark.type = "button";
      mark.addEventListener("click", function () {
        if (count === 0) dare(quest);
        if (count < 3) count += 1;
        state.questSteps = state.questSteps || {};
        state.questSteps[quest.id] = count;
        mark.textContent = "Mark a DM sent (" + count + "/3)";
        status.textContent = count >= 3 ? "Three sent. Claim it." : "Keep going. This is the boring part.";
      });
      box.appendChild(mark);
      var claimDm = el("button", "primary", "I sent 3 DMs");
      claimDm.type = "button";
      claimDm.addEventListener("click", function () {
        finishQuest(quest, { steps: (state.questSteps && state.questSteps[quest.id]) || 0 });
      });
      box.appendChild(claimDm);
    } else {
      var filmed = el("button", "choice", "I hit record");
      filmed.type = "button";
      filmed.addEventListener("click", function () {
        state.questOpened[quest.id] = true;
        status.textContent = "Clock started in the real world. Come back when the minute exists.";
        dare(quest);
      });
      box.appendChild(filmed);
      var exists = el("button", "primary", "The 60 seconds exist");
      exists.type = "button";
      exists.addEventListener("click", function () { finishQuest(quest, { started: true }); });
      box.appendChild(exists);
    }
    return box;
  }

  function finishQuest(quest, extra) {
    var run = state.run;
    extra = extra || {};
    if (quest.kind === "post" || quest.kind === "video") {
      extra.started = !!(extra.started && state.questOpened && state.questOpened[quest.id]);
    }
    var clock = loadQuestClock();
    var result = HT.claimSideQuest(run, quest.id, extra, Date.now(), clock);
    var status = document.getElementById("qstatus-" + quest.id);
    if (!result.ok) {
      var line = window.HT_GUIDE ? HT_GUIDE.sideQuestLine(result.reason, quest) : "Not yet.";
      if (status) status.textContent = line;
      if (window.HT_GUIDE) HT_GUIDE.say(line, "june");
      return;
    }
    HT.markQuestClaim(run, quest.id, Date.now(), clock);
    saveQuestClock(clock);
    HT.playBeat(run, result.beat);
    var cheer = window.HT_GUIDE ? HT_GUIDE.sideQuestLine("ok", quest, result.streak) : "Done.";
    if (status) status.textContent = cheer;
    if (window.HT_GUIDE) HT_GUIDE.say(cheer, "june");
    paintTrail();
    var streakLine = document.getElementById("quest-streak");
    if (streakLine) streakLine.textContent = "Streak: " + (clock.streak || 1);
  }

  function doHunt() {
    if (!state.run || state.run.phase !== "travel") return;
    var res = HT.beginHunt(state.run);
    if (!res.ok) return;
    toneClick();
    afterChange();
  }

  function overlayKey() {
    var run = state.run;
    if (!run || state.screen !== "trail") return "";
    if (run.phase === "event" && run.pending) return "event:" + run.day + ":" + run.pending.title;
    if (run.phase === "result" && run.result) return "result:" + run.day + ":" + run.result.title + ":" + run.result.text.slice(0, 24);
    if (run.phase === "pitch") return "pitch:" + run.day;
    if (run.phase === "hunt") return "hunt:" + run.day + ":" + run.hunts;
    if (run.phase === "scene" && run.scene && run.scene.def) return "scene:" + run.scene.def.id + ":" + run.scene.step;
    return "";
  }

  function syncOverlay() {
    var key = overlayKey();
    if (key === state.overlayKey) return;
    clearMinigames();
    state.overlayKey = key;
    var old = document.getElementById("overlay");
    if (old) old.remove();
    var open = !!key;
    document.body.classList.toggle("overlay-open", open);
    var guide = document.getElementById("guide");
    if (guide && open) guide.classList.add("auto-min");
    if (guide && !open) guide.classList.remove("auto-min");
    if (!key) return;
    if (state.run.phase === "scene") mountScene();
    else if (state.run.phase === "event") mountEvent();
    else if (state.run.phase === "result") mountResult();
    else if (state.run.phase === "pitch") mountPitch();
    else if (state.run.phase === "hunt") mountHunt();
  }

  function juneAside(text) {
    var row = el("div", "june-aside");
    row.innerHTML = window.HT_GUIDE ? HT_GUIDE.avatarSvg() : "";
    row.appendChild(el("p", null, text));
    return row;
  }

  function mountScene() {
    var run = state.run;
    var scene = run.scene;
    var def = scene.def;
    var overlay = el("div");
    overlay.id = "overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    var card = el("section", "card");
    card.appendChild(el("p", "kicker", def.place || "A scene"));
    card.appendChild(el("h2", null, def.title));
    card.appendChild(stageFor(def));
    card.appendChild(juneAside(scene.step === "done" && scene.juneLine ? scene.juneLine : def.brief));
    var who = el("p", "kicker", def.npc.name + " · " + def.npc.role);
    card.appendChild(who);
    var spoken = scene.step === "done" && scene.npcLine ? scene.npcLine : def.line;
    card.appendChild(el("p", "npc-line", spoken));
    if (scene.step === "done" && scene.deltas) {
      var deltas = el("div", "delta-row");
      effectChips(scene.deltas).forEach(function (c) { deltas.appendChild(chip(c.text, c.tone)); });
      card.appendChild(deltas);
      var back = el("button", "primary", "Back on the trail");
      back.type = "button";
      back.addEventListener("click", function () {
        HT_GUIDE.endSceneTravel(run);
        afterChange();
      });
      card.appendChild(back);
    } else {
      var replies = el("div", "scene-replies");
      def.replies.forEach(function (reply, index) {
        var btn = el("button", "choice");
        btn.type = "button";
        btn.appendChild(el("span", "choice-label", (index + 1) + ". " + reply.label));
        if (reply.detail) btn.appendChild(el("span", "choice-detail", reply.detail));
        btn.addEventListener("click", function () { chooseScene(index); });
        replies.appendChild(btn);
      });
      card.appendChild(replies);
      var form = el("form", "g-form");
      var mic = el("button", null, "Mic");
      mic.type = "button";
      mic.addEventListener("click", function () {
        var real = document.getElementById("guide-mic");
        if (real) real.click();
      });
      var input = el("input");
      input.type = "text";
      input.maxLength = 160;
      input.placeholder = "Or say it your way";
      var send = el("button", null, "Send");
      send.type = "submit";
      form.appendChild(mic);
      form.appendChild(input);
      form.appendChild(send);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = input.value;
        input.value = "";
        if (window.HT_GUIDE) HT_GUIDE.sendText(text);
      });
      card.appendChild(form);
    }
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    if (scene.step !== "done" && window.HT_GUIDE) HT_GUIDE.voiceNpc(scene);
  }

  function chooseScene(index) {
    var run = state.run;
    if (!run || run.phase !== "scene" || !run.scene || run.scene.step === "done") return;
    var reply = run.scene.def.replies[index];
    if (!reply) return;
    if (reply.rumor) {
      HT_GUIDE.noteChoice(reply.label, reply.june || "meh");
      var truth = run.rng() < 0.55;
      HT_GUIDE.openRumor(run, reply.rumor, truth);
      run.scene.step = "done";
      run.scene.npcLine = "Do not quote me. June has the rest.";
      run.scene.juneLine = "Chase it in my chat, or leave it. Then get back on the wagon.";
      run.scene.deltas = {};
      state.overlayKey = "";
      afterChange();
      return;
    }
    var rolled = HT_SCENES.resolveReply(run, run.scene.def, reply);
    var out = HT.playBeat(run, rolled.beat);
    HT_GUIDE.noteChoice(reply.label, rolled.june || "meh");
    if (rolled.juneLine) HT_GUIDE.say(rolled.juneLine, "june");
    if (rolled.npcLine) HT_GUIDE.say(rolled.npcLine, run.scene.def.npc.voice);
    if (run.phase !== "scene") {
      state.overlayKey = "";
      afterChange();
      return;
    }
    run.scene.step = "done";
    run.scene.npcLine = rolled.npcLine;
    run.scene.juneLine = rolled.juneLine;
    run.scene.deltas = out.deltas;
    state.overlayKey = "";
    afterChange();
  }

  function chooseCustom(hit) {
    var run = state.run;
    if (!run || run.phase !== "scene") return;
    var out = HT.playBeat(run, hit.beat);
    HT_GUIDE.noteChoice(hit.beat.choice || "Improvised", hit.june || "meh");
    if (hit.juneLine) HT_GUIDE.say(hit.juneLine, "june");
    if (hit.npcLine) HT_GUIDE.say(hit.npcLine, run.scene.def.npc.voice);
    if (run.phase !== "scene") {
      state.overlayKey = "";
      afterChange();
      return;
    }
    run.scene.step = "done";
    run.scene.npcLine = hit.npcLine;
    run.scene.juneLine = hit.juneLine;
    run.scene.deltas = out.deltas;
    state.overlayKey = "";
    afterChange();
  }

  function stageFor(def) {
    var stage = el("div", "stage " + (def.setting || "coffee"));
    if (def.setting === "zoom") {
      (def.cast || []).forEach(function (person) {
        var tile = el("div", "tile" + (person.live ? " live" : ""));
        tile.appendChild(el("div", "face", person.initials));
        tile.appendChild(el("span", null, person.name));
        stage.appendChild(tile);
      });
      return stage;
    }
    stage.appendChild(el("div", "banner", def.setting === "coffee" ? "Second Cup North" : def.setting === "hall" ? "KILN DEMO DAY" : def.setting === "board" ? "Board call" : "Founder meetup"));
    if (def.setting === "coffee") {
      var cups = el("div", "cups");
      cups.appendChild(el("div", "cup"));
      cups.appendChild(el("div", "cup"));
      stage.appendChild(cups);
    }
    var face = el("div", "face", def.npc.initials);
    face.style.position = "absolute";
    face.style.left = "16px";
    face.style.bottom = "16px";
    stage.appendChild(face);
    return stage;
  }

  function mountEvent() {
    var run = state.run;
    var ev = run.pending;
    var overlay = el("div");
    overlay.id = "overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    var card = el("section", "card");
    card.appendChild(el("p", "kicker", ev.milestone ? "Milestone · mile " + Math.round(run.miles) : "Mile " + Math.round(run.miles) + " · " + HT.segmentInfo(run.miles).name));
    if (window.HT_GUIDE) card.appendChild(juneAside(HT_GUIDE.briefEvent(run)));
    card.appendChild(el("h2", null, ev.title));
    card.appendChild(el("p", "body", ev.text));
    if (ev.timed) {
      var timer = el("div", "timer");
      var bar = el("div");
      bar.id = "timer-bar";
      timer.appendChild(bar);
      card.appendChild(timer);
      card.appendChild(el("p", "hint", ""));
      card.lastChild.id = "timer-label";
    }
    var choices = el("div", "choices");
    ev.choices.forEach(function (choice, index) {
      var btn = el("button", "choice");
      btn.type = "button";
      var desc = HT.describeChoice(run, choice, ev.tags || []);
      btn.appendChild(el("span", "choice-label", (index + 1) + ". " + choice.label));
      if (choice.detail) btn.appendChild(el("span", "choice-detail", choice.detail));
      btn.appendChild(chipRow(desc));
      btn.addEventListener("click", function () { pick(index); });
      choices.appendChild(btn);
    });
    card.appendChild(choices);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    var first = choices.querySelector("button");
    if (first) first.focus();
    if (ev.milestone) toneGood();
    armEventTimer(ev);
  }

  function chipRow(desc) {
    var row = el("span", "chips");
    if (!desc.conceal) {
      effectChips(desc.effects).forEach(function (c) { row.appendChild(chip(c.text, c.tone)); });
      if (desc.risk) {
        var word = desc.risk.replaces ? "instead" : "also";
        var bits = effectChips(desc.risk.effects).map(function (c) { return c.text; }).join(", ");
        row.appendChild(chip(Math.round(desc.risk.chance * 100) + "% " + word + (bits ? ": " + bits : ""), "warn"));
        if (desc.risk.quitChance) {
          row.appendChild(chip(Math.round(desc.risk.quitChance * 100) + "% a cofounder quits if that hits", "bad"));
        }
      }
      if (desc.quitChance) {
        row.appendChild(chip(Math.round(desc.quitChance * 100) + "% a cofounder quits", "bad"));
      }
    } else {
      row.appendChild(chip("Payoff hidden until you answer", "warn"));
    }
    desc.notes.forEach(function (note) { row.appendChild(chip(note, "warn")); });
    return row;
  }

  function effectChips(effects) {
    var out = [];
    [["runway", "runway"], ["equity", "equity"], ["morale", "morale"], ["traction", "traction"], ["unicorn", "glow"]].forEach(function (pair) {
      var v = effects[pair[0]] || 0;
      if (!v) return;
      out.push({ text: signed(v) + " " + pair[1], tone: v > 0 ? "good" : "bad" });
    });
    return out;
  }

  function chip(text, tone) {
    return el("span", "chip " + (tone || ""), text);
  }

  function armEventTimer(ev) {
    if (!ev.timed) return;
    var total = ev.timed;
    var started = Date.now();
    state.eventTimer = setInterval(function () {
      if (!state.run || state.run.phase !== "event") return;
      var elapsed = (Date.now() - started) / 1000 * (state.speed === 2 ? 2 : 1);
      var left = total - elapsed;
      var bar = document.getElementById("timer-bar");
      var lab = document.getElementById("timer-label");
      if (bar) bar.style.width = Math.max(0, (left / total) * 100) + "%";
      if (lab) lab.textContent = Math.max(0, Math.ceil(left)) + "s left";
      if (left <= 0) {
        clearMinigames();
        HT.timeout(state.run);
        toneBad();
        afterChange();
      }
    }, 80);
  }

  function pick(index) {
    clearMinigames();
    if (!state.run || state.run.phase !== "event") return;
    HT.choose(state.run, index);
    toneClick();
    afterChange();
  }

  function mountResult() {
    var run = state.run;
    var result = run.result;
    var overlay = el("div");
    overlay.id = "overlay";
    var card = el("section", "card");
    card.appendChild(el("p", "kicker", result.victory ? "You made it" : result.fatal ? "The trail ends" : "What happened"));
    card.appendChild(el("h2", null, result.title));
    card.appendChild(el("p", "body", result.text));
    var deltas = el("div", "delta-row");
    effectChips(result.deltas || {}).forEach(function (c) { deltas.appendChild(chip(c.text, c.tone)); });
    card.appendChild(deltas);
    (result.quits || []).forEach(function (q) {
      card.appendChild(el("p", null, q.name + " " + q.reason + "."));
    });
    var btn = el("button", "primary", result.victory || result.fatal ? "See the recap" : "Keep rolling");
    btn.type = "button";
    btn.addEventListener("click", function () { dismiss(); });
    card.appendChild(btn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    btn.focus();
    var delta = result.deltas || {};
    var painful = result.fatal || delta.runway < 0 || delta.equity < 0 || delta.morale < -2 || (result.quits && result.quits.length);
    if (painful && !state.reduced && (result.fatal || delta.runway <= -8 || delta.equity <= -6)) {
      document.body.classList.add("shake");
      setTimeout(function () { document.body.classList.remove("shake"); }, 420);
    }
    if (result.victory) toneGood();
    else if (painful) toneBad();
    else toneGood();
  }

  function dismiss() {
    if (!state.run || state.run.phase !== "result") return;
    HT.dismiss(state.run);
    afterChange();
  }

  function mountPitch() {
    var run = state.run;
    var diff = HT.DIFFICULTIES[run.difficulty];
    var overlay = el("div");
    overlay.id = "overlay";
    var card = el("section", "card");
    card.appendChild(el("p", "kicker", "Seed Crossing"));
    card.appendChild(el("h2", null, "Stop the needle"));
    card.appendChild(el("p", "body", "Green closes a real round and counts as raising. Yellow is a smaller raise. Red misses, and Quiet Wealth stays possible. " + diff.label + " moves the needle at its own speed."));
    var track = el("div", "pitch-track");
    var yellow = el("div", "zone yellow");
    yellow.style.left = diff.yellow[0] + "%";
    yellow.style.width = (diff.yellow[1] - diff.yellow[0]) + "%";
    var green = el("div", "zone green");
    green.style.left = diff.green[0] + "%";
    green.style.width = (diff.green[1] - diff.green[0]) + "%";
    var needle = el("div", "needle");
    needle.id = "needle";
    track.appendChild(yellow);
    track.appendChild(green);
    track.appendChild(needle);
    card.appendChild(track);
    var stop = el("button", "primary", "Stop");
    stop.type = "button";
    stop.addEventListener("click", stopPitch);
    card.appendChild(stop);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    stop.focus();
    var pos = 0;
    var dir = 1;
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(32, now - last);
      last = now;
      pos += dir * diff.pitchSpeed * dt * 0.045;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      state.pitchPos = pos;
      if (needle) needle.style.left = pos + "%";
      state.pitchRAF = requestAnimationFrame(frame);
    }
    state.pitchRAF = requestAnimationFrame(frame);
    track.addEventListener("pointerdown", function (e) { e.preventDefault(); stopPitch(); });
  }

  function stopPitch() {
    if (!state.run || state.run.phase !== "pitch") return;
    if (state.pitchRAF) cancelAnimationFrame(state.pitchRAF);
    state.pitchRAF = null;
    HT.resolvePitch(state.run, state.pitchPos || 0);
    afterChange();
  }

  function mountHunt() {
    var overlay = el("div");
    overlay.id = "overlay";
    var card = el("section", "card");
    card.appendChild(el("p", "kicker", "User hunt"));
    card.appendChild(el("h2", null, "Tap the users"));
    card.appendChild(el("p", "body", "Users pay traction. Ghosts are meetings that vanish. Bugs bite morale. You have 9 seconds and it spends the day."));
    var stats = el("div", "hunt-stats");
    stats.id = "hunt-stats";
    stats.textContent = "Users 0 · Ghosts 0 · Bugs 0 · 9s";
    card.appendChild(stats);
    var field = el("div", "field");
    field.id = "hunt-field";
    card.appendChild(field);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    var tally = { users: 0, ghosts: 0, bugs: 0 };
    var ended = false;
    var started = Date.now();
    function paintStats() {
      var left = Math.max(0, 9 - (Date.now() - started) / 1000);
      var node = document.getElementById("hunt-stats");
      if (node) node.textContent = "Users " + tally.users + " · Ghosts " + tally.ghosts + " · Bugs " + tally.bugs + " · " + Math.ceil(left) + "s";
    }
    function spawn() {
      if (ended || !document.getElementById("hunt-field")) return;
      var roll = Math.random();
      var kind = roll < 0.62 ? "user" : roll < 0.84 ? "ghost" : "bug";
      var btn = el("button", "prey " + kind, kind === "user" ? "User" : kind === "ghost" ? "Ghost" : "Bug");
      btn.type = "button";
      btn.style.left = (10 + Math.random() * 80) + "%";
      btn.style.top = (16 + Math.random() * 68) + "%";
      btn.addEventListener("click", function () {
        if (btn.dataset.hit || ended) return;
        btn.dataset.hit = "1";
        if (kind === "user") tally.users += 1;
        else if (kind === "ghost") tally.ghosts += 1;
        else tally.bugs += 1;
        btn.classList.add("hit");
        toneClick();
        paintStats();
        setTimeout(function () { btn.remove(); }, 160);
      });
      field.appendChild(btn);
      var fade = setTimeout(function () { if (!btn.dataset.hit) btn.remove(); }, 1200);
      state.huntTimers.push(fade);
    }
    spawn();
    var spawner = setInterval(spawn, 520);
    var ticker = setInterval(paintStats, 100);
    var end = setTimeout(finish, 9000);
    state.huntTimers.push(spawner, ticker, end);
    function finish() {
      if (ended) return;
      ended = true;
      clearMinigames();
      if (!state.run || state.run.phase !== "hunt") return;
      HT.resolveHunt(state.run, tally);
      afterChange();
    }
  }

  function clearMinigames() {
    if (state.eventTimer) clearInterval(state.eventTimer);
    state.eventTimer = null;
    if (state.pitchRAF) cancelAnimationFrame(state.pitchRAF);
    state.pitchRAF = null;
    state.huntTimers.forEach(function (id) {
      clearInterval(id);
      clearTimeout(id);
    });
    state.huntTimers = [];
  }

  function enterRecap() {
    if (state.screen === "recap") return;
    clearMinigames();
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    var parts = HT.scoreParts(state.run);
    state.run.score = parts.total;
    state.run.scoreReport = parts;
    var record = {
      score: parts.total,
      company: state.run.company,
      difficulty: state.run.difficulty,
      ending: state.run.endingId,
      status: state.run.status,
      day: state.run.day,
      miles: Math.round(state.run.miles)
    };
    state.isNewBest = !state.best || record.score > state.best.score;
    if (state.isNewBest) {
      state.best = record;
      writeBest(record);
    }
    state.screen = "recap";
    state.overlayKey = "";
    var old = document.getElementById("overlay");
    if (old) old.remove();
    renderRecap();
    if (window.HT_GUIDE) HT_GUIDE.onRecap(state.run);
    if (state.run.status === "won") fanfare();
    else dirge();
  }

  function renderRecap() {
    var run = state.run;
    var ending = HT.DATA.ENDINGS[run.endingId];
    var parts = run.scoreReport || HT.scoreParts(run);
    app.replaceChildren();
    var wrap = el("div", "recap-screen");
    wrap.appendChild(toolbar());
    var card = el("section", "recap-card");
    var stamp = el("div", "stamp " + (run.status === "won" ? "win" : "lose"), run.status === "won" ? "OPEN" : "CLOSED");
    card.appendChild(stamp);
    card.appendChild(el("p", "kicker", run.status === "won" ? "Win" : "Loss"));
    card.appendChild(el("h1", null, ending ? ending.title : "The end"));
    card.appendChild(el("p", "lede", ending ? ending.text : ""));
    if (state.isNewBest) card.appendChild(el("p", "new-best", "New best score on this browser"));
    card.appendChild(el("p", "score-huge", commas(parts.total)));
    card.appendChild(el("p", null, run.company + " · " + run.pitchLine));
    card.appendChild(el("p", "hint", "Day " + run.day + " · mile " + Math.round(run.miles) + " · " + HT.DIFFICULTIES[run.difficulty].label + (run.flags.raised ? " · raised" : " · never raised")));
    var grid = el("div", "grid-stats");
    [["Runway", Math.round(run.runway)], ["Equity", Math.round(run.equity) + "%"], ["Morale", Math.round(run.morale)], ["Traction", Math.round(run.traction)], ["Unicorn Glow", Math.round(run.unicorn || 0)]].forEach(function (pair) {
      var cell = el("div");
      cell.appendChild(el("span", null, pair[0]));
      cell.appendChild(el("b", null, String(pair[1])));
      grid.appendChild(cell);
    });
    card.appendChild(grid);
    card.appendChild(el("h2", null, "Score"));
    var br = el("div", "break");
    parts.parts.forEach(function (p) {
      var cell = el("div");
      cell.appendChild(el("span", null, p[0]));
      cell.appendChild(el("b", null, commas(p[1])));
      br.appendChild(cell);
    });
    card.appendChild(br);
    card.appendChild(el("p", "hint", "Difficulty x" + parts.mult + (parts.earlyExit ? ". Left early, so the total is cut to 0.72." : ".")));
    card.appendChild(el("h2", null, "Goals"));
    var goals = el("ul", "goals");
    HT.goals(run).forEach(function (g) {
      var hit = run.milestonesHit.filter(function (h) { return h.id === g.id; })[0];
      var li = el("li", g.done ? "done" : "");
      li.textContent = (g.done ? "Reached " : "Missed ") + g.name + (hit ? " on day " + hit.day : "");
      goals.appendChild(li);
    });
    card.appendChild(goals);
    card.appendChild(el("h2", null, "Team"));
    var team = el("ul", "team");
    run.cofounders.forEach(function (c) {
      team.appendChild(el("li", null, c.name + " (" + c.traitName + "): " + (c.alive ? "still on the wagon" : c.reason)));
    });
    card.appendChild(team);
    if (run.history.length) {
      card.appendChild(el("h2", null, "The calls"));
      var hist = el("ul", "goals");
      run.history.slice(-8).forEach(function (h) {
        hist.appendChild(el("li", null, "Day " + h.day + ": " + h.title + " / " + h.choice));
      });
      card.appendChild(hist);
    }
    var row = el("div", "row");
    var again = el("button", "primary", "Play again, new party");
    again.type = "button";
    again.addEventListener("click", function () {
      state.party = HT.createParty(Math.random);
      startRun();
    });
    var fresh = el("button", "ghost", "New company");
    fresh.type = "button";
    fresh.addEventListener("click", function () { state.screen = "setup"; renderSetup(); });
    var title = el("button", "texty", "Title");
    title.type = "button";
    title.addEventListener("click", function () { state.screen = "title"; renderTitle(); });
    row.appendChild(again);
    row.appendChild(fresh);
    row.appendChild(title);
    card.appendChild(row);
    wrap.appendChild(card);
    app.appendChild(wrap);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "m" || e.key === "M") {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      toggleMute();
      return;
    }
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
      if (e.key === "Enter" && state.screen === "setup") {
        e.preventDefault();
        startRun();
      }
      return;
    }
    if (state.screen === "title" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      unlock();
      state.screen = "setup";
      renderSetup();
      return;
    }
    if (state.screen === "recap" && e.key === "Enter") {
      state.party = HT.createParty(Math.random);
      startRun();
      return;
    }
    if (state.screen !== "trail" || !state.run) return;
    var phase = state.run.phase;
    if (phase === "scene" && e.key >= "1" && e.key <= "4") {
      var si = Number(e.key) - 1;
      if (state.run.scene && state.run.scene.def && state.run.scene.def.replies[si]) {
        e.preventDefault();
        chooseScene(si);
      }
    } else if (phase === "event" && e.key >= "1" && e.key <= "4") {
      var index = Number(e.key) - 1;
      if (state.run.pending && state.run.pending.choices[index]) {
        e.preventDefault();
        pick(index);
      }
    } else if (phase === "result" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      dismiss();
    } else if (phase === "pitch" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      stopPitch();
    } else if (phase === "travel") {
      if (e.key === "1") setPace("steady");
      else if (e.key === "2") setPace("hustle");
      else if (e.key === "3") setPace("crunch");
      else if (e.key === "r" || e.key === "R") doRest();
      else if (e.key === "c" || e.key === "C") doEmail();
      else if (e.key === "u" || e.key === "U") doHunt();
      else if (e.key === "p" || e.key === "P") togglePause();
      else if (e.key === "f" || e.key === "F") toggleSpeed();
    }
  });

  document.addEventListener("pointerdown", unlock);

  try {
    if (window.HT_GUIDE) {
      HT_GUIDE.mount();
      window.HT_SCENE_PICK = function (hit) {
        if (!hit) return;
        if (hit.index != null) chooseScene(hit.index);
        else chooseCustom(hit);
      };
      window.HT_UI_AFTER = function () { afterChange(); };
    }
    render();
  } catch (err) {
    app.textContent = "The wagon failed to start. Reload the page.";
    console.error(err);
  }
})();
