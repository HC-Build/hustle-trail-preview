(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HT_SCENES = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  var GATES = [
    { mile: 90, id: "coffee" },
    { mile: 480, id: "zoom" },
    { mile: 780, id: "meetup" },
    { mile: 1050, id: "kiln" },
    { mile: 1500, id: "board" }
  ];

  var SCENES = {
    coffee: {
      id: "coffee",
      setting: "coffee",
      title: "Coffee, not a date",
      place: "A narrow shop called Second Cup North",
      brief: "Nia Okoye from Glassbird is holding a table like she pays the rent. She does not. Walk in. Do not compliment the logo.",
      npc: { id: "nia", name: "Nia Okoye", role: "Founder, Glassbird", voice: "nia", initials: "NO" },
      line: "You are still on the wagon product? We shipped Glassbird Notes on Tuesday. The room clapped. I clapped back, which is leadership.",
      replies: [
        {
          label: "Ask what actually broke",
          detail: "Manners, then a little theft of the lesson.",
          keys: ["broke", "learn", "onboard", "what broke", "ask"],
          june: "yes",
          effects: { traction: 6, morale: 2 },
          npcLine: "Onboarding. People vanish on screen two. Do not print that. I will know.",
          juneLine: "Manners and theft. My favorite mix. Write down screen two.",
          story: { glassbird: "respect" }
        },
        {
          label: "Call the logo a bird having a feeling",
          detail: "Petty. Memorable. She will keep the receipt.",
          keys: ["logo", "bird", "petty", "insult", "feeling"],
          june: "meh",
          effects: { morale: 4, traction: -2 },
          npcLine: "Wow. Enjoy the desert. I will send you the launch post.",
          juneLine: "I would have been meaner. You are growing, which is disgusting and correct.",
          story: { glassbird: "feud" }
        },
        {
          label: "Offer a partnership",
          detail: "June hates this. She lost Puddle to a handshake.",
          keys: ["partner", "together", "merge", "team up"],
          june: "no",
          effects: { equity: -3, traction: 4 },
          risk: { chance: 0.35, effects: { morale: -6, traction: -4 }, npcLine: "We will circle back, which means never. You just donated a week.", juneLine: "Partnership is how Puddle died. I am not mad. I am taking notes for my grave." },
          npcLine: "Send a note. Maybe a pilot. Do not call it a partnership out loud.",
          juneLine: "You shook the hand. I am still riding. I am also judging the hand.",
          story: { glassbird: "talks" }
        }
      ]
    },
    zoom: {
      id: "zoom",
      setting: "zoom",
      title: "Twelve minutes with Lumen Bench",
      place: "A Zoom that started without you",
      brief: "Lumen Bench. Priya talks. Ellis stares like the number insulted his family. Do not share your whole screen. I can see the other tab.",
      npc: { id: "priya", name: "Priya Shah", role: "Partner, Lumen Bench", voice: "priya", initials: "PS" },
      cast: [
        { name: "Priya Shah", initials: "PS", live: true },
        { name: "Ellis Ward", initials: "EW", live: false },
        { name: "You", initials: "You", live: false },
        { name: "June (muted)", initials: "JH", live: false }
      ],
      line: "We have twelve minutes. What is the company, and why is the wagon still in the desert?",
      replies: [
        {
          label: "Pitch the customer who paid",
          detail: "No new owner. June approves, quietly.",
          keys: ["customer", "paid", "revenue", "pilot", "real"],
          june: "yes",
          effects: { traction: 8, morale: 3 },
          npcLine: "Ellis just nodded, which for him is a parade. Send the one-pager. No deck theater.",
          juneLine: "You talked like a person with a customer. I might survive this trip.",
          story: { lumen: "respect" }
        },
        {
          label: "Take the small check",
          detail: "Runway now. Your slice shrinks. June will be unbearable.",
          keys: ["check", "raise", "money", "wire", "take it"],
          june: "no",
          flags: ["raised"],
          effects: { runway: 16, equity: -12, morale: -2 },
          npcLine: "We will send a note. It is small on purpose. Ellis likes founders slightly afraid.",
          juneLine: "Cash is a lullaby. I sang it at Puddle. I woke up working for the buyers.",
          story: { lumen: "raised" }
        },
        {
          label: "Leave the meeting",
          detail: "Keep the company. Spend the reputation.",
          keys: ["leave", "walk", "no", "pass", "bye"],
          june: "yes",
          effects: { morale: 5, equity: 1, traction: -1 },
          npcLine: "Priya blinks. Ellis says nothing, which is also a no. The tile goes dark.",
          juneLine: "Walking out is a personality. Use it twice and it is just a brand.",
          story: { lumen: "walked" }
        }
      ]
    },
    meetup: {
      id: "meetup",
      setting: "meetup",
      title: "Name tags and a rumor",
      place: "A founder meetup in a room that used to be a bank",
      brief: "Alex Kim is two sips in and already leaking. Some of it is true. I will not tell you which, because I am a problem.",
      npc: { id: "alex", name: "Alex Kim", role: "Founder, North Ferry", voice: "alex", initials: "AK" },
      line: "Do not quote me. Glassbird either missed payroll or Nia is method-acting poverty. Also Lumen is supposedly writing checks, which is what people say when they want to feel important.",
      replies: [
        {
          label: "Chase the payroll rumor",
          detail: "Act on it now. It might be smoke. June knows, and may not say.",
          keys: ["payroll", "rumor", "chase", "engineer", "recruit"],
          june: "meh",
          rumor: "payroll"
        },
        {
          label: "Ask for an intro, then build",
          detail: "Use the room. Do not spend the night in it.",
          keys: ["intro", "build", "product", "work"],
          june: "yes",
          effects: { traction: 7, morale: 3 },
          npcLine: "Fine. I will intro you to one tired engineer. Do not pitch them at the snack table.",
          juneLine: "Look at you, being a company in a party. I am pretending not to be proud.",
          story: { meetup: "worked" }
        },
        {
          label: "Spread a hotter version",
          detail: "June loves this and you should not.",
          keys: ["gossip", "spread", "hotter", "tell everyone"],
          june: "no",
          effects: { traction: 4, morale: -4 },
          risk: { chance: 0.5, effects: { equity: -5, morale: -4 }, npcLine: "Nia just texted me a screenshot of you. Amazing work.", juneLine: "The rumor grew a mouth and it knows your name. I am thrilled and you are in trouble." },
          npcLine: "Bold. I am leaving before it attaches to me.",
          juneLine: "You fed the room. The room is a stomach. We will see what it digests.",
          story: { meetup: "loud" }
        }
      ]
    },
    kiln: {
      id: "kiln",
      setting: "hall",
      title: "Kiln demo day",
      place: "A conference hall with one working microphone",
      brief: "Kiln demo day. Ninety seconds, a judge who has heard pitches since breakfast, and a person live-posting your face. Pick the true thing.",
      npc: { id: "rin", name: "Rin Abe", role: "Host, Kiln", voice: "rin", initials: "RA" },
      line: "You are on. The microphone hates everyone equally. Tell them what the wagon does before the badge lanyards stage a coup.",
      replies: [
        {
          label: "Demo the one thing that works",
          detail: "Small, true, a little dull. June wants this.",
          keys: ["demo", "works", "show", "product", "one thing"],
          june: "yes",
          effects: { traction: 14, morale: -1, runway: -2 },
          npcLine: "The judge stopped scrolling. That is the whole trophy. Get off the stage while you are ahead.",
          juneLine: "You showed the thing. I have seen founders show a dream and a font. This was better.",
          story: { kiln: "demo" }
        },
        {
          label: "Tell a bigger story than you have",
          detail: "The room might buy it. June will not.",
          keys: ["vision", "bigger", "billion", "story", "hype"],
          june: "no",
          effects: { morale: 1 },
          risk: { chance: 0.42, effects: { traction: 16, morale: 4 }, npcLine: "They are clapping. Some of them will forget by the escalator. Take the ones who do not.", juneLine: "The balloon flew. Do not tell me you believed it too." },
          npcLine: "Polite applause, the kind that ends careers. The judge is already reading the next name.",
          juneLine: "You sold a story you do not have inventory for. I have done it. The echo is embarrassing.",
          story: { kiln: "hype" }
        },
        {
          label: "Hand the mic to a cofounder",
          detail: "Share the scare. The team remembers.",
          keys: ["cofounder", "mic", "share", "them"],
          june: "yes",
          effects: { morale: 8, traction: 5 },
          npcLine: "Two people on one story. The hall got quieter, which is respect.",
          juneLine: "You shared the mic. I forget that is allowed. Do it again when you are scared.",
          story: { kiln: "shared" }
        }
      ]
    },
    board: {
      id: "board",
      setting: "board",
      title: "The monthly board call",
      place: "A table that is really a rectangle on a slide",
      brief: "Maren Holt wants a date, a number, and your weekends. There is a buyer breathing on line two. I sold Puddle to a buyer. I am not neutral.",
      npc: { id: "maren", name: "Maren Holt", role: "Board, independent", voice: "maren", initials: "MH" },
      line: "Update me in plain speech. And tell me if the buyer on line two gets a meeting or a no.",
      replies: [
        {
          label: "Give the boring true numbers",
          detail: "June's favorite kind of courage.",
          keys: ["numbers", "truth", "boring", "honest", "metrics"],
          june: "yes",
          effects: { equity: 3, morale: 3, runway: -2 },
          npcLine: "Thank you. I can work with boring. The buyer can wait in the hallway with the plant.",
          juneLine: "True numbers. I could kiss the cap table. I will not. Keep going.",
          story: { board: "honest" }
        },
        {
          label: "Let the buyer in",
          detail: "Cash and attention. June will take this personally, then stay.",
          keys: ["buyer", "sell", "meeting", "offer", "exit"],
          june: "no",
          effects: { runway: 10, equity: -8, morale: -6 },
          npcLine: "They will send a range, not a promise. Your team will hear about it before you announce it.",
          juneLine: "I did this. The holiday card still comes. I do not open it. I am still on your wagon, so do not get poetic.",
          story: { board: "buyer" }
        },
        {
          label: "Say the company is not for sale",
          detail: "The road gets prouder and a little meaner.",
          keys: ["not for sale", "no", "independent", "keep", "refuse"],
          june: "yes",
          flags: ["snubbed"],
          effects: { morale: 8, runway: -4, traction: 3 },
          npcLine: "Noted. I will tell them the door is shut. They will call it confidence or a mistake.",
          juneLine: "Good. Own the wagon. I will gossip about anyone who tries to buy the wheels.",
          story: { board: "independent" }
        }
      ]
    }
  };

  function next(game) {
    if (!game || game.status !== "playing") return null;
    if (game.blockScenesUntilMile && game.miles < game.blockScenesUntilMile) return null;
    var seen = game.scenesSeen || [];
    for (var i = 0; i < GATES.length; i++) {
      if (game.miles >= GATES[i].mile && seen.indexOf(GATES[i].id) < 0) return SCENES[GATES[i].id];
    }
    return null;
  }

  function resolveReply(game, scene, reply) {
    var beat = {
      title: scene.title,
      choice: reply.label,
      effects: Object.assign({}, reply.effects || {}),
      flags: reply.flags || null,
      story: reply.story || null,
      tags: ["press"],
      log: scene.title + ": " + reply.label,
      tone: reply.june === "no" ? "warn" : "good"
    };
    var npcLine = reply.npcLine;
    var juneLine = reply.juneLine;
    var text = npcLine;
    if (reply.risk && game.rng() < (reply.risk.chance || 0)) {
      beat.effects = Object.assign({}, reply.effects || {}, reply.risk.effects || {});
      if (reply.risk.npcLine) npcLine = reply.risk.npcLine;
      if (reply.risk.juneLine) juneLine = reply.risk.juneLine;
      text = npcLine;
      beat.tone = "bad";
    }
    beat.text = text;
    return { beat: beat, npcLine: npcLine, juneLine: juneLine, june: reply.june, rumor: reply.rumor || null };
  }

  function interpret(scene, text) {
    var t = String(text || "").toLowerCase();
    var best = -1;
    var score = 0;
    scene.replies.forEach(function (reply, i) {
      var s = 0;
      (reply.keys || []).forEach(function (k) {
        if (t.indexOf(k) >= 0) s += 2;
      });
      if (s > score) { score = s; best = i; }
    });
    if (best >= 0) return { index: best };
    return {
      custom: true,
      beat: {
        title: scene.title,
        choice: "Said it your way",
        text: "The room nods like it understood.",
        effects: { morale: 1, traction: /customer|user|pay|ship/.test(t) ? 3 : 0 },
        log: scene.title + ": improvised",
        tone: "warn"
      },
      npcLine: "We will pretend that was a plan.",
      juneLine: "I heard you. Next time pick a lane I can mock with precision. Loyalty is not the same as clarity.",
      june: "meh"
    };
  }

  return {
    GATES: GATES,
    SCENES: SCENES,
    next: next,
    resolveReply: resolveReply,
    interpret: interpret
  };
});
