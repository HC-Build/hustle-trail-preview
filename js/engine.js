(function (root, factory) {
  var data = typeof module !== "undefined" && module.exports
    ? require("./data.js")
    : root.HT_DATA;
  var api = factory(data);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HT = api;
})(typeof window !== "undefined" ? window : globalThis, function (DATA) {
  var STATS = ["runway", "equity", "morale", "traction"];

  var DIFFICULTIES = {
    cautious: {
      id: "cautious",
      label: "Cautious",
      blurb: "More cash, gentler burn, fewer ambushes. Score pays 0.8x.",
      runway: 96,
      morale: 76,
      burn: 0.82,
      event: 0.78,
      risk: 0.88,
      score: 0.8,
      pitchSpeed: 1.15,
      green: [38, 62],
      yellow: [28, 72]
    },
    founder: {
      id: "founder",
      label: "Founder",
      blurb: "The intended pain. Score pays 1x.",
      runway: 74,
      morale: 66,
      burn: 1.06,
      event: 1,
      risk: 1,
      score: 1,
      pitchSpeed: 1.65,
      green: [42, 58],
      yellow: [30, 70]
    },
    unhinged: {
      id: "unhinged",
      label: "Unhinged",
      blurb: "Thin tank, nasty odds, 1.5x score if you live.",
      runway: 58,
      morale: 54,
      burn: 1.3,
      event: 1.34,
      risk: 1.16,
      score: 1.5,
      pitchSpeed: 2.3,
      green: [46, 54],
      yellow: [36, 64]
    }
  };

  var PACES = {
    steady: {
      id: "steady",
      label: "Steady",
      miles: 32,
      burn: 1.05,
      morale: 1,
      event: 0.72,
      blurb: "Fewer miles, lower burn, the team sleeps."
    },
    hustle: {
      id: "hustle",
      label: "Hustle",
      miles: 46,
      burn: 1.9,
      morale: -1,
      event: 1,
      blurb: "The default grind."
    },
    crunch: {
      id: "crunch",
      label: "Crunch",
      miles: 64,
      burn: 2.85,
      morale: -3,
      event: 1.28,
      blurb: "Eat the map. Pay with people."
    }
  };

  var SEGMENTS = {
    early: { id: "early", name: "Idea Desert", burn: 0.82, index: 0 },
    users: { id: "users", name: "User Canyon", burn: 1, index: 1 },
    pmf: { id: "pmf", name: "PMF Pass", burn: 1.2, index: 2 },
    seed: { id: "seed", name: "Seed River", burn: 1.42, index: 3 },
    board: { id: "board", name: "Board Ridge", burn: 1.7, index: 4 }
  };

  function segmentFor(miles) {
    if (miles < 400) return "early";
    if (miles < 800) return "users";
    if (miles < 1200) return "pmf";
    if (miles < 1600) return "seed";
    return "board";
  }

  function segmentInfo(miles) {
    return SEGMENTS[segmentFor(miles)];
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function sanitize(text, max) {
    return String(text || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, max);
  }

  function hasTrait(game, id) {
    return game.cofounders.some(function (c) { return c.alive && c.trait === id; });
  }

  function createParty(rng) {
    var random = rng || Math.random;
    var names = DATA.shuffle(DATA.NAMES, random).slice(0, 3);
    var traits = DATA.shuffle(DATA.TRAITS, random).slice(0, 3);
    return names.map(function (name, i) {
      return {
        id: name.toLowerCase() + "-" + i + "-" + traits[i].id,
        name: name,
        trait: traits[i].id,
        traitName: traits[i].name,
        traitBlurb: traits[i].blurb,
        alive: true,
        reason: ""
      };
    });
  }

  function pushLog(game, text, tone) {
    game.log.unshift({ day: game.day, text: text, tone: tone || "" });
    if (game.log.length > 8) game.log.length = 8;
  }

  function snap(game) {
    return {
      runway: game.runway,
      equity: game.equity,
      morale: game.morale,
      traction: game.traction,
      unicorn: game.unicorn || 0
    };
  }

  function shapeDelta(game, effects, tags) {
    var d = {
      runway: effects.runway || 0,
      equity: effects.equity || 0,
      morale: effects.morale || 0,
      traction: effects.traction || 0,
      unicorn: effects.unicorn || 0
    };
    tags = tags || [];
    if (hasTrait(game, "shipper") && tags.indexOf("breakdown") >= 0 && d.runway < 0) {
      d.runway *= 0.6;
    }
    if (hasTrait(game, "tweeter") && tags.indexOf("press") >= 0) {
      d.traction *= 1.35;
      d.morale *= 1.35;
    }
    if (hasTrait(game, "closer") && d.traction > 0) d.traction *= 1.2;
    if (hasTrait(game, "lawyer")) {
      if (d.equity < 0) d.equity *= 0.7;
      if (d.traction > 0) d.traction *= 0.85;
    }
    if (hasTrait(game, "stoic") && d.morale < 0) d.morale *= 0.6;
    d.runway = round1(d.runway);
    d.equity = Math.round(d.equity);
    d.morale = Math.round(d.morale);
    d.traction = Math.round(d.traction);
    d.unicorn = Math.round(d.unicorn);
    return d;
  }

  function riskChance(game, base) {
    if (base >= 1) return 1;
    var diff = DIFFICULTIES[game.difficulty];
    var c = base * diff.risk;
    if (game.warmIntro) c *= 0.9;
    if (game.flags.snubbed && segmentFor(game.miles) === "board") c *= 1.18;
    return clamp(c, 0, 0.9);
  }

  function describeChoice(game, choice, tags) {
    var effects = shapeDelta(game, choice.effects || {}, tags);
    var risk = null;
    if (choice.risk) {
      risk = {
        chance: riskChance(game, choice.risk.chance || 0),
        replaces: !!choice.risk.replaces,
        effects: shapeDelta(game, choice.risk.effects || {}, tags),
        quitChance: choice.risk.quit ? riskChance(game, choice.risk.quit.chance || 0) : 0
      };
    }
    var notes = [];
    if (choice.flags && choice.flags.indexOf("raised") >= 0) notes.push("Counts as raising");
    if (choice.jackpot && choice.jackpot.flags && choice.jackpot.flags.indexOf("raised") >= 0) {
      notes.push("Jackpot counts as raising");
    }
    if (choice.flags && choice.flags.indexOf("snubbed") >= 0) notes.push("Later risks get worse");
    if (choice.earlyExit) notes.push("Ends the run early");
    if (choice.mini === "pitch") notes.push("Timing challenge");
    if (choice.jackpot) notes.push(Math.round(choice.jackpot.chance * 100) + "% jackpot");
    return {
      effects: effects,
      risk: risk,
      quitChance: choice.quit ? riskChance(game, choice.quit.chance || 0) : 0,
      notes: notes,
      conceal: !!choice.conceal,
      label: choice.label,
      detail: choice.detail || ""
    };
  }

  function dailyBurn(game, pace) {
    var diff = DIFFICULTIES[game.difficulty];
    var seg = segmentInfo(game.miles);
    var burn = pace.burn * seg.burn * diff.burn;
    if (hasTrait(game, "operator")) burn *= 0.88;
    return burn;
  }

  function campCost(game) {
    var diff = DIFFICULTIES[game.difficulty];
    var seg = segmentInfo(game.miles);
    var burn = 1.15 * seg.burn * diff.burn;
    if (hasTrait(game, "operator")) burn *= 0.88;
    return round1(burn);
  }

  function applyNumbers(game, effects, tags, absolute) {
    var before = snap(game);
    var d = shapeDelta(game, effects || {}, tags);
    game.runway = round1(clamp(game.runway + d.runway, 0, 100));
    game.equity = clamp(game.equity + d.equity, 0, 100);
    game.morale = clamp(game.morale + d.morale, 0, 100);
    game.traction = clamp(game.traction + d.traction, 0, 999);
    game.unicorn = clamp((game.unicorn || 0) + (d.unicorn || 0), 0, 100);
    if (absolute) {
      if (absolute.runway != null) game.runway = round1(clamp(absolute.runway, 0, 100));
      if (absolute.equity != null) game.equity = clamp(absolute.equity, 0, 100);
      if (absolute.morale != null) game.morale = clamp(absolute.morale, 0, 100);
      if (absolute.traction != null) game.traction = clamp(absolute.traction, 0, 999);
    }
    return {
      runway: round1(game.runway - before.runway),
      equity: game.equity - before.equity,
      morale: game.morale - before.morale,
      traction: game.traction - before.traction,
      unicorn: (game.unicorn || 0) - (before.unicorn || 0)
    };
  }

  function maybeQuit(game, spec) {
    if (!spec) return null;
    var chance = riskChance(game, spec.chance || 0);
    if (game.rng() >= chance) return null;
    var pool = game.cofounders.filter(function (c) { return c.alive; });
    if (spec.cofounderId) {
      pool = pool.filter(function (c) { return c.id === spec.cofounderId; });
      if (!pool.length) pool = game.cofounders.filter(function (c) { return c.alive; });
    }
    if (!pool.length) return null;
    var who = pool[Math.floor(game.rng() * pool.length)];
    var reason = DATA.QUIT_REASONS[Math.floor(game.rng() * DATA.QUIT_REASONS.length)];
    who.alive = false;
    who.reason = reason;
    return { name: who.name, reason: reason };
  }

  function checkDeath(game) {
    if (game.runway < 0.5) {
      game.runway = 0;
      return "broke";
    }
    if (game.equity <= 0) return "diluted";
    if (!game.cofounders.some(function (c) { return c.alive; })) return "abandoned";
    return null;
  }

  function scoreParts(game) {
    var alive = game.cofounders.filter(function (c) { return c.alive; }).length;
    var parts = [
      ["From miles", Math.round(game.miles * 1.5)],
      ["From traction", Math.round(game.traction * 6)],
      ["From equity", Math.round(game.equity * 3)],
      ["From runway", Math.round(game.runway * 2)],
      ["From morale", Math.round(game.morale * 1.5)],
      ["From the team", alive * 140],
      ["From milestones", game.milestonesHit.length * 160],
      ["From glow", Math.round((game.unicorn || 0) * 4)]
    ];
    var sub = parts.reduce(function (s, p) { return s + p[1]; }, 0);
    var ending = game.endingId ? DATA.ENDINGS[game.endingId] : null;
    if (game.status === "won" && ending) {
      var speed = Math.max(0, 65 - game.day) * 10;
      parts.push(["Speed", speed]);
      parts.push(["Ending", ending.bonus || 0]);
      sub += speed + (ending.bonus || 0);
    }
    var mult = DIFFICULTIES[game.difficulty].score;
    var total = Math.round(sub * mult);
    if (game.status === "won" && game.earlyExit) total = Math.round(total * 0.72);
    return { parts: parts, subtotal: sub, mult: mult, earlyExit: !!(game.status === "won" && game.earlyExit), total: total };
  }

  function liveScore(game) {
    var fake = {
      miles: game.miles,
      traction: game.traction,
      equity: game.equity,
      runway: game.runway,
      morale: game.morale,
      cofounders: game.cofounders,
      milestonesHit: game.milestonesHit,
      unicorn: game.unicorn || 0,
      day: game.day,
      difficulty: game.difficulty,
      status: "playing",
      endingId: null,
      earlyExit: false
    };
    return scoreParts(fake).total;
  }

  function touchScore(game) {
    if (game.status === "playing") game.score = liveScore(game);
  }

  function createGame(opts) {
    opts = opts || {};
    var difficulty = DIFFICULTIES[opts.difficulty] ? opts.difficulty : "founder";
    var diff = DIFFICULTIES[difficulty];
    var rng = typeof opts.rng === "function" ? opts.rng : Math.random;
    var company = sanitize(opts.company, 24) || "Wagon Labs";
    var pitchLine = sanitize(opts.pitchLine, 90) || "Software for people who are tired.";
    var warmIntro = !!opts.warmIntro;
    var game = {
      company: company,
      pitchLine: pitchLine,
      difficulty: difficulty,
      warmIntro: warmIntro,
      cofounders: opts.cofounders || createParty(rng),
      day: 1,
      miles: 0,
      pace: "hustle",
      runway: diff.runway,
      equity: warmIntro ? 90 : 100,
      morale: diff.morale,
      traction: warmIntro ? 8 : 0,
      phase: "travel",
      pending: null,
      result: null,
      status: "playing",
      endingId: null,
      flags: { raised: false, bootstrapped: false, snubbed: false },
      story: {},
      scenesSeen: [],
      blockScenesUntilMile: 0,
      milestonesHit: [{ id: "garage", day: 1, mile: 0 }],
      seen: [],
      recent: [],
      emails: 1,
      hunts: 2,
      log: [],
      history: [],
      daysSinceEvent: 0,
      paused: false,
      suppressEvents: false,
      earlyExit: false,
      rng: rng,
      score: 0,
      unicorn: 0,
      sideClaims: []
    };
    pushLog(game, warmIntro
      ? "A warm intro bought a nod. Your slice of the company is already smaller."
      : "The garage door sticks. You decide that is a brand.", "good");
    touchScore(game);
    return game;
  }

  function nextMilestone(game) {
    for (var i = 0; i < DATA.MILESTONES.length; i++) {
      var m = DATA.MILESTONES[i];
      if (m.mile > game.miles) return m;
    }
    return null;
  }

  function remember(game, id, once) {
    game.recent.push(id);
    if (game.recent.length > 4) game.recent.shift();
    if (once && game.seen.indexOf(id) < 0) game.seen.push(id);
  }

  function pickEventDef(game) {
    var seg = segmentFor(game.miles);
    function pool(ignoreRecent) {
      return DATA.EVENTS.filter(function (e) {
        if (e.segments.indexOf(seg) < 0) return false;
        if (e.once && game.seen.indexOf(e.id) >= 0) return false;
        if (!ignoreRecent && game.recent.indexOf(e.id) >= 0) return false;
        return true;
      });
    }
    var list = pool(false);
    if (list.length < 2) list = pool(true);
    if (!list.length) return null;
    var total = list.reduce(function (s, e) { return s + (e.weight || 1); }, 0);
    var r = game.rng() * total;
    for (var i = 0; i < list.length; i++) {
      r -= list[i].weight || 1;
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function materialize(def, game) {
    var built = def.build ? def.build(game, game.rng) : {};
    var text = built.text || def.text;
    if (typeof text === "function") text = text(game, game.rng);
    return {
      id: def.id,
      title: built.title || def.title,
      text: text,
      tags: built.tags || def.tags || [],
      choices: built.choices || def.choices,
      timed: built.timed || def.timed || 0,
      timeout: built.timeout || def.timeout || null,
      milestone: !!built.milestone || !!def.milestone,
      once: !!def.once
    };
  }

  function openEvent(game, ev) {
    game.phase = "event";
    game.pending = ev;
    game.daysSinceEvent = 0;
    remember(game, ev.id, ev.once);
    pushLog(game, ev.title + ".", "warn");
    touchScore(game);
  }

  function openMilestone(game, milestone) {
    game.milestonesHit.push({ id: milestone.id, day: game.day, mile: milestone.mile });
    game.emails = Math.min(2, game.emails + 1);
    var ev = DATA.buildMilestone(milestone.id);
    ev.once = false;
    openEvent(game, ev);
    pushLog(game, "Pulled into " + milestone.name + ".", "good");
  }

  function setResult(game, payload) {
    game.result = payload;
    game.phase = "result";
    game.pending = null;
    touchScore(game);
  }

  function kill(game, endingId, lead) {
    game.status = "lost";
    game.endingId = endingId;
    var ending = DATA.ENDINGS[endingId];
    setResult(game, {
      title: ending.title,
      text: lead ? lead + " " + ending.text : ending.text,
      deltas: payloadDeltas(game, game._before),
      quits: game._quits || [],
      fatal: true,
      victory: false
    });
  }

  function win(game, endingId, lead) {
    game.status = "won";
    game.endingId = endingId;
    var ending = DATA.ENDINGS[endingId];
    setResult(game, {
      title: ending.title,
      text: lead ? lead + " " + ending.text : ending.text,
      deltas: payloadDeltas(game, game._before),
      quits: game._quits || [],
      fatal: false,
      victory: true
    });
  }

  function payloadDeltas(game, before) {
    if (!before) return { runway: 0, equity: 0, morale: 0, traction: 0, unicorn: 0 };
    return {
      runway: round1(game.runway - before.runway),
      equity: game.equity - before.equity,
      morale: game.morale - before.morale,
      traction: game.traction - before.traction,
      unicorn: (game.unicorn || 0) - (before.unicorn || 0)
    };
  }

  function questById(id) {
    var list = (DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.entries) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function isRealUrl(url) {
    return /^https?:\/\//i.test(url || "") && String(url).indexOf("PASTE_") !== 0;
  }

  function publicGameUrl() {
    var configured = DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.gameUrl;
    if (isRealUrl(configured)) return configured;
    if (typeof location !== "undefined" && location.href) return location.href.split("#")[0];
    return "";
  }

  function shareText(game, take) {
    var link = publicGameUrl();
    var body = take
      ? take + " #HustleTrail"
      : (game.company || "A wagon") + " is on the Hustle Trail. Mile " + Math.round(game.miles || 0) + ", score " + (game.score || 0) + ". #HustleTrail";
    if (link) body += " " + link;
    return body;
  }

  function intentPostUrl(text) {
    return "https://x.com/intent/post?text=" + encodeURIComponent(text);
  }

  function fillDraft(game, template) {
    return String(template || "")
      .replace(/\{company\}/g, game.company || "the wagon")
      .replace(/\{mile\}/g, String(Math.round(game.miles || 0)))
      .replace(/\{score\}/g, String(game.score || 0))
      .replace(/\{pitch\}/g, game.pitchLine || "the product");
  }

  function channelUrl(channel, text) {
    if (channel === "x") return intentPostUrl(text);
    if (channel === "linkedin") {
      var page = publicGameUrl();
      if (!page) return "";
      return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(page);
    }
    return "";
  }

  function nextStreak(clock, now) {
    var windowMs = (DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.streakWindowMs) || 0;
    var prev = clock.lastClaimAt || 0;
    if (prev && windowMs && now - prev <= windowMs && now - prev > 1000) return (clock.streak || 1) + 1;
    if (prev && now - prev <= 1000) return clock.streak || 1;
    return prev ? 1 : 1;
  }

  function claimSideQuest(game, id, extra, now, clockStore) {
    extra = extra || {};
    now = now || Date.now();
    var quest = questById(id);
    if (!quest) return { ok: false, reason: "missing" };
    game.sideClaims = game.sideClaims || [];
    if (game.sideClaims.indexOf(id) >= 0) return { ok: false, reason: "cooldown", quest: quest };
    var saved = clockStore || { at: {}, globalAt: 0, streak: 0, lastClaimAt: 0 };
    var wait = (DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.cooldownMs) || 0;
    var last = saved.at && saved.at[id];
    if (last && now - last < wait) return { ok: false, reason: "cooldown", quest: quest, waitMs: wait - (now - last) };
    if (saved.globalAt && now - saved.globalAt < 45000 && now - saved.globalAt > 0) {
      return { ok: false, reason: "cooldown", quest: quest, waitMs: 45000 - (now - saved.globalAt) };
    }
    if (quest.kind === "dm") {
      if ((extra.steps || 0) < (quest.steps || 3)) return { ok: false, reason: "closed", quest: quest };
    } else if (quest.kind === "comment") {
      if (String(extra.note || "").trim().length < (quest.minLength || 24)) return { ok: false, reason: "short", quest: quest };
      if (!extra.done) return { ok: false, reason: "closed", quest: quest };
    } else if (!extra.started) {
      return { ok: false, reason: "closed", quest: quest };
    }
    var rewards = Object.assign({}, quest.rewards || {});
    var streak = 1;
    if (saved.lastClaimAt && (DATA.SIDE_QUESTS.streakWindowMs || 0) && now - saved.lastClaimAt <= DATA.SIDE_QUESTS.streakWindowMs && now - saved.lastClaimAt > 1000) {
      streak = (saved.streak || 1) + 1;
    }
    if (streak >= 2) rewards.traction = (rewards.traction || 0) + 2;
    return {
      ok: true,
      reason: "ok",
      quest: quest,
      streak: streak,
      beat: {
        title: quest.title,
        choice: quest.title,
        effects: rewards,
        text: quest.title,
        log: "Side quest: " + quest.title,
        tone: "good"
      }
    };
  }

  function watchClipId(index) {
    return "watch-clip-" + index;
  }

  function watchClips() {
    if (DATA.WATCH_CLIPS && DATA.WATCH_CLIPS.length) return DATA.WATCH_CLIPS;
    return (DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.clips) || [];
  }

  function claimWatchClip(game, index, extra, now, clockStore) {
    extra = extra || {};
    now = now || Date.now();
    var clips = watchClips();
    var clip = clips[index];
    if (!clip) return { ok: false, reason: "missing" };
    var id = watchClipId(index);
    if (!isRealUrl(clip.url)) return { ok: false, reason: "placeholder", clip: clip, id: id };
    game.sideClaims = game.sideClaims || [];
    var saved = clockStore || { at: {}, globalAt: 0, streak: 0, lastClaimAt: 0 };
    if ((saved.at && saved.at[id]) || game.sideClaims.indexOf(id) >= 0) {
      return { ok: false, reason: "once", clip: clip, id: id };
    }
    if (!extra.opened) return { ok: false, reason: "closed", clip: clip, id: id };
    if (String(extra.note || "").trim().length < 8) return { ok: false, reason: "short", clip: clip, id: id };
    var rewards = Object.assign({}, clip.reward || {});
    var streak = 1;
    var windowMs = (DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.streakWindowMs) || 0;
    if (saved.lastClaimAt && windowMs && now - saved.lastClaimAt <= windowMs && now - saved.lastClaimAt > 1000) {
      streak = (saved.streak || 1) + 1;
    }
    if (streak >= 2) rewards.traction = (rewards.traction || 0) + 2;
    if (extra.bonus) {
      Object.keys(extra.bonus).forEach(function (k) {
        rewards[k] = (rewards[k] || 0) + extra.bonus[k];
      });
    }
    return {
      ok: true,
      reason: "ok",
      clip: clip,
      id: id,
      streak: streak,
      beat: {
        title: clip.title,
        choice: "Watched and commented",
        effects: rewards,
        text: clip.lesson || clip.title,
        log: "Watch and engage: " + clip.title,
        tone: "good"
      }
    };
  }

  function markQuestClaim(game, id, now, clockStore) {
    now = now || Date.now();
    game.sideClaims = game.sideClaims || [];
    if (game.sideClaims.indexOf(id) < 0) game.sideClaims.push(id);
    if (!clockStore) return;
    var windowMs = (DATA.SIDE_QUESTS && DATA.SIDE_QUESTS.streakWindowMs) || 0;
    var prev = clockStore.lastClaimAt || 0;
    if (prev && windowMs && now - prev <= windowMs && now - prev > 1000) clockStore.streak = (clockStore.streak || 1) + 1;
    else clockStore.streak = 1;
    clockStore.lastClaimAt = now;
    clockStore.at = clockStore.at || {};
    clockStore.at[id] = now;
    clockStore.globalAt = now;
    game.questStreak = clockStore.streak;
  }

  function applyFlags(game, flags) {
    if (!flags) return false;
    var raisedNow = false;
    flags.forEach(function (f) {
      if (f === "raised" && !game.flags.raised) raisedNow = true;
      if (f === "raised" || f === "bootstrapped" || f === "snubbed") game.flags[f] = true;
    });
    return raisedNow;
  }

  function resolveChoice(game, choice, tags, title) {
    var before = snap(game);
    game._before = before;
    var effects = choice.effects || {};
    var absolute = null;
    var text = choice.success || "Done.";
    var quitSpec = choice.quit || null;
    var flags = choice.flags || null;
    var jackpot = false;

    if (choice.jackpot && game.rng() < (choice.jackpot.chance || 0)) {
      jackpot = true;
      effects = choice.jackpot.effects || {};
      absolute = choice.jackpot.absolute || null;
      text = choice.jackpot.text || text;
      quitSpec = choice.jackpot.quit || null;
      flags = choice.jackpot.flags || flags;
    } else if (choice.risk && game.rng() < riskChance(game, choice.risk.chance || 0)) {
      if (choice.risk.replaces) {
        effects = choice.risk.effects || {};
        text = choice.risk.text || text;
        quitSpec = choice.risk.quit || null;
      } else {
        effects = {
          runway: (choice.effects && choice.effects.runway || 0) + (choice.risk.effects && choice.risk.effects.runway || 0),
          equity: (choice.effects && choice.effects.equity || 0) + (choice.risk.effects && choice.risk.effects.equity || 0),
          morale: (choice.effects && choice.effects.morale || 0) + (choice.risk.effects && choice.risk.effects.morale || 0),
          traction: (choice.effects && choice.effects.traction || 0) + (choice.risk.effects && choice.risk.effects.traction || 0)
        };
        text = (choice.success || "Done.") + " " + (choice.risk.text || "");
        quitSpec = choice.risk.quit || choice.quit || null;
      }
    }

    applyNumbers(game, effects, tags, absolute);
    if (hasTrait(game, "operator")) {
      game.morale = clamp(game.morale - 1, 0, 100);
    }
    var raisedNow = applyFlags(game, flags);
    if (choice.earlyExit) game.earlyExit = true;
    if (raisedNow) text += " This counts as raising. Quiet Wealth is off the table.";

    var quits = [];
    var quit = maybeQuit(game, quitSpec);
    if (quit) quits.push(quit);
    game._quits = quits;
    if (quit) text += " " + quit.name + " " + quit.reason + ".";

    game.history.push({
      day: game.day,
      title: title,
      choice: choice.label,
      result: text
    });
    if (game.history.length > 30) game.history.shift();

    var death = checkDeath(game);
    if (death) {
      pushLog(game, DATA.ENDINGS[death].title + ".", "bad");
      kill(game, death, text);
      return;
    }

    var endingId = null;
    if (typeof choice.outcome === "function") endingId = choice.outcome(game);
    else if (choice.ending) endingId = choice.ending;
    if (endingId) {
      pushLog(game, DATA.ENDINGS[endingId].title + ".", "good");
      win(game, endingId, text);
      return;
    }

    var tone = "good";
    var delta = payloadDeltas(game, before);
    if (quit || delta.runway < -8 || delta.equity < -6 || delta.morale < -6) tone = "bad";
    else if (delta.traction <= 0 && delta.runway <= 0) tone = "warn";
    pushLog(game, choice.label + ".", tone);
    setResult(game, {
      title: title,
      text: text,
      deltas: delta,
      quits: quits,
      fatal: false,
      victory: false,
      jackpot: jackpot
    });
  }

  function choose(game, index) {
    if (!game || game.phase !== "event" || !game.pending) return { ok: false };
    var choice = game.pending.choices[index];
    if (!choice) return { ok: false };
    if (choice.mini === "pitch") {
      game.phase = "pitch";
      game.history.push({
        day: game.day,
        title: game.pending.title,
        choice: choice.label,
        result: "Stepped up to pitch."
      });
      pushLog(game, "Pitch time. One needle, one shot.", "warn");
      return { ok: true, pitch: true };
    }
    var tags = game.pending.tags || [];
    var title = game.pending.title;
    resolveChoice(game, choice, tags, title);
    return { ok: true };
  }

  function timeout(game) {
    if (!game || game.phase !== "event" || !game.pending) return { ok: false };
    var pending = game.pending;
    var t = pending.timeout || {
      effects: { morale: -4, runway: -2 },
      success: "You waited too long. The trail moved on without your opinion."
    };
    resolveChoice(game, {
      label: "Time ran out",
      effects: t.effects || {},
      success: t.success || "Time ran out.",
      flags: t.flags || null
    }, pending.tags || [], pending.title);
    return { ok: true };
  }

  function dismiss(game) {
    if (!game || game.phase !== "result") return { ok: false };
    var ended = !!(game.result && (game.result.victory || game.result.fatal));
    game.result = null;
    if (ended) {
      game.phase = "ended";
      game.score = scoreParts(game).total;
      return { ok: true, ended: true };
    }
    game.phase = "travel";
    touchScore(game);
    return { ok: true, ended: false };
  }

  function resolvePitch(game, position) {
    if (!game || game.phase !== "pitch") return { ok: false };
    var diff = DIFFICULTIES[game.difficulty];
    var pos = clamp(position, 0, 100);
    var zone = "red";
    if (pos >= diff.green[0] && pos <= diff.green[1]) zone = "green";
    else if (pos >= diff.yellow[0] && pos <= diff.yellow[1]) zone = "yellow";
    var choice;
    if (zone === "green") {
      choice = {
        label: "Pitch: green",
        effects: { runway: 20, equity: -10, traction: 16, morale: 6 },
        flags: ["raised"],
        success: "The needle landed in the green. They leaned forward. The round is real, and so is the slice they took."
      };
    } else if (zone === "yellow") {
      choice = {
        label: "Pitch: yellow",
        effects: { runway: 11, equity: -8, traction: 6, morale: -2 },
        flags: ["raised"],
        success: "You caught the edge of the zone. A smaller note, still a raise, still not Quiet Wealth."
      };
    } else {
      choice = {
        label: "Pitch: red",
        effects: { runway: -6, morale: -10, equity: -2, traction: 3 },
        success: "The needle missed. They will tell this story. You did not raise, which is the only mercy."
      };
    }
    var tags = (game.pending && game.pending.tags) || ["money"];
    resolveChoice(game, choice, tags, "Seed Crossing");
    return { ok: true, zone: zone };
  }

  function resolveHunt(game, tally) {
    if (!game || game.phase !== "hunt") return { ok: false };
    tally = tally || { users: 0, ghosts: 0, bugs: 0 };
    game.hunts = Math.max(0, game.hunts - 1);
    game.day += 1;
    var users = tally.users || 0;
    var ghosts = tally.ghosts || 0;
    var bugs = tally.bugs || 0;
    var text;
    if (users >= 6 && bugs === 0) {
      text = "You found real users in the brush and zero bugs. The ads were almost worth it.";
    } else if (bugs > users) {
      text = "The brush was mostly bugs. You paid for the lesson.";
    } else if (ghosts >= 3) {
      text = "Too many ghosts took the meeting and vanished. A little equity went with the vibe.";
    } else {
      text = "A short hunt. Some of what you tapped was a customer.";
    }
    var before = snap(game);
    game._before = before;
    applyNumbers(game, {
      runway: -round1(campCost(game) + 1.5),
      traction: users * 3,
      morale: 2 - bugs * 3,
      equity: ghosts >= 3 ? -4 : 0
    }, [], null);
    if (hasTrait(game, "operator")) game.morale = clamp(game.morale - 1, 0, 100);
    game.daysSinceEvent += 1;
    game._quits = [];
    game.history.push({ day: game.day, title: "User hunt", choice: users + " users", result: text });
    var death = checkDeath(game);
    if (death) {
      kill(game, death, text);
      return { ok: true };
    }
    pushLog(game, "User hunt: " + users + " kept.", users > bugs ? "good" : "bad");
    setResult(game, {
      title: "User hunt",
      text: text,
      deltas: payloadDeltas(game, before),
      quits: [],
      fatal: false,
      victory: false
    });
    return { ok: true };
  }

  function beginHunt(game) {
    if (!game || game.status !== "playing" || game.phase !== "travel") return { ok: false };
    if (game.hunts <= 0) return { ok: false, reason: "empty" };
    game.phase = "hunt";
    game.paused = false;
    return { ok: true };
  }

  function spendTravelStats(game, pace, ratio, atMiles) {
    var prev = game.miles;
    if (atMiles != null) game.miles = atMiles;
    var burn = dailyBurn(game, pace) * ratio;
    game.miles = prev;
    var morale = pace.morale * ratio;
    if (hasTrait(game, "operator")) morale -= ratio;
    game.runway = round1(clamp(game.runway - burn, 0, 100));
    game.morale = clamp(Math.round(game.morale + morale), 0, 100);
  }

  function maybeRandomEvent(game) {
    if (game.suppressEvents) return false;
    var seg = segmentInfo(game.miles);
    var pace = PACES[game.pace];
    var diff = DIFFICULTIES[game.difficulty];
    var chance = (0.28 + seg.index * 0.05) * pace.event * diff.event;
    var forceAt = Math.max(2, 5 - seg.index);
    game.daysSinceEvent += 1;
    if (game.daysSinceEvent >= forceAt || game.rng() < chance) {
      var def = pickEventDef(game);
      if (!def) return false;
      openEvent(game, materialize(def, game));
      return true;
    }
    return false;
  }

  function travelDay(game) {
    if (!game || game.status !== "playing" || game.phase !== "travel") return { ok: false };
    var pace = PACES[game.pace] || PACES.hustle;
    var next = nextMilestone(game);
    var gain = pace.miles;
    var ratio = 1;
    var hit = null;
    var from = game.miles;
    if (next && from + gain >= next.mile) {
      ratio = gain === 0 ? 1 : (next.mile - from) / gain;
      hit = next;
    }
    var before = snap(game);
    game.day += 1;
    spendTravelStats(game, pace, ratio, from);
    if (hit) game.miles = hit.mile;
    else game.miles = Math.round((from + gain) * 10) / 10;
    var death = checkDeath(game);
    if (death) {
      game._before = before;
      game._quits = [];
      pushLog(game, "The tank or the cap table gives out.", "bad");
      kill(game, death, "The day itself did it.");
      return { ok: true, ended: true };
    }
    if (hit) {
      openMilestone(game, hit);
      return { ok: true, milestone: hit.id };
    }
    if (maybeRandomEvent(game)) return { ok: true, event: true };
    touchScore(game);
    return { ok: true };
  }

  function setPace(game, pace) {
    if (!game || !PACES[pace]) return { ok: false };
    if (game.phase !== "travel") return { ok: false };
    game.pace = pace;
    pushLog(game, "Pace set to " + PACES[pace].label + ".", "");
    return { ok: true };
  }

  function rest(game) {
    if (!game || game.status !== "playing" || game.phase !== "travel") return { ok: false };
    game.paused = false;
    game.day += 1;
    var before = snap(game);
    game._before = before;
    var cost = campCost(game);
    applyNumbers(game, { runway: -cost, morale: 12 }, [], null);
    if (hasTrait(game, "operator")) game.morale = clamp(game.morale - 1, 0, 100);
    var death = checkDeath(game);
    if (death) {
      game._quits = [];
      kill(game, death, "Even camp has a bill.");
      return { ok: true };
    }
    pushLog(game, "Made camp. Morale mended a little.", "good");
    if (!game.suppressEvents && game.rng() < 0.22) {
      var def = pickEventDef(game);
      if (def) {
        game.history.push({
          day: game.day,
          title: "Camp",
          choice: "Rest",
          result: "Rested, then something walked into camp."
        });
        openEvent(game, materialize(def, game));
        return { ok: true, event: true };
      }
    }
    game.daysSinceEvent += 1;
    touchScore(game);
    setResult(game, {
      title: "Camp",
      text: "You stopped for a day. Rent still ticks. People unclench their jaws.",
      deltas: payloadDeltas(game, before),
      quits: [],
      fatal: false,
      victory: false
    });
    return { ok: true };
  }

  function coldEmail(game) {
    if (!game || game.status !== "playing" || game.phase !== "travel") return { ok: false };
    if (game.emails <= 0) return { ok: false, reason: "empty" };
    game.paused = false;
    game.emails -= 1;
    game.day += 1;
    var before = snap(game);
    game._before = before;
    var roll = game.rng();
    var effects;
    var text;
    if (roll < 0.4) {
      effects = { morale: -2, runway: -2 };
      text = "Opened and ignored. The trail does not care about your subject line.";
    } else if (roll < 0.72) {
      effects = { traction: 10, morale: 3, runway: -2 };
      text = "Someone booked a call. They might even show up.";
    } else if (roll < 0.9) {
      effects = { runway: 14, traction: 4, morale: 3 };
      text = "They paid a pilot from a promo budget and did not ask for equity.";
    } else if (game.rng() < 0.5) {
      effects = { traction: 16, morale: -2, runway: -1 };
      text = "The note got passed around as a joke that helped you. Famous, slightly worse.";
    } else {
      effects = { equity: -5, morale: -8, traction: 4, runway: -2 };
      text = "A stranger's reply outranked your homepage. The joke stuck to the brand.";
    }
    applyNumbers(game, effects, ["press"], null);
    game.runway = round1(clamp(game.runway - campCost(game), 0, 100));
    if (hasTrait(game, "operator")) game.morale = clamp(game.morale - 1, 0, 100);
    game.daysSinceEvent += 1;
    game._quits = [];
    game.history.push({ day: game.day, title: "Cold email", choice: "Send", result: text });
    var death = checkDeath(game);
    if (death) {
      kill(game, death, text);
      return { ok: true };
    }
    pushLog(game, "Cold email sent.", effects.runway > 0 || effects.traction > 6 ? "good" : "warn");
    setResult(game, {
      title: "Cold email",
      text: text,
      deltas: payloadDeltas(game, before),
      quits: [],
      fatal: false,
      victory: false
    });
    return { ok: true };
  }

  function quoteFor(game) {
    var i = Math.abs(game.day + Math.floor(game.miles)) % DATA.QUOTES.length;
    return DATA.QUOTES[i];
  }

  function playBeat(game, spec) {
    spec = spec || {};
    var before = snap(game);
    game._before = before;
    applyNumbers(game, spec.effects || {}, spec.tags || [], spec.absolute || null);
    var raisedNow = applyFlags(game, spec.flags);
    if (spec.story) {
      game.story = game.story || {};
      Object.keys(spec.story).forEach(function (k) { game.story[k] = spec.story[k]; });
    }
    var text = spec.text || "";
    if (raisedNow) text += " This counts as raising. Quiet Wealth is off the table.";
    var quits = [];
    if (spec.quit) {
      var q = maybeQuit(game, spec.quit);
      if (q) quits.push(q);
      if (q) text += " " + q.name + " " + q.reason + ".";
    }
    game._quits = quits;
    game.history.push({
      day: game.day,
      title: spec.title || "A beat",
      choice: spec.choice || "",
      result: text
    });
    if (game.history.length > 30) game.history.shift();
    var death = checkDeath(game);
    if (death) {
      pushLog(game, DATA.ENDINGS[death].title + ".", "bad");
      kill(game, death, text);
      return { fatal: true, endingId: death, deltas: payloadDeltas(game, before), quits: quits, text: text };
    }
    if (spec.log) pushLog(game, spec.log, spec.tone || "");
    touchScore(game);
    return { fatal: false, deltas: payloadDeltas(game, before), quits: quits, text: text };
  }

  function goals(game) {
    var next = nextMilestone(game);
    return DATA.MILESTONES.filter(function (m) { return m.mile > 0; }).map(function (m) {
      return {
        id: m.id,
        name: m.name,
        goal: m.goal,
        mile: m.mile,
        done: game.milestonesHit.some(function (h) { return h.id === m.id; }),
        current: !!(next && next.id === m.id)
      };
    });
  }

  return {
    DATA: DATA,
    DIFFICULTIES: DIFFICULTIES,
    PACES: PACES,
    SEGMENTS: SEGMENTS,
    createParty: createParty,
    createGame: createGame,
    travelDay: travelDay,
    setPace: setPace,
    rest: rest,
    coldEmail: coldEmail,
    beginHunt: beginHunt,
    resolveHunt: resolveHunt,
    choose: choose,
    timeout: timeout,
    dismiss: dismiss,
    resolvePitch: resolvePitch,
    describeChoice: describeChoice,
    scoreParts: scoreParts,
    liveScore: liveScore,
    segmentFor: segmentFor,
    segmentInfo: segmentInfo,
    quoteFor: quoteFor,
    goals: goals,
    nextMilestone: nextMilestone,
    riskChance: riskChance,
    shapeDelta: shapeDelta,
    dailyBurn: dailyBurn,
    campCost: campCost,
    hasTrait: hasTrait,
    playBeat: playBeat,
    claimSideQuest: claimSideQuest,
    markQuestClaim: markQuestClaim,
    shareText: shareText,
    intentPostUrl: intentPostUrl,
    isRealUrl: isRealUrl,
    publicGameUrl: publicGameUrl,
    fillDraft: fillDraft,
    channelUrl: channelUrl,
    nextStreak: nextStreak,
    claimWatchClip: claimWatchClip,
    watchClipId: watchClipId,
    watchClips: watchClips
  };
});
