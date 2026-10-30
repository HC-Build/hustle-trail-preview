(function (root) {
  var PARTNERS = [
    { id: "remy", name: "Remy Cho", role: "Co-founder candidate", hair: "#2a2118", shirt: "#3d6b4f", perk: "Ships the ugly first version with you.", drama: "Remy told a group chat you hoard the cap table." },
    { id: "ida", name: "Ida Voss", role: "Mentor", hair: "#6b3a2a", shirt: "#24556b", perk: "One warm intro, no slide theater.", drama: "Ida stopped returning notes. June says you talked over her." },
    { id: "samir", name: "Samir Adeyemi", role: "Angel", hair: "#1a1a1a", shirt: "#8a4b24", perk: "A friendly wire with no board seat.", drama: "Samir now calls you a tire fire at dinners." },
    { id: "noel", name: "Noel Park", role: "VC", hair: "#3a3028", shirt: "#3a3058", perk: "Noel opens one door at Lumen Bench.", drama: "Noel is telling partners you bluff numbers." },
    { id: "casey", name: "Casey Lin", role: "Design partner", hair: "#222", shirt: "#6b2450", perk: "Casey puts the product in front of their team.", drama: "Casey warned peers that onboarding is a maze." },
    { id: "jordan", name: "Jordan Hale", role: "Channel partner", hair: "#4a3020", shirt: "#1f4d3a", perk: "Jordan puts you in a newsletter that people open.", drama: "Jordan parked your integration behind a rival." },
    { id: "nia", name: "Nia Okoye", role: "Frenemy founder", hair: "#1a120c", shirt: "#c4491d", perk: "A truce. Glassbird stops swinging for a month.", drama: "Nia quoted you out of context. It traveled." },
    { id: "helena", name: "Helena Ibarra", role: "Board skeptic", hair: "#503828", shirt: "#243044", perk: "Helena defends you when the room gets sharp.", drama: "Helena asked for a search. June is furious." }
  ];

  function ensure(game) {
    if (!game.network) {
      game.network = PARTNERS.map(function (p) {
        return { id: p.id, name: p.name, role: p.role, hair: p.hair, shirt: p.shirt, trust: 0, met: false, perk: false, drama: false, perkText: p.perk, dramaText: p.drama };
      });
    }
    if (!game.networkSeen) game.networkSeen = [];
    if (game.blockNetworkUntilMile == null) game.blockNetworkUntilMile = 0;
  }

  function byId(game, id) {
    ensure(game);
    for (var i = 0; i < game.network.length; i++) if (game.network[i].id === id) return game.network[i];
    return null;
  }

  function levelName(trust) {
    if (trust >= 85) return "Ride or die";
    if (trust >= 65) return "Solid";
    if (trust >= 45) return "Warm";
    if (trust >= 25) return "Wary";
    if (trust > 0) return "Cold";
    return "Unknown";
  }

  function applyTrust(game, id, delta) {
    var p = byId(game, id);
    if (!p) return null;
    if (!p.met) {
      p.met = true;
      if (p.trust < 28) p.trust = 28;
    }
    p.trust = Math.max(0, Math.min(100, p.trust + (delta || 0)));
    var out = { partner: p, perk: null, drama: null };
    if (p.trust >= 64 && !p.perk) {
      p.perk = true;
      out.perk = perkBeat(p);
    }
    if (p.trust <= 20 && p.met && !p.drama) {
      p.drama = true;
      out.drama = { title: p.name, choice: "Relationship cracked", effects: { morale: -6 }, text: p.dramaText, log: p.name + " is now a problem.", tone: "bad" };
    }
    if (p.trust >= 40) p.drama = false;
    return out;
  }

  function perkBeat(p) {
    var effects = { morale: 4 };
    if (p.id === "remy") effects = { traction: 12, morale: 6 };
    else if (p.id === "ida") effects = { runway: 8, traction: 4 };
    else if (p.id === "samir") effects = { runway: 10 };
    else if (p.id === "noel") effects = { unicorn: 8, traction: 4 };
    else if (p.id === "casey") effects = { traction: 16 };
    else if (p.id === "jordan") effects = { traction: 10, runway: 4 };
    else if (p.id === "nia") effects = { traction: 8, morale: 4 };
    else if (p.id === "helena") effects = { morale: 8, equity: 2 };
    return { title: p.name + " is in", choice: "Perk", effects: effects, text: p.perkText, log: p.name + " unlocked a perk.", tone: "good" };
  }

  function metCount(game) {
    ensure(game);
    return game.network.filter(function (p) { return p.met; }).length;
  }

  var ENCOUNTERS = [
    {
      id: "equity-talk", mile: 220, kind: "meeting", partnerId: "remy",
      title: "The equity talk",
      place: "A borrowed conference room",
      brief: "Remy Cho will not quit a real job for a wink. Listen, then find a third shape for the pie. Do not open with a number.",
      rounds: [
        { line: "If I leave, I need to feel like a founder. Not employee twelve with a sticker.", options: [
          { id: "listen", label: "Listen", detail: "Let them finish the fear.", break: 26, trust: 8, note: "You let the silence do the work." },
          { id: "push", label: "Push back", detail: "Titles are cheap.", break: 4, trust: -8, note: "Remy hears a boss." },
          { id: "third", label: "Vest it to the work", detail: "Ownership arrives as you ship, not as a mood.", break: 34, trust: 10, effects: { equity: -4 }, note: "A pie that grows only if the wagon moves." }
        ]},
        { line: "What if we disagree in month eight? Who breaks the tie?", options: [
          { id: "listen", label: "Promise harmony", detail: "We will just be adults.", break: 6, trust: 2, note: "Remy has heard that before." },
          { id: "push", label: "I break the tie", detail: "Someone has to.", break: 28, trust: 4, note: "They wanted a spine. They also flinched." },
          { id: "third", label: "A written kill rule", detail: "If trust drops, a mentor breaks the tie once.", break: 30, trust: 8, note: "Ida is not in the room, but the idea is." }
        ]},
        { line: "So. What number do I tell my partner tonight?", options: [
          { id: "listen", label: "Ask what they need", detail: "Then sit with it.", break: 14, trust: 6, note: "You still did not name a number." },
          { id: "push", label: "Name a low one", detail: "Take it or leave it.", break: 2, trust: -10, note: "The room gets small." },
          { id: "third", label: "Equal on the hard years", detail: "Same slice until the seed, then it vests.", break: 36, trust: 12, effects: { equity: -6, morale: 4 }, note: "Not painless. Clear." }
        ]}
      ],
      success: { effects: { traction: 12, morale: 8 }, trust: 8, text: "Remy will jump. Not today. After one more paycheck. You built a founder, not a favor." },
      fail: { effects: { morale: -4 }, trust: -8, teach: "You learned Remy will not bluff about rent. Next time, trade certainty for a vest, not a speech.", text: "Remy leaves the number blank. The door does not slam. It also does not close behind them." }
    },
    {
      id: "term-sheet", mile: 560, kind: "meeting", partnerId: "noel",
      title: "Noel's term sheet",
      place: "A glass room that smells like citrus",
      brief: "Noel Park smiles like the terms are weather. They are not. Listen for the trap, push once, then invent a third paper.",
      rounds: [
        { line: "We move fast. The note is standard. Everyone signs standard.", options: [
          { id: "listen", label: "Ask them to read it aloud", detail: "Standard hides in the quiet clauses.", break: 24, trust: 6, note: "Noel respects the request and hates it." },
          { id: "push", label: "Call it predatory", detail: "Out loud.", break: 6, trust: -6, note: "True, maybe. Early." },
          { id: "third", label: "Mark three lines only", detail: "You will live with the rest.", break: 32, trust: 8, note: "A short fight. Adults do this." }
        ]},
        { line: "The pro rata is how we stay married. Without it I am a tourist.", options: [
          { id: "listen", label: "Hear the fear", detail: "They want the next round.", break: 10, trust: 4, note: "Useful. Not a yes." },
          { id: "push", label: "Cap it hard", detail: "Tourists pay for hotels.", break: 26, trust: 2, note: "Noel leans back. Still here." },
          { id: "third", label: "Pro rata if they help", detail: "Intros earned, not printed.", break: 30, trust: 10, note: "Skin in the game that is not just a slide." }
        ]},
        { line: "Do we have a deal, or a philosophy club?", options: [
          { id: "listen", label: "Stall for counsel", detail: "Buy a night.", break: 12, trust: 2, note: "Fair. Noel checks out a little." },
          { id: "push", label: "Sign now", detail: "Speed is the brand.", break: 4, trust: -8, effects: { runway: 8, equity: -8 }, flags: ["raised"], note: "Cash, and a clause you did not read twice." },
          { id: "third", label: "Sign the kind version", detail: "Their speed, your three lines.", break: 34, trust: 10, effects: { runway: 6, equity: -4 }, flags: ["raised"], note: "Still a raise. A cleaner one." }
        ]}
      ],
      success: { effects: { unicorn: 6, morale: 4 }, trust: 6, text: "Noel will send a redline, not a myth. You did not win. You did not kneel." },
      fail: { effects: { morale: -3 }, trust: -6, teach: "You learned Noel uses the word standard as a blanket. Next time, make them lift it.", text: "The note goes back in the bag. June exhales like she paid for that." }
    },
    {
      id: "skeptic", mile: 900, kind: "meeting", partnerId: "casey",
      title: "{p1} is not impressed",
      place: "Their office, fluorescent and honest",
      brief: "{p1} sat in on the call. The customer has been burned by demos. Listen for the scar, then build the third offer.",
      rounds: [
        { line: "I have seen this movie. The demo works. Tuesday does not.", options: [
          { id: "listen", label: "Ask about Tuesday", detail: "The real day, not the pitch day.", break: 28, trust: 8, note: "{p1} writes down where the last tool died." },
          { id: "push", label: "Our Tuesday is different", detail: "Promise the scar away.", break: 4, trust: -6, note: "{p1} has a bingo card for this." },
          { id: "third", label: "Sit inside their Tuesday", detail: "You will watch one real shift.", break: 32, trust: 10, effects: { morale: -2 }, note: "Uncomfortable. Correct." }
        ]},
        { line: "My team will not adopt a toy. Who is on the hook when it breaks?", options: [
          { id: "listen", label: "Name the fear", detail: "They do not want to be heroes.", break: 12, trust: 4, note: "You heard it." },
          { id: "push", label: "Your team is the problem", detail: "Adoption is a choice.", break: 8, trust: -8, note: "{p1} goes quiet. The customer does too." },
          { id: "third", label: "We eat the first month", detail: "If it breaks, it is our pager.", break: 30, trust: 10, effects: { runway: -4 }, note: "Skin. They notice." }
        ]},
        { line: "So why should I bet my reputation on a wagon?", options: [
          { id: "listen", label: "Ask what a small bet is", detail: "Let them design the pilot.", break: 16, trust: 6, note: "They pick ten people, not the company." },
          { id: "push", label: "Because we are hungry", detail: "Hunger is not a SLA.", break: 2, trust: -6, note: "{p1} almost smiles. Not kindly." },
          { id: "third", label: "A pilot with a kill date", detail: "Thirty days, then they can walk.", break: 36, trust: 12, effects: { traction: 8 }, note: "A door with a handle on their side." }
        ]}
      ],
      success: { effects: { traction: 14 }, trust: 8, text: "{p1} gets the customer to try ten seats. Not love. A trial with a calendar. That is how design partners start." },
      fail: { effects: { traction: -2 }, trust: -8, teach: "You learned this customer buys relief, not vision. Next time, own the pager. {p1} already knew.", text: "No pilot. {p1} keeps the deck to show the team what not to buy." }
    },
    {
      id: "board-push", mile: 1680, kind: "meeting", partnerId: "helena",
      title: "Helena pushes back",
      place: "The board call, camera slightly too close",
      brief: "Helena Ibarra does not hate you. She hates fog. If you perform, she will cut. Listen, take one hit, then offer a third metric.",
      rounds: [
        { line: "Your update is a mood. Where is the number that would scare you?", options: [
          { id: "listen", label: "Name the scary number", detail: "Churn, out loud.", break: 26, trust: 8, note: "Helena writes it down like a gift." },
          { id: "push", label: "Mood is the leading indicator", detail: "Trust the room.", break: 4, trust: -8, note: "She does not." },
          { id: "third", label: "One number, one story", detail: "The scare, then the cause.", break: 34, trust: 10, note: "Adult update." }
        ]},
        { line: "I can get a buyer on the phone this week. Why are we pretending we are not tired?", options: [
          { id: "listen", label: "Ask what tired costs", detail: "Do not swing yet.", break: 12, trust: 4, note: "She wants an exit more than you do." },
          { id: "push", label: "We are not for sale", detail: "Flat.", break: 22, trust: 2, note: "Clear. A little proud." },
          { id: "third", label: "A date to revisit", detail: "Not this week. After the next post.", break: 30, trust: 8, note: "You did not kneel and you did not sneer." }
        ]},
        { line: "Give me a reason to defend you when I hang up.", options: [
          { id: "listen", label: "Ask what she needs to hear", detail: "Then say only that.", break: 18, trust: 8, note: "She wants a customer sentence." },
          { id: "push", label: "Defend yourself", detail: "List the work.", break: 6, trust: -4, note: "A speech. She wanted a shield." },
          { id: "third", label: "Hand her a sentence", detail: "{p1} has the pilot in ten seats. That is the shield.", break: 36, trust: 12, effects: { morale: 4 }, note: "Specific. She can repeat it." }
        ]}
      ],
      success: { effects: { morale: 8, equity: 2 }, trust: 8, text: "Helena will defend you on the next call. Not forever. For this month, which is a lifetime on a board." },
      fail: { effects: { morale: -6 }, trust: -10, teach: "You learned Helena wants a sentence she can repeat, not a mood. Next time, give her the scare and the shield.", text: "She does not start a search. She also does not save you. June calls that a draw you lost." }
    },
    {
      id: "rooftop", mile: 640, kind: "meetup",
      title: "Rooftop, too much wind",
      place: "A founder meetup above a loud street",
      brief: "Rare air. People perform up here. Stay long enough to meet one real person, not the whole roof.",
      line: "The wind eats half the pitches. Ida Voss is by the door, actually listening. Nia is holding court by the heater.",
      options: [
        { label: "Stand with Ida", detail: "One mentor, low volume.", partnerId: "ida", trust: 16, effects: { runway: 4, traction: 4 }, text: "Ida gives you a name to write down. Not a sermon.", june: "You picked the quiet door. I approve, which I will deny later." },
        { label: "Spar with Nia", detail: "Public, risky, memorable.", partnerId: "nia", trust: 8, effects: { unicorn: 6, morale: -2 }, text: "The roof laughs. Nia does not leave angry. She leaves interested.", june: "A show. Useful if you can stand the quote." },
        { label: "Leave with one card", detail: "Before the third drink.", partnerId: "ida", trust: 10, effects: { morale: 4 }, text: "You go home with a name and your judgment.", june: "Discipline. Boring. Correct." }
      ]
    },
    {
      id: "hackathon", mile: 1160, kind: "meetup",
      title: "Hackathon, 3 a.m.",
      place: "A room of cold pizza and bright monitors",
      brief: "All-nighter energy. Jordan Hale ships other people's tools into newsletters. Do not pitch the room. Build one ugly thing.",
      line: "Someone yells that sleep is a feature. Jordan is debugging a stranger's signup flow like it is a sport.",
      options: [
        { label: "Pair with Jordan", detail: "Build the channel, not the myth.", partnerId: "jordan", trust: 18, effects: { traction: 12 }, text: "By sunrise there is a list, not a vibe. Jordan will send it.", june: "You smelled like coffee and competence. Disgusting. Proud." },
        { label: "Demo to the room", detail: "Loud. Maybe hollow.", effects: { traction: 6, morale: -3, unicorn: 4 }, text: "Applause. A few real follows. June counts the real ones on one hand.", june: "Claps are not customers. A few might be." },
        { label: "Go home", detail: "Keep the team alive.", effects: { morale: 6 }, text: "You leave the building. The wagon still has people in it.", june: "Rest is a strategy. I forget to say that." }
      ]
    },
    {
      id: "diner", mile: 1420, kind: "meetup",
      title: "Diner whiteboard",
      place: "A booth, eggs, a napkin that became a plan",
      brief: "Late, honest, a little greasy. Samir Adeyemi pretends he came for the hash browns. He came to see if you are real.",
      line: "Samir flips the napkin. 'Draw the customer. Not the market. The person.'",
      options: [
        { label: "Draw {p1}'s Tuesday", detail: "A real scar, a real person on your wagon.", partnerId: "samir", trust: 16, effects: { traction: 6, unicorn: 4 }, text: "Samir adds a number in the corner. Not a term sheet. A path.", june: "You drew a human. He put the pen down. That is respect." },
        { label: "Draw the huge market", detail: "The slide he did not ask for.", partnerId: "samir", trust: -6, effects: { morale: -2 }, text: "He nods the way people nod at weather. No wire.", june: "You brought a canyon to a booth. He wanted a person." },
        { label: "Ask him what he regrets", detail: "Mentors love a true question.", partnerId: "samir", trust: 12, effects: { morale: 4, runway: 4 }, text: "He tells a short story about selling early. June goes quiet, which is loud.", june: "He and I have the same scar. You asked instead of performing. Good." }
      ]
    },
    {
      id: "afterparty", mile: 1860, kind: "meetup",
      title: "Conference afterparty",
      place: "Too loud, too late, name tags in pockets",
      brief: "The rare room. Deals are not made here. People are. Nia is nearby, softer than on stage.",
      line: "The badge scanner is off. Nia Okoye says, quieter, 'Today was a costume. What did you actually learn?'",
      options: [
        { label: "Tell her one true miss", detail: "Vulnerable. On purpose.", partnerId: "nia", trust: 18, effects: { unicorn: 8, morale: 2 }, text: "Nia shares one of hers. A truce, not a merger.", june: "You skipped the costume. She noticed. I noticed." },
        { label: "Recruit the room", detail: "Hungry. A little much.", effects: { traction: 4, morale: -4 }, partnerId: "jordan", trust: 4, text: "You collect three maybes and a headache.", june: "The afterparty is not a funnel. You used it like one." },
        { label: "Introduce {p1} to Ida", detail: "Make the network do the work.", partnerId: "casey", trust: 10, effects: { traction: 8 }, text: "Two people you earned put their heads together. You are not the center. Good.", june: "Look at you, being a connector. I might retire." }
      ]
    }
  ];

  function next(game) {
    if (!game || game.status !== "playing") return null;
    ensure(game);
    if (game.blockNetworkUntilMile && game.miles < game.blockNetworkUntilMile) return null;
    for (var i = 0; i < ENCOUNTERS.length; i++) {
      var enc = ENCOUNTERS[i];
      if (game.miles >= enc.mile && game.networkSeen.indexOf(enc.id) < 0) return enc;
    }
    return null;
  }

  function fillValue(game, value) {
    var ht = root.HT;
    if (ht && ht.partyFill) return ht.partyFill(game || { cofounders: [] }, value);
    return value;
  }

  function begin(a, b) {
    var game = b ? a : null;
    var enc = b || a;
    var def = fillValue(game, enc);
    return {
      def: def,
      round: 0,
      breakthrough: enc.kind === "meeting" ? 24 : 0,
      done: false,
      note: "",
      success: null
    };
  }

  function chooseMeeting(game, optionId) {
    var meeting = game.meeting;
    var def = meeting.def;
    var round = def.rounds[meeting.round];
    var opt = null;
    round.options.forEach(function (o) { if (o.id === optionId) opt = o; });
    if (!opt) return null;
    meeting.breakthrough = Math.max(0, Math.min(100, meeting.breakthrough + opt.break));
    meeting.note = opt.note;
    meeting.pending = opt;
    meeting.effects = meeting.effects || {};
    if (opt.effects) {
      Object.keys(opt.effects).forEach(function (k) {
        meeting.effects[k] = (meeting.effects[k] || 0) + opt.effects[k];
      });
    }
    if (opt.flags) meeting.flags = (meeting.flags || []).concat(opt.flags);
    meeting.trustDelta = (meeting.trustDelta || 0) + (opt.trust || 0);
    meeting.round += 1;
    if (meeting.round >= def.rounds.length) {
      meeting.done = true;
      meeting.success = meeting.breakthrough >= 78;
    }
    return meeting;
  }

  function finishMeeting(game) {
    var meeting = game.meeting;
    var def = meeting.def;
    var pack = meeting.success ? def.success : def.fail;
    var trust = (meeting.trustDelta || 0) + (pack.trust || 0);
    var effects = {};
    Object.keys(meeting.effects || {}).forEach(function (k) { effects[k] = meeting.effects[k]; });
    Object.keys(pack.effects || {}).forEach(function (k) { effects[k] = (effects[k] || 0) + pack.effects[k]; });
    return {
      title: def.title,
      partnerId: def.partnerId,
      trust: trust,
      beat: {
        title: def.title,
        choice: meeting.success ? "Breakthrough" : "No breakthrough",
        effects: effects,
        flags: (meeting.flags && meeting.flags.length) ? meeting.flags : (pack.flags || null),
        text: pack.text,
        log: def.title + (meeting.success ? " broke open." : " stalled."),
        tone: meeting.success ? "good" : "bad"
      },
      teach: pack.teach || "",
      june: meeting.success
        ? "Breakthrough. I felt it and I hate that I felt it. " + pack.text
        : "No breakthrough. " + (pack.teach || pack.text)
    };
  }

  function chooseMeetup(game, index) {
    var meeting = game.meeting;
    var opt = meeting.def.options[index];
    if (!opt) return null;
    meeting.pick = index;
    meeting.done = true;
    meeting.success = (opt.trust || 0) > 0 && !!opt.partnerId;
    meeting.note = opt.text;
    meeting.breakthrough = meeting.success ? 88 : 36;
    return meeting;
  }

  function finishMeetup(game) {
    var meeting = game.meeting;
    var opt = meeting.def.options[meeting.pick];
    return {
      title: meeting.def.title,
      partnerId: opt.partnerId || null,
      trust: opt.trust || 0,
      beat: {
        title: meeting.def.title,
        choice: opt.label,
        effects: opt.effects || {},
        text: opt.text,
        log: meeting.def.title + ": " + opt.label + ".",
        tone: (opt.trust || 0) < 0 ? "bad" : "good"
      },
      teach: "",
      june: opt.june || opt.text
    };
  }

  root.HT_NET = {
    PARTNERS: PARTNERS,
    ENCOUNTERS: ENCOUNTERS,
    ensure: ensure,
    byId: byId,
    levelName: levelName,
    applyTrust: applyTrust,
    metCount: metCount,
    next: next,
    begin: begin,
    chooseMeeting: chooseMeeting,
    finishMeeting: finishMeeting,
    chooseMeetup: chooseMeetup,
    finishMeetup: finishMeetup
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.HT_NET;
})(typeof window !== "undefined" ? window : globalThis);
