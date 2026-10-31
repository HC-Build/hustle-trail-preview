(function (root, factory) {
  var scenes = (typeof module !== "undefined" && module.exports)
    ? require("./scenes.js")
    : root.HT_SCENES;
  var api = factory(scenes);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HT_GUIDE = api;
})(typeof window !== "undefined" ? window : globalThis, function (SCENES) {
  var host = typeof window !== "undefined" ? window : globalThis;
  var NAME = "June Harlow";
  var ROLE = "Trail boss";

  // June's relay. The publishable key is the same one auth.js uses. Never put a secret here.
  var PROXY_URL = "https://ycdbntuojctiruqkqiwt.supabase.co/functions/v1/june";
  var JUNE_ANON = "sb_publishable_Qr4hcgBR728ZfSHoVomKqg_qo4moCXC";
  var modelEndpoint = PROXY_URL;

  var RUMORS = {
    payroll: {
      id: "payroll",
      setup: "Word is Glassbird missed payroll. Could be true. Could be Nia method-acting. I am delighted either way.",
      actLabel: "Try to hire their engineer",
      leaveLabel: "Leave the gossip on the table",
      truth: {
        effects: { traction: 12, morale: -2, runway: -3 },
        text: "The engineer was real and tired. They joined the wagon. Glassbird will hear about it by Friday.",
        june: "True rumor. Look at me, useful. Do not get used to the feeling.",
        story: { glassbird: "poached" },
        log: "Hired from Glassbird."
      },
      lie: {
        effects: { equity: -4, morale: -6, traction: -3 },
        text: "Payroll was fine. You pitched a happy engineer in front of their team chat. The screenshot is already a sticker.",
        june: "I knew it was smoke. I wanted the scene. That part is on me. The sticker is on you.",
        story: { glassbird: "embarrassed" },
        log: "The payroll rumor was smoke."
      },
      leave: {
        effects: { morale: 2 },
        text: "You let it pass.",
        june: "Focus. I respect it and I am slightly bored, which is how you know it was wise.",
        log: "Ignored a rumor."
      }
    },
    checks: {
      id: "checks",
      setup: "Someone swore Lumen Bench is writing checks this week. Investors love a week. It makes them sound busy.",
      actLabel: "Take the meeting",
      leaveLabel: "Keep building",
      truth: {
        effects: { runway: 14, equity: -8, morale: -1 },
        flags: ["raised"],
        text: "They were actually writing checks. A small one has your name on it, and your cap table feels it.",
        june: "True, and you took it. The lullaby starts. I will poke you when you get sleepy.",
        story: { lumen: "check" },
        log: "Lumen Bench wrote a small check."
      },
      lie: {
        effects: { runway: -6, morale: -4 },
        text: "Lumen was on a retreat painting plates. You spent a day on a calendar hold.",
        june: "False. I wanted to see if you would chase a shiny week. You did. We are both clowns.",
        story: { lumen: "ghosted" },
        log: "Lumen Bench was not writing checks."
      },
      leave: {
        effects: { traction: 3, morale: 1 },
        text: "You stayed with the product.",
        june: "The product does not gossip. Infuriating. Correct.",
        log: "Skipped the Lumen rumor."
      }
    },
    coffee: {
      id: "coffee",
      setup: "I saw a calendar hold between one of yours and Glassbird. Might be treason. Might be a dentist.",
      actLabel: "Ask them straight",
      leaveLabel: "Trust them",
      truth: {
        effects: { morale: -4 },
        quit: { chance: 0.4 },
        text: "It was a real coffee. They wanted a quieter wagon. Asking out loud made it a choice.",
        june: "True, and ugly. If they stay, say thank you like you mean it. If they go, do not chase the train.",
        story: { team: "tested" },
        log: "A cofounder really met Glassbird."
      },
      lie: {
        effects: { morale: -8 },
        text: "It was a dentist. You accused a loyal person because the trail is noisy.",
        june: "False. I stirred it. You poured it on your own team. Apologize, then yell at me.",
        story: { team: "doubt" },
        log: "The secret coffee was a dentist."
      },
      leave: {
        effects: { morale: 4 },
        text: "You let your people have a calendar.",
        june: "Trust. I am bad at it. You are showing off.",
        log: "Trusted the team."
      }
    }
  };

  function blankMemory() {
    return {
      notes: [],
      grudge: 0,
      agreed: 0,
      mood: "dry",
      spoken: {},
      warned: {},
      barkDay: 0,
      openRumor: null,
      lastJune: "",
      screenSaid: {}
    };
  }

  function parseJune(data) {
    if (!data) return null;
    if (typeof data === "string") return cleanLine(data);
    var text = data.text || data.reply || data.content || data.output || null;
    if (text && typeof text === "object") text = text.content || text.text || null;
    if (!text && data.choices && data.choices[0] && data.choices[0].message) text = data.choices[0].message.content;
    if (!text && typeof data.message === "string") text = data.message;
    return cleanLine(text);
  }

  function cleanLine(text) {
    if (typeof text !== "string") return null;
    var out = text.replace(/[\u2013\u2014]/g, ",").trim();
    return out || null;
  }

  function askModel(payload) {
    if (!modelEndpoint || typeof fetch !== "function") return Promise.resolve(null);
    var body = {
      message: String((payload && (payload.message || payload.text)) || "").slice(0, 500),
      state: (payload && payload.state) || {},
      memory: (payload && payload.memory) || []
    };
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
    var headers = { "Content-Type": "application/json", "apikey": JUNE_ANON, "Authorization": "Bearer " + JUNE_ANON };
    return fetch(modelEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) return null;
      return res.json().catch(function () { return null; });
    }).then(function (data) {
      return parseJune(data);
    }).catch(function () {
      clearTimeout(timer);
      return null;
    });
  }

  function aliveCount(game) {
    return (game.cofounders || []).filter(function (c) { return c.alive; }).length;
  }

  function moodOf(game, memory) {
    if (!game) return "dry";
    if (game.runway < 22 || game.morale < 28 || aliveCount(game) <= 1) return "worried";
    if (memory.grudge >= 2) return "annoyed";
    if (memory.agreed >= 3) return "fond";
    if (memory.grudge === 0 && memory.agreed >= 1) return "gleeful";
    return "dry";
  }

  var MOOD_LABEL = {
    dry: "Unimpressed, on purpose",
    worried: "Actually worried",
    annoyed: "Judging you",
    gleeful: "Having a good time",
    fond: "Pretending not to care"
  };

  function reply(input, ctx) {
    ctx = ctx || {};
    var game = ctx.game || {};
    var memory = ctx.memory || blankMemory();
    var raw = String(input || "").trim();
    var t = raw.toLowerCase();
    var mile = Math.round(game.miles || 0);
    var nextName = "the next post";
    if (ctx.nextGoal) nextName = ctx.nextGoal.name + " at mile " + ctx.nextGoal.mile;
    var story = game.story || {};
    var mood = moodOf(game, memory);

    if (!raw) return "Use words. I am good, not psychic.";

    if (/what should i do|what now|help|hint|advice/.test(t)) {
      if (game.runway < 25) {
        return "The tank is making a face. Steady pace. Rest if the team is fraying. Do not crunch. If a rumor pays cash without a buyer, fine. A raise will sing you to sleep, and I hate that song.";
      }
      if (game.morale < 30) {
        return "Morale is a flat tire. Rest a day. A crunch now is how cofounders discover plumbing in Phoenix.";
      }
      if (game.equity < 40) {
        return "Your slice is getting thin. Stop taking checks unless the wagon is actually on fire. Quiet Wealth wants 68 percent and no raise on the books.";
      }
      if (aliveCount(game) <= 1) {
        return "One cofounder left. Do not pick anything that says someone might quit. I am loyal. I am also not a second founder.";
      }
      if (story.board === "buyer") {
        return "You let a buyer in. I hated it and I stayed. Next goal is " + nextName + ". If you sell the whole wagon early, say it like you chose it.";
      }
      return "Hustle is the honest pace. Next post is " + nextName + ". Keep runway above a panic, equity above a costume, and at least one friend in the wagon. I want you at mile 2000 still owning the wheels. That is my agenda. Yours can be dumber.";
    }

    if (/explain|what is this|what's this|whats this|huh|context/.test(t)) {
      if (ctx.scene) {
        return ctx.scene.brief + " Stakes are on the buttons. I marked the one I want in my head. I will not always be right, and I will be loud when you ignore me.";
      }
      if (ctx.pending) {
        return "This is " + ctx.pending.title + ". " + (ctx.pending.text || "") + " Read the chips before you get brave. Mile " + mile + ".";
      }
      return "The trail is the map. Scenes are the job. You win at mile 2000 with runway, equity, and a living cofounder. You lose if any of those hit the floor. I talk through it because silence is how Puddle ended.";
    }

    if (/story|gossip|rumor|tell me/.test(t)) {
      if (memory.openRumor) {
        return memory.openRumor.setup + " Chase it or leave it. I already rolled the truth and I am sitting on it like a hen.";
      }
      return "STORY_RUMOR";
    }

    if (/who are you|your name|june/.test(t)) {
      return "June Harlow. I founded Puddle, sold it too early, and now I ride other people's wagons so I can heckle the parts I botched. I am on your side. I am not on your ego's side.";
    }

    if (/quiet wealth|sell|raise|investor/.test(t)) {
      if (game.flags && game.flags.raised) {
        return "You already raised. Quiet Wealth is off the table. Spend the cash like it has to last past the part where you feel clever.";
      }
      return "Quiet Wealth is the exit with no raise and at least 68 percent equity. A check blocks it. I took the check once. The buyer still sends a card I do not open.";
    }

    if (/sorry|apolog/.test(t)) {
      memory.grudge = Math.max(0, memory.grudge - 1);
      return "Accepted. Do not make a habit of needing it. I forgive fast and remember forever, which is a flawed product.";
    }

    if (/thank/.test(t)) {
      return mood === "worried"
        ? "Thank me by not dying in a ditch made of ad spend."
        : "You are welcome. I will ruin it by being right later.";
    }

    if (story.glassbird === "feud" && /nia|glassbird/.test(t)) {
      return "You mocked Nia's logo. She keeps receipts in a very organized folder. Do not ask her for a favor unless you enjoy a public no.";
    }
    if (story.lumen === "raised" && /lumen|priya|ellis/.test(t)) {
      return "Priya has your name in a note. Ellis has your fear in a note. Different notebooks. Same firm.";
    }
    if (memory.notes.length) {
      var last = memory.notes[memory.notes.length - 1];
      if (/remember|last time|before/.test(t)) {
        return "I remember. " + last;
      }
    }

    if (mood === "worried") {
      return "I am in a loyal panic. Mile " + mile + ", runway " + Math.round(game.runway || 0) + ". Be boring until the wagon is safe. Then you can be funny again.";
    }
    if (mood === "annoyed") {
      return "You keep picking the spicy one. I admire the nerve and I am keeping score. " + (game.company || "The company") + " is at mile " + mile + ".";
    }
    return "Mile " + mile + " on " + (game.company || "the wagon") + ". I heard you. If that was strategy, it needs a verb. Ask me what to do, or walk into the next room and choose like you mean it.";
  }

  function makeRumor(id, truth) {
    var src = RUMORS[id];
    if (!src) return null;
    return {
      id: id,
      setup: src.setup,
      actLabel: src.actLabel,
      leaveLabel: src.leaveLabel,
      truth: !!truth
    };
  }

  function rumorBeat(rumor, action) {
    var src = RUMORS[rumor.id];
    var pack = action === "leave" ? src.leave : (rumor.truth ? src.truth : src.lie);
    return {
      beat: {
        title: "Rumor: " + rumor.id,
        choice: action === "leave" ? rumor.leaveLabel : rumor.actLabel,
        effects: pack.effects || {},
        flags: pack.flags || null,
        story: pack.story || null,
        quit: pack.quit || null,
        text: pack.text,
        log: pack.log,
        tone: action !== "leave" && !rumor.truth ? "bad" : "good"
      },
      juneLine: pack.june
    };
  }

  function welcome(game) {
    var who = game && game.company ? game.company : "this wagon";
    return "I am June Harlow. Trail boss, former founder of Puddle, which I sold too early and still taste. " + who + " wins at mile 2000 if runway, equity, and at least one cofounder are still here. You lose if any of those hit zero. I will gossip, disagree, and pull you out of fires. Talk back.";
  }

  function briefEvent(game) {
    var ev = game.pending;
    if (!ev) return "Something is on the trail. Read it before you get brave.";
    if (ev.milestone) {
      return "Stop the wagon. " + ev.title + " is a real post, not scenery. " + (ev.text || "") + " I have opinions. The chips have the math.";
    }
    return "Incoming. " + ev.title + ". " + (ev.text || "") + " Pick with your eyes open. I will comment after, whether you want it or not.";
  }

  function reactResult(game) {
    var result = game.result;
    if (!result) return "That happened.";
    if (result.fatal) {
      return "This is the end of the run, not the end of me being right. " + (result.text || "") + " Read the recap. Then we go again, meaner and wiser.";
    }
    if (result.victory) {
      return "You finished the trail. I am proud in a way I will deny if asked. " + (result.title || "") + ". Look at the recap before you get humble.";
    }
    var d = result.deltas || {};
    var bit = result.text || result.title || "Done.";
    if ((result.quits || []).length) {
      return bit + " I hate losing people. Sit with it, then drive.";
    }
    if ((d.runway || 0) <= -8 || (d.equity || 0) <= -6) {
      return bit + " That stung. If you meant it, fine. If you were showing off, we will discuss your habits.";
    }
    if ((d.traction || 0) >= 8 || (d.morale || 0) >= 6) {
      return bit + " There. A real win. I am allowed to be glad for one sentence.";
    }
    return bit + " The trail continues. So do I.";
  }

  function keywordHit(text, keyword) {
    var escaped = String(keyword || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^a-z0-9])" + escaped + "([^a-z0-9]|$)", "i").test(text || "");
  }

  function rateComment(style, text) {
    var raw = String(text || "");
    var hits = [];
    if (!style) return { hits: [], score: 0, nailed: false, bonus: null, reaction: "No dare. Paste a kind comment anyway." };
    (style.keywords || []).forEach(function (word) {
      if (keywordHit(raw, word)) hits.push(word);
    });
    var score = hits.length;
    var letters = raw.replace(/[^A-Za-z]/g, "");
    var caps = raw.replace(/[^A-Z]/g, "").length;
    if (style.caps && letters.length > 10 && caps / letters.length > 0.55) score += 2;
    if (style.ellipsis && (raw.indexOf("...") >= 0 || raw.indexOf("..") >= 0)) score += 1;
    if (style.lines) {
      var lines = raw.split(/\n/).filter(function (line) { return line.trim(); });
      if (lines.length >= style.lines) score += 2;
    }
    var nailAt = style.nailAt || 2;
    var nailed = score >= nailAt;
    var kind = " Keep it kind, and about the clip.";
    var reaction;
    if (nailed) {
      reaction = "Nailed the " + style.label + " costume. I counted " + hits.length + " tells" + (hits.length ? ": " + hits.slice(0, 4).join(", ") : "") + ". Bonus on the way." + kind;
    } else if (score > 0) {
      reaction = "I see a piece of the " + style.label + " costume, not the whole outfit. Edit it and try again, or claim the clip plain." + kind;
    } else {
      reaction = "That was a normal sentence. The dare was " + style.label + ". No style bonus yet." + kind;
    }
    return { hits: hits, score: score, nailed: nailed, bonus: nailed ? (style.bonus || null) : null, reaction: reaction };
  }

  function stylesList() {
    var host = typeof window !== "undefined" ? window : globalThis;
    return (host.HT && host.HT.DATA && host.HT.DATA.COMMENT_STYLES) || [];
  }

  function styleById(id) {
    var list = stylesList();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function styleForClip(game, index) {
    var list = stylesList();
    if (!list.length) return null;
    game.clipStyles = game.clipStyles || {};
    if (!game.clipStyles[index]) {
      var featured = list.filter(function (s) { return s.featured; });
      var pool = game.rng && game.rng() < 0.5 && featured.length ? featured : list;
      var pick = pool[Math.floor((game.rng ? game.rng() : Math.random()) * pool.length)];
      game.clipStyles[index] = pick.id;
    }
    return styleById(game.clipStyles[index]);
  }

  function sideQuestLine(reason, quest, streak) {
    var title = quest && quest.title ? quest.title : "that quest";
    if (reason === "dare") return quest && quest.dare ? quest.dare : "Do the slow thing. I will be here to roast the excuse.";
    if (reason === "nag") return "Side quests are the founder chores you are avoiding. Post, comment, DM, or film. I will keep nagging. The glow is for the vulnerable ones.";
    if (reason === "cooldown") return "Not again. " + title + " already paid. I roast farmers. Come back after the cooldown, or pick a different bruise.";
    if (reason === "closed") return "You have not done it yet. Open the draft, send the DMs, or hit record. Then tell me. Honor system. I am watching your laziness, not your likes.";
    if (reason === "short") return "Type the comment you left, or one takeaway. I am not grading the prose. I am making you look at it. Keep it kind and on the clip.";
    if (reason === "once") return "That clip already paid. I do not do reruns. Pick another.";
    if (reason === "placeholder") return "That slot is still PLACEHOLDER_URL. Paste a real link in WATCH_CLIPS and I will pay. The dare can wait.";
    if (reason === "watch-ok") {
      var bit = "You watched, liked, and showed up in the comments. This game is here to make you learn, and to push you into the public part you avoid. Showing up pays off.";
      if (streak >= 2) bit += " Streak " + streak + ".";
      return bit;
    }
    if (reason === "ok") {
      var hype = quest && quest.hype ? quest.hype : "You did the awkward thing. I am hyping you.";
      if (streak >= 2) hype += " Streak is " + streak + ". Do not get cute and skip tomorrow.";
      return hype;
    }
    return "Side quest filed.";
  }

  function recapLine(game) {
    var won = game.status === "won";
    var ending = game.endingId || "the end";
    var mile = Math.round(game.miles || 0);
    var alive = aliveCount(game);
    if (won && ending === "quiet") {
      return "Quiet Wealth. You kept the wheels. I sold mine and I am clapping anyway, which is growth. Mile " + mile + ", " + alive + " still aboard. I told you the lullaby was optional.";
    }
    if (won) {
      return "You reached the exit. Ending: " + ending + ". Mile " + mile + ". I rode the whole way and I only threatened to quit twice. The recap has the math. I have the gossip.";
    }
    return "The wagon stopped. " + ending + " at mile " + mile + ". I am still your friend, which is inconvenient for both of us. Read the recap, then start a meaner run.";
  }

  function bark(game, memory) {
    var lines = [
      "Mile " + Math.round(game.miles) + ". The desert is not personal. Your burn rate is.",
      "I am still here. That is the nicest thing I will say until you earn another.",
      (game.company || "The company") + " rolls on. Try to be a person the team can text back."
    ];
    if (memory.grudge > 0) lines.push("I have not forgotten the spicy choice. I am just letting the scenery do some of the lecture.");
      if (game.story && game.story.glassbird) lines.push("Glassbird is still out there being Glassbird. We will hear from them when it is least convenient.");
      (game.network || []).forEach(function (p) {
        if (p.drama && p.dramaText) lines.push("Gossip, and I am not inventing this one. " + p.dramaText);
      });
      return lines[Math.abs(game.day) % lines.length];
  }

  function pickRumorId(game, memory) {
    var ids = ["payroll", "checks", "coffee"];
    var used = memory.usedRumors || {};
    for (var i = 0; i < ids.length; i++) {
      if (!used[ids[i]]) return ids[i];
    }
    return ids[game.day % ids.length];
  }

  // Browser voice, chat UI, and memory live here. Tests use the pure functions above.
  var memory = blankMemory();
  var bound = null;
  var voiceOn = true;
  var userActivated = false;
  var queue = [];
  var speaking = false;
  var micHold = false;
  var utterKeep = [];
  var chosen = { june: null, male: null, female: null };
  var recOn = false;
  var mounted = false;

  function loadVoicePref() {
    try {
      var v = localStorage.getItem("hustle-trail-voice");
      voiceOn = v !== "0";
    } catch (e) { voiceOn = true; }
  }

  function saveVoicePref() {
    try { localStorage.setItem("hustle-trail-voice", voiceOn ? "1" : "0"); } catch (e) {}
  }

  function voiceScore(v) {
    var n = ((v.name || "") + " " + (v.lang || "")).toLowerCase();
    if (!/^en/i.test(v.lang || "")) return -1;
    var score = 0;
    if (/natural|premium|enhanced|neural|siri/.test(n)) score += 60;
    if (/samantha|aria|jenny|serena|karen|moira|sonia|libby/.test(n)) score += 36;
    if (/google us english|google uk english female/.test(n)) score += 28;
    if (/en-us/i.test(v.lang || "")) score += 12;
    else if (/en-gb/i.test(v.lang || "")) score += 9;
    if (v.localService) score += 2;
    if (/compact|espeak/.test(n)) score -= 20;
    return score;
  }

  function maleScore(v) {
    var n = (v.name || "").toLowerCase();
    if (!/^en/i.test(v.lang || "")) return -1;
    if (/female|samantha|aria|jenny|victoria|karen|moira|serena|zira/.test(n)) return -1;
    var score = voiceScore(v);
    if (/daniel|david|alex|fred|rishi|arthur|male|aaron|guy|brian/.test(n)) score += 40;
    return score;
  }

  function refreshVoices() {
    if (!window.speechSynthesis) return;
    var list = window.speechSynthesis.getVoices() || [];
    var best = null;
    var bestS = -1;
    var man = null;
    var manS = -1;
    list.forEach(function (v) {
      var s = voiceScore(v);
      if (s > bestS) { bestS = s; best = v; }
      var m = maleScore(v);
      if (m > manS) { manS = m; man = v; }
    });
    chosen.june = best;
    chosen.female = best;
    chosen.male = manS > 10 ? man : best;
  }

  var PROFILES = {
    june: { pitch: 0.9, rate: 0.96, which: "june" },
    nia: { pitch: 1.12, rate: 1.05, which: "female" },
    priya: { pitch: 1.16, rate: 1.0, which: "female" },
    ellis: { pitch: 0.72, rate: 0.88, which: "male" },
    alex: { pitch: 1.02, rate: 1.08, which: "male" },
    rin: { pitch: 1.08, rate: 1.12, which: "female" },
    maren: { pitch: 0.84, rate: 0.92, which: "female" }
  };

  function splitChunks(text) {
    var parts = String(text || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [String(text || "")];
    var out = [];
    var buf = "";
    parts.forEach(function (p) {
      if ((buf + p).length > 160) {
        if (buf.trim()) out.push(buf.trim());
        buf = p;
      } else buf += p;
    });
    if (buf.trim()) out.push(buf.trim());
    return out.length ? out : [String(text || "")];
  }

  function profileFor(who) {
    return PROFILES[who] || PROFILES.june;
  }

  function pump() {
    if (micHold || speaking || !voiceOn || !userActivated || !window.speechSynthesis) return;
    if (!queue.length) { paintTalking(false); return; }
    var item = queue.shift();
    var profile = profileFor(item.who);
    var voice = chosen[profile.which] || chosen.june;
    var u = new SpeechSynthesisUtterance(item.text);
    u.pitch = profile.pitch;
    u.rate = profile.rate;
    u.lang = (voice && voice.lang) || "en-US";
    if (voice) u.voice = voice;
    utterKeep.push(u);
    if (utterKeep.length > 8) utterKeep.shift();
    speaking = true;
    paintTalking(true);
    u.onend = function () { speaking = false; pump(); };
    u.onerror = function () { speaking = false; paintTalking(false); showTap(); };
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(u);
    } catch (e) {
      speaking = false;
      showTap();
    }
  }

  function enqueueSpeak(text, who) {
    if (!text) return;
    splitChunks(text).forEach(function (c) { queue.push({ text: c, who: who || "june" }); });
    pump();
  }

  function stopTalking() {
    queue = [];
    speaking = false;
    paintTalking(false);
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  function showTap() {
    if (userActivated) {
      var status = document.getElementById("guide-micstatus");
      if (status && status.dataset.state !== "listening") status.textContent = "Voice is blocked. June still types.";
      return;
    }
    var node = document.getElementById("guide-tap");
    if (node) node.hidden = false;
  }

  function hideTap() {
    var node = document.getElementById("guide-tap");
    if (node) node.hidden = true;
  }

  function paintTalking(on) {
    var av = document.getElementById("guide-avatar");
    var launch = document.getElementById("june-launch");
    if (av) av.classList.toggle("talking", !!on);
    if (launch) launch.classList.toggle("talking", !!on);
  }

  function paintMood() {
    var node = document.getElementById("guide-mood");
    if (!node) return;
    var m = moodOf(bound, memory);
    memory.mood = m;
    node.textContent = MOOD_LABEL[m] || MOOD_LABEL.dry;
  }

  function logLine(who, text) {
    memory.lastJune = who === "june" ? text : memory.lastJune;
    var log = document.getElementById("guide-log");
    if (!log) return;
    var row = document.createElement("p");
    row.className = "g-line " + (who === "june" ? "june" : who === "you" ? "you" : "npc");
    var label = who === "june" ? "June" : who === "you" ? "You" : (PROFILES[who] ? who : "Note");
    if (who !== "june" && bound && bound.scene && bound.scene.def && bound.scene.def.npc && bound.scene.def.npc.voice === who) {
      label = bound.scene.def.npc.name;
    }
    var nameMap = { nia: "Nia", priya: "Priya", ellis: "Ellis", alex: "Alex", rin: "Rin", maren: "Maren" };
    if (nameMap[who]) label = nameMap[who];
    row.textContent = label + ": " + text;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    if (who !== "you") markUnread();
  }

  var OPEN_KEY = "hustle-june-open";

  function guideIsOpen() {
    var guide = document.getElementById("guide");
    return !!(guide && !guide.classList.contains("closed"));
  }

  function readOpen() {
    try { return sessionStorage.getItem(OPEN_KEY) === "1"; } catch (e) { return false; }
  }

  function writeOpen(on) {
    try { sessionStorage.setItem(OPEN_KEY, on ? "1" : "0"); } catch (e) {}
  }

  function markUnread() {
    if (guideIsOpen()) return;
    var dot = document.getElementById("june-unread");
    if (dot) dot.hidden = false;
  }

  function clearUnread() {
    var dot = document.getElementById("june-unread");
    if (dot) dot.hidden = true;
  }

  function setGuideOpen(on) {
    var guide = document.getElementById("guide");
    var launch = document.getElementById("june-launch");
    if (!guide) return;
    guide.classList.toggle("closed", !on);
    document.body.classList.toggle("guide-open", !!on);
    if (launch) {
      launch.setAttribute("aria-expanded", on ? "true" : "false");
      launch.setAttribute("aria-label", on ? "Close June" : "Open June");
    }
    if (on) clearUnread();
    writeOpen(!!on);
  }

  function say(text, who, opts) {
    if (!text) return;
    if (opts && opts.interrupt) stopTalking();
    logLine(who || "june", text);
    paintMood();
    if (who === "june" || !who) {
      try { if (typeof host.HT_JUNE_ECHO === "function") host.HT_JUNE_ECHO(text); } catch (e) {}
    }
    try { enqueueSpeak(text, who || "june"); } catch (e) { showTap(); }
    var rumorRow = document.getElementById("guide-rumor");
    if (rumorRow) rumorRow.hidden = !memory.openRumor;
  }

  function primeFromGesture() {
    if (!userActivated) {
      userActivated = true;
      hideTap();
      refreshVoices();
    }
    pump();
  }

  function setVoice(on) {
    voiceOn = !!on;
    saveVoicePref();
    if (!voiceOn) stopTalking();
    var btn = document.getElementById("guide-voice");
    if (btn) btn.textContent = voiceOn ? "Mute June" : "Unmute June";
    if (btn) btn.setAttribute("aria-pressed", voiceOn ? "true" : "false");
  }

  function snapshot(game) {
    if (!game) return {};
    return {
      company: game.company,
      miles: game.miles,
      day: game.day,
      runway: game.runway,
      equity: game.equity,
      morale: game.morale,
      traction: game.traction,
      pace: game.pace,
      phase: game.phase,
      story: game.story || {},
      flags: game.flags || {},
      network: (game.network || []).map(function (p) {
        return { name: p.name, role: p.role, trust: p.trust, met: p.met, perk: p.perk };
      }),
      scene: game.scene && game.scene.def ? game.scene.def.id : null,
      event: game.pending ? game.pending.title : null,
      meeting: game.meeting && game.meeting.def ? {
        id: game.meeting.def.id,
        round: game.meeting.round,
        breakthrough: game.meeting.breakthrough,
        done: !!game.meeting.done
      } : null
    };
  }

  function ctxFrom(game) {
    var nextGoal = null;
    if (game && host.HT && host.HT.nextMilestone) nextGoal = host.HT.nextMilestone(game);
    return {
      game: game,
      memory: memory,
      scene: game && game.scene && game.scene.def,
      pending: game && game.pending,
      nextGoal: nextGoal
    };
  }

  function noteChoice(label, juneTake) {
    var line = "You chose \"" + label + "\" and I was " + (juneTake === "no" ? "against it" : juneTake === "yes" ? "for it" : "on the fence") + ".";
    memory.notes.push(line);
    if (memory.notes.length > 12) memory.notes.shift();
    if (juneTake === "no") memory.grudge += 1;
    if (juneTake === "yes") { memory.agreed += 1; memory.grudge = Math.max(0, memory.grudge - 1); }
    paintMood();
  }

  function openRumor(game, id, truth) {
    var rumor = makeRumor(id, truth);
    if (!rumor) return;
    memory.openRumor = rumor;
    memory.usedRumors = memory.usedRumors || {};
    memory.usedRumors[id] = true;
    say(rumor.setup, "june");
    paintRumor();
  }

  function paintRumor() {
    var row = document.getElementById("guide-rumor");
    if (!row) return;
    row.hidden = !memory.openRumor;
    if (!memory.openRumor) return;
    var act = document.getElementById("rumor-act");
    var leave = document.getElementById("rumor-leave");
    if (act) act.textContent = memory.openRumor.actLabel;
    if (leave) leave.textContent = memory.openRumor.leaveLabel;
  }

  function actRumor(action) {
    if (!memory.openRumor || !bound || !host.HT || !host.HT.playBeat) return;
    var rolled = rumorBeat(memory.openRumor, action);
    memory.openRumor = null;
    paintRumor();
    host.HT.playBeat(bound, rolled.beat);
    noteChoice(rolled.beat.choice, action === "leave" ? "meh" : "meh");
    say(rolled.juneLine, "june");
    if (host.HT_UI_AFTER) host.HT_UI_AFTER();
  }

  function onRun(game) {
    bound = game;
    memory = blankMemory();
    say(welcome(game), "june");
    paintMood();
  }

  function onScreen(screen) {
    if (memory.screenSaid[screen]) return;
    memory.screenSaid[screen] = true;
    if (screen === "title") {
      say("Name is June Harlow. I narrate this trail. Start the wagon and I start talking.", "june");
    } else if (screen === "setup") {
      say("Founder is the fair pain. Unhinged is for people who want a story more than a nap. Cautious is for living. I do not judge. That was a lie.", "june");
    }
  }

  function onChange(game) {
    if (!game) return;
    bound = game;
    if (game.phase === "travel" && game.status === "playing" && SCENES && SCENES.next) {
      var scene = SCENES.next(game);
      if (scene) {
        game.scenesSeen = game.scenesSeen || [];
        game.scenesSeen.push(scene.id);
        game.phase = "scene";
        game.scene = { def: scene, step: "live", voicedNpc: false };
        say(scene.brief, "june", { interrupt: true });
        return;
      }
      var host = typeof window !== "undefined" ? window : globalThis;
      if (host.HT_NET && host.HT_NET.next) {
        var enc = host.HT_NET.next(game);
        if (enc) {
          game.networkSeen = game.networkSeen || [];
          game.networkSeen.push(enc.id);
          game.phase = "meeting";
          game.meeting = host.HT_NET.begin(game, enc);
          say(game.meeting.def.brief, "june", { interrupt: true });
          return;
        }
      }
      warn(game);
      if (game.day > 1 && game.day % 6 === 0 && memory.barkDay !== game.day) {
        memory.barkDay = game.day;
        say(bark(game, memory), "june");
      }
    } else if (game.phase === "event" && game.pending) {
      var ek = "ev:" + game.day + ":" + game.pending.title;
      if (!memory.spoken[ek]) {
        memory.spoken[ek] = true;
        say(briefEvent(game), "june", { interrupt: true });
      }
    } else if (game.phase === "result" && game.result) {
      var rk = "rs:" + game.day + ":" + game.result.title + ":" + (game.result.text || "").slice(0, 24);
      if (!memory.spoken[rk]) {
        memory.spoken[rk] = true;
        say(reactResult(game), "june");
      }
    } else if (game.phase === "pitch") {
      if (!memory.spoken.pitch) {
        memory.spoken.pitch = true;
        say("One needle. Green is a real round and it counts as raising. I want the green only if the tank is actually scared. Otherwise enjoy missing.", "june");
      }
    } else if (game.phase === "hunt") {
      if (!memory.spoken["hunt" + game.day]) {
        memory.spoken["hunt" + game.day] = true;
        say("Tap the users. Ghosts are meetings that vanish. Bugs bite. Nine seconds. Try not to make it a personality test.", "june");
      }
    }
    paintMood();
  }

  function warn(game) {
    if (game.runway < 18 && !memory.warned.r18) {
      memory.warned.r18 = true;
      say("Runway is a rumor you are about to disprove. Steady. Rest if you must. No crunch. I am not teasing.", "june");
    } else if (game.runway < 32 && !memory.warned.r32) {
      memory.warned.r32 = true;
      say("The tank is getting theatrical. Ease the pace or find cash that is not a buyer in a costume.", "june");
    }
    if (game.morale < 28 && !memory.warned.m28) {
      memory.warned.m28 = true;
      say("Morale is sagging. Rest a day before the group chat becomes a resignation letter.", "june");
    }
    if (game.equity < 40 && !memory.warned.e40) {
      memory.warned.e40 = true;
      say("Your slice is under 40. Another check and you are a guest in your own wagon.", "june");
    }
    if (aliveCount(game) === 1 && !memory.warned.solo) {
      memory.warned.solo = true;
      say("One cofounder left. Be kind or be finished. I vote kind.", "june");
    }
    if (game.day > 4 && !(game.sideClaims || []).length && !memory.warned.questNag) {
      memory.warned.questNag = true;
      say(sideQuestLine("nag"), "june");
    }
  }

  function onRecap(game) {
    bound = game;
    var key = "recap:" + game.endingId + ":" + game.day;
    if (memory.spoken[key]) return;
    memory.spoken[key] = true;
    say(recapLine(game), "june", { interrupt: true });
  }

  function voiceNpc(scene) {
    if (!scene || scene.voicedNpc) return;
    scene.voicedNpc = true;
    if (scene.def && scene.def.line) say(scene.def.line, scene.def.npc.voice);
  }

  var LOST_LINE = "I lost that thought. Ask me again. The wagon is still moving.";

  function routeSceneText(game, text) {
    if (!(game && game.phase === "scene" && game.scene && game.scene.step === "live" && SCENES && SCENES.interpret)) {
      return { mode: "talk" };
    }
    var hit = SCENES.interpret(game.scene.def, text);
    if (hit && hit.index != null) return { mode: "pick", hit: hit };
    return { mode: "talk" };
  }

  function scriptedAnswer(value, ctx) {
    try {
      var line = reply(value, ctx);
      if (line) return line;
    } catch (e) {}
    return LOST_LINE;
  }

  function sendText(text) {
    var value = String(text || "").trim().slice(0, 500);
    if (!value) return;
    logLine("you", value);
    var game = bound;
    var routed = routeSceneText(game, value);
    if (routed.mode === "pick" && host.HT_SCENE_PICK) {
      host.HT_SCENE_PICK(routed.hit);
      return;
    }
    var ctx;
    try { ctx = ctxFrom(game); } catch (e) { ctx = { game: game, memory: memory }; }
    var payload;
    try {
      payload = {
        message: value,
        state: snapshot(game),
        memory: memory.notes.slice(-6)
      };
    } catch (e) {
      payload = { message: value, state: {}, memory: [] };
    }
    askModel(payload).then(function (modelText) {
      if (modelText) {
        say(modelText, "june");
        return;
      }
      var line = scriptedAnswer(value, ctx);
      if (line === "STORY_RUMOR") {
        var id = pickRumorId(game || { day: 1 }, memory);
        var truth = game && game.rng ? game.rng() < 0.5 : Math.random() < 0.5;
        if (id === "payroll") truth = game && game.rng ? game.rng() < 0.55 : Math.random() < 0.55;
        openRumor(game, id, truth);
        return;
      }
      say(line, "june");
    }).catch(function () {
      say(LOST_LINE, "june");
    });
  }

  function avatarSvg() {
    return "<svg viewBox='0 0 64 64' aria-hidden='true'><circle cx='32' cy='32' r='30' fill='#f4ead7'/><path d='M14 30c2-14 34-16 38-2 2 8-4 10-8 8-6-8-18-8-24 0-4 2-8 0-6-6z' fill='#3a2418'/><circle cx='24' cy='34' r='2.2' fill='#24170f'/><circle cx='40' cy='34' r='2.2' fill='#24170f'/><path d='M22 28c2-3 6-3 8 0' fill='none' stroke='#24170f' stroke-width='1.6'/><path d='M36 29c2-2 5-1 6 1' fill='none' stroke='#24170f' stroke-width='1.6'/><path d='M26 44c4 3 8 3 12 0' fill='none' stroke='#9d2218' stroke-width='2' stroke-linecap='round'/><path d='M16 48c6 8 26 8 32 0' fill='#c4491d'/></svg>";
  }

  function mount() {
    if (mounted || !document.body) return;
    mounted = true;
    loadVoicePref();
    refreshVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
      setTimeout(refreshVoices, 300);
    }
    var dock = document.createElement("div");
    dock.id = "june-dock";
    var launch = document.createElement("button");
    launch.type = "button";
    launch.id = "june-launch";
    launch.setAttribute("aria-controls", "guide");
    launch.innerHTML = ""
      + "<span class='june-face' id='june-face'></span>"
      + "<span class='june-badge' aria-hidden='true'><svg viewBox='0 0 16 16'><path d='M1.5 2.5h13v8.2H6.2L2.8 14V2.5z'/></svg></span>"
      + "<span class='june-unread' id='june-unread' hidden></span>";
    var aside = document.createElement("aside");
    aside.id = "guide";
    aside.className = "guide closed";
    aside.setAttribute("aria-label", "June Harlow, trail boss");
    aside.innerHTML = ""
      + "<header class='g-head'>"
      + "<span class='g-avatar' id='guide-avatar' aria-hidden='true'></span>"
      + "<div class='g-id'><strong>June Harlow</strong><span id='guide-mood'>Unimpressed, on purpose</span></div>"
      + "<button type='button' class='g-voice' id='guide-voice'></button>"
      + "<button type='button' class='g-x' id='guide-close' aria-label='Close June'>X</button>"
      + "</header>"
      + "<button type='button' class='g-tap' id='guide-tap' hidden>Tap to let June talk</button>"
      + "<div class='g-log' id='guide-log' aria-live='polite'></div>"
      + "<div class='g-quick' id='guide-quick'></div>"
      + "<div class='g-rumor' id='guide-rumor' hidden>"
      + "<button type='button' id='rumor-act'>Chase it</button>"
      + "<button type='button' id='rumor-leave'>Leave it</button>"
      + "</div>"
      + "<form class='g-form' id='guide-form'>"
      + "<button type='button' id='guide-mic' aria-label='Talk to June'>Mic</button>"
      + "<div class='g-field'><input id='guide-input' type='text' maxlength='500' placeholder='Talk to June' autocomplete='off'><span class='g-count' id='guide-count'>0/500</span></div>"
      + "<button type='submit'>Send</button>"
      + "</form>"
      + "<p class='g-micstatus' id='guide-micstatus'></p>";
    dock.appendChild(aside);
    dock.appendChild(launch);
    document.body.appendChild(dock);
    document.getElementById("guide-avatar").innerHTML = avatarSvg();
    document.getElementById("june-face").innerHTML = avatarSvg();
    setGuideOpen(readOpen());
    setVoice(voiceOn);
    var quick = document.getElementById("guide-quick");
    ["What should I do?", "Explain this", "Tell me a story"].forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function () {
        primeFromGesture();
        sendText(label);
      });
      quick.appendChild(b);
    });
    document.getElementById("guide-voice").addEventListener("click", function () {
      primeFromGesture();
      setVoice(!voiceOn);
      if (voiceOn) say("Voice on. I will keep the opinions.", "june");
    });
    document.getElementById("guide-close").addEventListener("click", function () {
      primeFromGesture();
      setGuideOpen(false);
    });
    launch.addEventListener("click", function () {
      primeFromGesture();
      setGuideOpen(!guideIsOpen());
      if (guideIsOpen() && queue.length) primeFromGesture();
    });
    document.getElementById("guide-tap").addEventListener("click", function () {
      primeFromGesture();
      if (memory.lastJune) enqueueSpeak(memory.lastJune, "june");
    });
    var guideInput = document.getElementById("guide-input");
    guideInput.addEventListener("input", refreshGuideCount);
    document.getElementById("guide-form").addEventListener("submit", function (e) {
      e.preventDefault();
      primeFromGesture();
      hideTap();
      var input = document.getElementById("guide-input");
      var value = input.value;
      input.value = "";
      refreshGuideCount();
      sendText(value);
    });
    document.getElementById("rumor-act").addEventListener("click", function () { primeFromGesture(); actRumor("act"); });
    document.getElementById("rumor-leave").addEventListener("click", function () { primeFromGesture(); actRumor("leave"); });
    wireMic();
    document.addEventListener("pointerdown", primeFromGesture);
  }

  function refreshGuideCount() {
    var input = document.getElementById("guide-input");
    var count = document.getElementById("guide-count");
    if (!input || !count) return;
    if (input.value.length > 500) input.value = input.value.slice(0, 500);
    var n = input.value.length;
    count.textContent = n + "/500";
    count.classList.toggle("hot", n >= 450);
  }

  function micErrorMessage(err) {
    var name = err && (err.name || err.error);
    if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError" || name === "not-allowed" || name === "service-not-allowed") {
      return "Microphone blocked. Allow it in the browser, or type.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError" || name === "audio-capture") {
      return "No microphone found. Type instead.";
    }
    return "Microphone did not start. Type instead.";
  }

  function ensureMic() {
    var media = typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (!media) return Promise.reject({ name: "NotFoundError" });
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      return true;
    });
  }

  function wireMic() {
    var btn = document.getElementById("guide-mic");
    var status = document.getElementById("guide-micstatus");
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var session = 0;
    var boot = 0;
    var active = null;
    var stopping = false;

    function setMic(state, message) {
      recOn = state === "listening";
      btn.dataset.state = state;
      btn.classList.toggle("live", state === "listening");
      btn.classList.toggle("err", state === "error");
      btn.setAttribute("aria-pressed", state === "listening" ? "true" : "false");
      var label = state === "listening" ? "Listening" : state === "error" ? "Mic error" : "Mic";
      btn.textContent = label;
      if (status) {
        status.dataset.state = state;
        status.textContent = message || (state === "listening" ? "Listening" : state === "error" ? "Mic error. Type instead." : "Mic idle");
      }
    }

    function releaseMic() {
      micHold = false;
      stopping = false;
      active = null;
      pump();
    }

    function hushJune() {
      micHold = true;
      queue = [];
      speaking = false;
      paintTalking(false);
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    }

    if (!Rec) {
      setMic("error", "This browser cannot turn speech into text. Type instead.");
      btn.addEventListener("click", function () {
        primeFromGesture();
        var input = document.getElementById("guide-input");
        if (input) input.focus();
        ensureMic().then(function () {
          setMic("error", "This browser can hear you, but not turn it into text. Type instead.");
        }).catch(function (err) {
          setMic("error", micErrorMessage(err));
        });
      });
      return;
    }

    setMic("idle", "Mic idle");

    function begin() {
      var ticket = ++boot;
      if (active) {
        stopping = true;
        try { active.onend = null; active.onerror = null; active.onresult = null; } catch (e) {}
        try { active.abort(); } catch (e2) {}
        active = null;
        releaseMic();
      }
      setMic("listening", "Asking for the microphone");
      ensureMic().then(function () {
        if (ticket !== boot) return;
        openRec();
      }).catch(function (err) {
        if (ticket !== boot) return;
        releaseMic();
        setMic("error", micErrorMessage(err));
      });
    }

    function openRec() {
      var rec;
      try { rec = new Rec(); } catch (e) {
        setMic("error", "Microphone did not start. Type instead.");
        return;
      }
      var mine = ++session;
      var finalText = "";
      var sent = false;
      var hardError = false;
      stopping = false;
      active = rec;
      hushJune();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onresult = function (event) {
        if (mine !== session) return;
        var text = "";
        for (var i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText = (finalText + " " + event.results[i][0].transcript).trim();
        }
        var input = document.getElementById("guide-input");
        if (input) {
          input.value = (finalText || text || "").slice(0, 500);
          refreshGuideCount();
        }
      };
      rec.onerror = function (event) {
        if (mine !== session) return;
        var code = event && event.error;
        if (code === "aborted" || code === "no-speech") return;
        if (code === "not-allowed" || code === "service-not-allowed") {
          hardError = true;
          setMic("error", "Microphone blocked. Allow it in the browser, or type.");
        } else if (code === "audio-capture") {
          hardError = true;
          setMic("error", "No microphone found. Type instead.");
        } else {
          hardError = true;
          setMic("error", micErrorMessage({ name: code }));
        }
      };
      rec.onend = function () {
        if (mine !== session) return;
        active = null;
        if (hardError) { releaseMic(); return; }
        var heard = (finalText || "").trim();
        var input = document.getElementById("guide-input");
        if (!heard && input) heard = (input.value || "").trim();
        releaseMic();
        if (stopping && !heard) {
          setMic("idle", "Mic idle");
          return;
        }
        if (!heard) {
          setMic("idle", "Didn't catch that. Tap mic or type.");
          return;
        }
        if (sent) return;
        sent = true;
        if (input) input.value = "";
        setMic("idle", "Heard you.");
        sendText(heard);
      };
      try {
        rec.start();
        setMic("listening", "Listening");
      } catch (err) {
        try { rec.abort(); } catch (e2) {}
        active = null;
        releaseMic();
        setMic("error", "Microphone was busy. Tap again.");
      }
    }

    btn.addEventListener("click", function () {
      primeFromGesture();
      if (recOn && active) {
        stopping = true;
        boot += 1;
        session += 1;
        try { active.abort(); } catch (e) { try { active.stop(); } catch (e2) {} }
        active = null;
        releaseMic();
        setMic("idle", "Mic idle");
        return;
      }
      begin();
    });
  }

  function endSceneTravel(game) {
    game.blockScenesUntilMile = (game.miles || 0) + 70;
    game.blockNetworkUntilMile = (game.miles || 0) + 50;
    game.phase = "travel";
    game.scene = null;
  }

  return {
    NAME: NAME,
    ROLE: ROLE,
    modelEndpoint: null,
    setModelEndpoint: function (url) { modelEndpoint = url || null; },
    blankMemory: blankMemory,
    reply: reply,
    makeRumor: makeRumor,
    rumorBeat: rumorBeat,
    welcome: welcome,
    briefEvent: briefEvent,
    reactResult: reactResult,
    recapLine: recapLine,
    snapshot: snapshot,
    parseJune: parseJune,
    routeSceneText: routeSceneText,
    scriptedAnswer: scriptedAnswer,
    exportMemory: function () {
      try { return JSON.parse(JSON.stringify(memory)); } catch (e) { return null; }
    },
    importMemory: function (next) {
      if (!next || typeof next !== "object") return;
      memory = next;
      paintMood();
    },
    attach: function (game, nextMemory) {
      bound = game;
      if (nextMemory) memory = nextMemory;
      paintMood();
    },
    sideQuestLine: sideQuestLine,
    rateComment: rateComment,
    styleForClip: styleForClip,
    styleById: styleById,
    moodOf: moodOf,
    askModel: askModel,
    mount: mount,
    onRun: onRun,
    onScreen: onScreen,
    onChange: onChange,
    onRecap: onRecap,
    say: say,
    noteChoice: noteChoice,
    voiceNpc: voiceNpc,
    sendText: sendText,
    endSceneTravel: endSceneTravel,
    openRumor: openRumor,
    primeFromGesture: primeFromGesture,
    avatarSvg: avatarSvg,
    get memory() { return memory; },
    get voiceOn() { return voiceOn; }
  };
});
