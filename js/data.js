(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HT_DATA = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  var NAMES = ["Jane", "Alex", "Sam", "Taylor", "Jordan", "Riley", "Casey", "Morgan", "Avery", "Quinn", "Reese", "Drew"];

  var TRAITS = [
    { id: "shipper", name: "Ships on Friday", blurb: "Breakdowns cost less runway." },
    { id: "tweeter", name: "Terminally online", blurb: "Press events swing harder, up or down." },
    { id: "operator", name: "Ex-consultant", blurb: "Daily burn is lower. Every day costs 1 extra morale." },
    { id: "closer", name: "Can sell ice", blurb: "Traction gains come in bigger." },
    { id: "stoic", name: "Unflappable", blurb: "Morale losses are smaller." },
    { id: "lawyer", name: "Reads the terms", blurb: "Equity losses shrink. Hype gains shrink too." }
  ];

  var QUIT_REASONS = [
    "left to become a plumber in Phoenix",
    "moved to Bali for spiritual alignment",
    "got poached by a company with snacks",
    "had a breakdown and joined a cult with a deck",
    "became a short-video influencer instead",
    "ghosted the team for a solo project",
    "went back to a job with a chair",
    "had an existential crisis about the market size",
    "took a sabbatical that never ended",
    "said the group chat was bad for their nervous system"
  ];

  var QUOTES = [
    "We are pre-revenue and post-confidence.",
    "The market-size slide is a wish with a font.",
    "A VC will circle back. That is an orbit, not a check.",
    "Hot dog. Not hot dog. The rest is branding.",
    "If the demo works twice, write it down before it changes its mind.",
    "Runway is optimism with a calendar.",
    "Your moat is a group chat and a prayer.",
    "Ship something small enough to apologize for.",
    "The incubator has a kimono and no cap table.",
    "Someone will call this a platform. Let them.",
    "Do not refresh the inbox. Refresh the product.",
    "A down round is the trail going uphill.",
    "Payroll is a recurring jump scare.",
    "Ten users is a crowd if none of them are related to you.",
    "You can survive a bad week. You cannot invoice one."
  ];

  var HELP = [
    "Win by reaching The Exit at mile 2000 and choosing how the company ends.",
    "You lose if runway hits 0, if your equity hits 0, or if every cofounder quits.",
    "The wagon rolls on its own. Pace trades miles for burn and morale. Events stop you until you choose.",
    "Every button lists the tradeoff before you commit. Percentages are the odds, already adjusted for your party.",
    "Goals: First Users (400), Product-Market Fit (800), Seed Crossing (1200), The Board (1600), The Exit (2000).",
    "Score counts miles, traction, equity, runway, morale, living cofounders, milestones, and a speed bonus if you win.",
    "Cautious pays 0.8x and hurts less. Founder pays 1x. Unhinged pays 1.5x and hurts more.",
    "Taking investor money keeps the tank full and blocks the Quiet Wealth ending. Best score is saved in this browser."
  ];

  function pick(list, rng) {
    return list[Math.floor(rng() * list.length)];
  }

  function shuffle(list, rng) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function living(game) {
    return game.cofounders.filter(function (c) { return c.alive; });
  }

  function victim(game, rng) {
    var folks = living(game);
    return folks.length ? pick(folks, rng) : null;
  }

  var HOTDOGS = [
    { name: "a hot dog", hot: true },
    { name: "a corn dog", hot: true },
    { name: "a bratwurst in a bun", hot: true },
    { name: "a foot-long sub", hot: true },
    { name: "your burn chart", hot: false },
    { name: "a term sheet", hot: false },
    { name: "a Kubernetes cluster", hot: false },
    { name: "an NFT of a hot dog", hot: false },
    { name: "the product roadmap", hot: false },
    { name: "a vape pen", hot: false }
  ];

  var TWEETS = [
    ["ship the MVP", "ship the MV-Pee"],
    ["raise a seed round", "raise a weed round"],
    ["find product-market fit", "find product-market fist"],
    ["disrupt the market", "disrupt the muppet"],
    ["close the Series A", "close the Serious A"],
    ["iterate quickly", "irritate quickly"]
  ];

  var RIVERS = ["Seed Chasm", "Dilution River", "Cap Table Canyon", "Fundraise Falls", "Equity Rapids"];

  function quizPay(correct) {
    if (correct) {
      return {
        effects: { runway: 10, traction: 6, morale: 3 },
        success: "Right. He nods like a man whose app finally compiled."
      };
    }
    return {
      effects: { runway: -6, traction: -8, morale: -4 },
      success: "Wrong. He puts a fish in the metaphor and leaves."
    };
  }

  var EVENTS = [
    {
      id: "spaghetti",
      segments: ["early", "users", "pmf"],
      tags: ["breakdown"],
      weight: 3,
      title: "Spaghetti in the repo",
      text: "Someone pushed utils_final_FINAL2. The wagon lists to one side.",
      choices: [
        {
          label: "Refactor before you roll",
          detail: "You lose cash and gain a wagon that steers.",
          effects: { runway: -8, morale: 8, traction: 2 },
          success: "The file is gone. So is a week. The wheels agree with each other again."
        },
        {
          label: "Ship the spaghetti",
          detail: "Users get something today. The bug gets a vote.",
          effects: { traction: 10, morale: -3 },
          risk: { chance: 0.4, effects: { traction: -8, equity: -6 }, text: "It face-planted during a demo. A stranger filmed the sauce." },
          success: "It shipped. Nobody has opened the file since, which is a kind of peace."
        }
      ]
    },
    {
      id: "server-night",
      segments: ["users", "pmf", "seed", "board"],
      tags: ["breakdown"],
      weight: 3,
      title: "Pager at 2 a.m.",
      text: "The server picked tonight to meet its maker. Customers are writing poetry about it.",
      choices: [
        {
          label: "Fix it now",
          detail: "Sleep is cheaper than a second outage, until it is not.",
          effects: { runway: -6, morale: -4, traction: 4 },
          success: "You patched it before sunrise. The poetry stopped. The team did not."
        },
        {
          label: "Let it page until morning",
          detail: "Rest the people. Gamble the customers.",
          effects: { morale: 6 },
          risk: { chance: 0.45, effects: { traction: -10, runway: -6 }, text: "Morning came with a public status page and fewer users." },
          success: "It healed itself, or the customers went back to sleep. You will take it."
        }
      ]
    },
    {
      id: "deprecated",
      segments: ["pmf", "seed", "board"],
      tags: ["breakdown"],
      weight: 2,
      title: "The dependency died",
      text: "A library you trusted got archived on a Friday. The post says 'good luck out there.'",
      choices: [
        {
          label: "Migrate properly",
          detail: "Expensive, boring, and the wagon stops wobbling.",
          effects: { runway: -12, equity: 4, morale: 3 },
          success: "You migrated. Nothing is on fire. This is the whole achievement."
        },
        {
          label: "Pin it and pray",
          detail: "Free until the day it is not.",
          effects: { traction: 4, morale: -2 },
          risk: { chance: 0.42, replaces: true, effects: { equity: -10, runway: -8, morale: -6 }, text: "The pin snapped. A stranger's changelog owns your Friday." },
          success: "The pin held. You and the archived maintainer are briefly coworkers."
        }
      ]
    },
    {
      id: "burnout",
      segments: ["early", "users", "pmf", "seed", "board"],
      tags: ["team"],
      weight: 3,
      title: "Somebody stops blinking",
      build: function (game, rng) {
        var who = victim(game, rng);
        var name = who ? who.name : "A cofounder";
        return {
          text: name + " has not blinked since Tuesday and is calling it 'focus.'",
          choices: [
            {
              label: "Call a rest day",
              detail: "Burn cash so " + name + " stays.",
              effects: { runway: -10, morale: 12 },
              success: name + " slept. The roadmap can wait outside like a dog."
            },
            {
              label: "Push through",
              detail: "Keep the miles. " + name + " might not.",
              effects: { traction: 8, morale: -6 },
              quit: { chance: 0.34, cofounderId: who && who.id },
              success: name + " stayed upright. Call it hustle if you need a word."
            },
            {
              label: "Offsite with snacks",
              detail: "A smaller bill, a little dignity.",
              effects: { runway: -6, morale: 8, equity: 2 },
              success: "You rented a room with windows. " + name + " remembered the product."
            }
          ]
        };
      }
    },
    {
      id: "offer",
      segments: ["users", "pmf", "seed", "board"],
      tags: ["team"],
      weight: 2,
      title: "A competing offer",
      build: function (game, rng) {
        var who = victim(game, rng);
        var name = who ? who.name : "A cofounder";
        return {
          text: name + " has a letter from a company that owns a cereal bar. They look tempted.",
          choices: [
            {
              label: "Match the snacks, not the title",
              detail: "Morale up, runway down, they stay.",
              effects: { runway: -8, morale: 8, equity: -2 },
              success: name + " stayed for the work and, fine, the snacks."
            },
            {
              label: "Wish them well",
              detail: "You keep the cash and lose the person.",
              effects: { runway: 4, morale: -8 },
              quit: { chance: 1, cofounderId: who && who.id },
              success: "You shook hands. The wagon has an empty seat and a slightly fuller tank."
            },
            {
              label: "Guilt trip",
              detail: "Ugly, cheap, and it can blow up.",
              effects: { morale: -4 },
              risk: { chance: 0.4, effects: { morale: -8 }, quit: { chance: 0.75, cofounderId: who && who.id }, text: "The guilt curdled. " + name + " packed a backpack." },
              success: name + " stayed, and will mention this in six months."
            }
          ]
        };
      }
    },
    {
      id: "competitor",
      segments: ["users", "pmf", "seed", "board"],
      tags: ["market"],
      weight: 3,
      title: "They shipped your slide",
      text: "A competitor launched the feature you have been 'almost done' with. Their landing page has better lighting.",
      choices: [
        {
          label: "Ship a messy version today",
          detail: "Traction now, quality later, maybe never.",
          effects: { traction: 12, morale: -4, runway: -3 },
          risk: { chance: 0.3, effects: { traction: -6, equity: -4 }, text: "The messy version bit a customer. The lighting did not save you." },
          success: "You shipped. It is ugly and it is real, which beats pretty and pending."
        },
        {
          label: "Double down on the thing they skipped",
          detail: "Slower, sharper, a little proud.",
          effects: { runway: -8, equity: 4, traction: 4, morale: 3 },
          success: "You ignored their launch post and finished the part they were afraid of."
        }
      ]
    },
    {
      id: "press",
      segments: ["users", "pmf", "seed"],
      tags: ["press"],
      weight: 2,
      title: "A reporter is bored",
      text: "A tech reporter wants twenty minutes and a quote they can take out of context. The context is you.",
      choices: [
        {
          label: "Do the interview",
          detail: "Attention is traction, and it spends the afternoon.",
          effects: { traction: 14, runway: -4, morale: -2 },
          risk: { chance: 0.28, effects: { equity: -6, morale: -6 }, text: "The headline kept the joke and lost the product." },
          success: "The piece was fair enough. Three strangers tried the product and one stayed."
        },
        {
          label: "Stay heads down",
          detail: "No spotlight. The work continues.",
          effects: { equity: 3, morale: 4, traction: 2 },
          success: "You declined. The reporter found a founder who wanted it more."
        }
      ]
    },
    {
      id: "four-day",
      segments: ["early", "users", "pmf"],
      tags: ["team"],
      weight: 2,
      title: "The four-day question",
      text: "The team wants Fridays dark. The roadmap wants Fridays bloody. Both have a point.",
      choices: [
        {
          label: "Give them Fridays",
          detail: "Morale and equity culture up. Miles get heavier.",
          effects: { morale: 10, equity: 3, runway: -4, traction: -2 },
          success: "Fridays went quiet. Mondays got sharper. You will pretend this was strategy."
        },
        {
          label: "Keep the grind",
          detail: "More output, colder group chat.",
          effects: { traction: 8, runway: 3, morale: -10 },
          quit: { chance: 0.18 },
          success: "You kept Fridays. Output ticked up. So did the sighs."
        }
      ]
    },
    {
      id: "pivot-ai",
      segments: ["early", "users", "pmf", "seed"],
      tags: ["market", "press"],
      weight: 2,
      title: "Just add a model",
      text: "Investors have stopped returning notes that do not mention a model. Your product currently does a normal useful thing.",
      choices: [
        {
          label: "Pivot the homepage, not the product",
          detail: "Hype without a rewrite. It can sour.",
          effects: { traction: 8, morale: -3 },
          risk: { chance: 0.35, effects: { equity: -8, traction: -4 }, text: "A customer noticed the homepage and the product disagree." },
          success: "The new headline got clicks. The product underneath is still the product."
        },
        {
          label: "Actually rebuild around it",
          detail: "Real bet. Real bill. Real chance it matters.",
          effects: { runway: -14, morale: -4 },
          risk: { chance: 0.4, replaces: true, effects: { traction: 18, runway: -6, morale: 4 }, text: "The rebuild worked. A user called it magic, which you will allow." },
          success: "You spent the month and the model is a demo. The old product pays the rent."
        },
        {
          label: "Refuse the costume",
          detail: "Less buzz, more self-respect.",
          effects: { equity: 5, morale: 6, traction: -2 },
          success: "You left the buzzword off the page. Two buyers said thanks for the quiet."
        }
      ]
    },
    {
      id: "api-bill",
      segments: ["pmf", "seed", "board"],
      tags: ["money"],
      weight: 2,
      title: "The model sends an invoice",
      text: "The API bill arrived with the confidence of a landlord. It is larger than your personality.",
      choices: [
        {
          label: "Pay it",
          detail: "The lights stay on. The tank does not.",
          effects: { runway: -16, traction: 4, morale: 2 },
          success: "You paid. The product still answers. Your stomach does too."
        },
        {
          label: "Rebuild the expensive part",
          detail: "Equity of focus, less cash burn later, pain now.",
          effects: { equity: -4, runway: -6, morale: -4, traction: 6 },
          success: "You ripped out the pricey call. It is dumber and it is yours."
        },
        {
          label: "Rate-limit the customers",
          detail: "Protect cash. Annoy the people paying you.",
          effects: { runway: 4, traction: -8, morale: -3 },
          success: "You capped usage. Power users wrote you polite hate mail."
        }
      ]
    },
    {
      id: "yc",
      segments: ["early", "users", "pmf"],
      tags: ["money"],
      weight: 1,
      once: true,
      title: "The application portal",
      text: "You fed a form into the void. The void accepts about 1 in 100 wagons and sends a nice note to the rest.",
      choices: [
        {
          label: "Refresh the inbox",
          detail: "1% chance the tank refills. Otherwise a polite no and a bruise.",
          effects: { runway: -8, morale: -6 },
          jackpot: {
            chance: 0.01,
            absolute: { runway: 100 },
            effects: { traction: 28, morale: 12, equity: -6 },
            flags: ["raised"],
            text: "Accepted. For one loud afternoon the desert looks like a brochure. They take a slice."
          },
          success: "Rejected. They will keep you updated, which is fiction with better kerning."
        },
        {
          label: "Close the tab and build",
          detail: "No lottery. The product gets the hour.",
          effects: { runway: -2, traction: 10, morale: 4 },
          success: "You shipped instead of refreshing. The inbox stayed quiet. The build did not."
        }
      ]
    },
    {
      id: "angel",
      segments: ["early", "users", "pmf"],
      tags: ["money"],
      weight: 2,
      once: true,
      title: "An angel in the parking lot",
      text: "Someone who sold a company in 2014 wants to put money in. They also want to 'just be helpful' in the chat.",
      choices: [
        {
          label: "Take the check",
          detail: "Runway now. A smaller company, and Quiet Wealth closes.",
          effects: { runway: 18, equity: -10, morale: -2 },
          flags: ["raised"],
          success: "The wire landed. So did a calendar invite titled 'quick thoughts.'"
        },
        {
          label: "Say no and keep rolling",
          detail: "You stay whole. The tank does not grow.",
          effects: { equity: 3, morale: 5, traction: 4 },
          success: "You declined. They seemed relieved to go find a founder who says yes faster."
        }
      ]
    },
    {
      id: "hunt-launch",
      segments: ["early", "users"],
      tags: ["press"],
      weight: 2,
      title: "Launch day, sort of",
      text: "An orange-site moderator might feature you if you post before lunch. Or you will be a link in a trench.",
      choices: [
        {
          label: "Post it",
          detail: "A shot at traction. Half the time it is crickets.",
          effects: { runway: -2, morale: -2 },
          risk: { chance: 0.55, replaces: true, effects: { traction: 16, morale: 6, runway: 4 }, text: "You sat on the front page for an hour. The wagon collected strangers." },
          success: "The post sank. Your mom upvoted it, which you asked her not to do."
        },
        {
          label: "Show ten people yourself",
          detail: "Smaller, ruder, more honest.",
          effects: { traction: 8, morale: 3, runway: -1 },
          success: "You watched ten people get lost in the same button. Then you moved the button."
        }
      ]
    },
    {
      id: "incubator",
      segments: ["early", "users", "pmf", "seed"],
      tags: ["press"],
      weight: 2,
      title: "The incubator blocks the road",
      text: "A man in a borrowed kimono will not move the wagon until you hear about the company he already sold. The story gets longer if you let it.",
      choices: [
        {
          label: "Hear the whole thing",
          detail: "Hype rubs off. The afternoon does not come back.",
          effects: { traction: 8, runway: -6, morale: -2 },
          success: "You lost an hour and gained a story you will tell wrong later."
        },
        {
          label: "Interrupt him",
          detail: "Save the hour. He will tell people you are no fun.",
          effects: { runway: 3, equity: -3, morale: 2 },
          success: "You cut him off. The kimono departed in a cloud of vape and grievance."
        },
        {
          label: "Post the rant",
          detail: "Even odds it travels. Even odds it travels back over you.",
          effects: { runway: -8, equity: -4, morale: -6 },
          risk: {
            chance: 0.5,
            replaces: true,
            effects: { runway: 10, traction: 12, morale: 2 },
            text: "The thread traveled. People arrived to dunk and a few stayed to buy."
          },
          success: "You posted it. He posted back, and his post won. The thread remembers you as the setup."
        }
      ]
    },
    {
      id: "hotdog",
      segments: ["early", "users", "pmf", "seed", "board"],
      tags: ["press"],
      weight: 2,
      title: "Hot dog or not",
      timed: 9,
      build: function (game, rng) {
        var item = pick(HOTDOGS, rng);
        var yes = quizPay(item.hot);
        var no = quizPay(!item.hot);
        yes.conceal = true;
        no.conceal = true;
        yes.label = "Hot dog";
        no.label = "Not hot dog";
        yes.detail = item.name;
        no.detail = "Be honest. He can smell fear and condiments.";
        return {
          text: "A founder on a video call holds up " + item.name + " and waits. Right answer pays runway and traction. Wrong answer drops both. You have a few seconds.",
          choices: [yes, no],
          timeout: {
            effects: { runway: -4, morale: -4 },
            success: "You froze. He decided for you, incorrectly, and ended the call."
          }
        };
      }
    },
    {
      id: "pact",
      segments: ["pmf", "seed", "board"],
      tags: ["money"],
      weight: 1,
      once: true,
      title: "A calm person in the server fire",
      text: "The rack is smoking. The only one who understands it is serene, which is worse. They offer a pact.",
      choices: [
        {
          label: "Trade equity for uptime",
          detail: "Give up 12% and the fire becomes a story.",
          effects: { equity: -12, runway: 22, morale: 2 },
          success: "The fire becomes someone else's theology. You have cash and a smaller company."
        },
        {
          label: "Gamble a smaller slice",
          detail: "8% equity. Even odds the pact pays or keeps the change.",
          effects: { equity: -8 },
          risk: {
            chance: 0.5,
            replaces: true,
            effects: { equity: -8, runway: 26, morale: 4 },
            text: "The dark end of the rack pays out. You do not ask what it cost."
          },
          success: "The dark end of the rack keeps the change. You are poorer in spirit and in equity."
        },
        {
          label: "Decline and reboot yourself",
          detail: "Keep the slice. Keep the outage.",
          effects: { morale: 4, traction: 3, runway: -4 },
          success: "You kept your soul and your outage. Both are intact."
        }
      ]
    },
    {
      id: "bank",
      segments: ["seed", "board"],
      tags: ["money"],
      weight: 2,
      once: true,
      timed: 12,
      title: "The bank says temporarily",
      text: "Your bank sends a note that uses the word temporarily too many times. The group chat is already a museum of panic.",
      timeout: {
        effects: { runway: -10, morale: -6 },
        success: "You did nothing while the word temporarily did laps. The fee for waiting posted anyway."
      },
      choices: [
        {
          label: "Move the money today",
          detail: "A haircut in fees. The team sleeps.",
          effects: { runway: -8, morale: 8, equity: 2 },
          success: "You moved it. The new bank has worse coffee and a working login."
        },
        {
          label: "Wait for the all-clear",
          detail: "Often fine. When it is not, it is a lesson.",
          effects: { morale: -2, traction: 2 },
          risk: {
            chance: 0.4,
            replaces: true,
            effects: { runway: -18, morale: -10, equity: -4 },
            text: "Temporarily meant the money is now a case study."
          },
          success: "It was a drill. You aged four years and kept the balance."
        },
        {
          label: "Tell customers in public",
          detail: "Trust as a strategy. Some people hate the honesty.",
          effects: { runway: -6, traction: 8, morale: -3 },
          success: "You posted the plan. Half your users respected it. Half refreshed their cards."
        }
      ]
    },
    {
      id: "copycat",
      segments: ["pmf", "seed", "board"],
      tags: ["market"],
      weight: 2,
      title: "A clone with a nicer font",
      text: "Someone cloned the product over a weekend and priced it like a dare. Their mascot is a smiling coin.",
      choices: [
        {
          label: "Differentiate",
          detail: "Spend to be the version worth keeping.",
          effects: { runway: -10, traction: 8, equity: 3 },
          success: "You shipped the part they could not clone in a weekend. A few people noticed."
        },
        {
          label: "Drop price to match",
          detail: "Keep users, bruise the margin, morale sours.",
          effects: { traction: 10, runway: -8, morale: -5 },
          success: "You matched them. The coin mascot blinked first. Your margin did too."
        },
        {
          label: "Offer to join forces",
          detail: "A weird peace. Sometimes a knife.",
          effects: { equity: -6, morale: -2 },
          risk: {
            chance: 0.45,
            replaces: true,
            effects: { runway: 14, traction: 10, equity: -8 },
            text: "They folded in. You own less and cover more ground."
          },
          success: "They smiled, cloned one more screen, and ghosted the thread."
        }
      ]
    },
    {
      id: "churn",
      segments: ["users", "pmf", "seed"],
      tags: ["market"],
      weight: 3,
      title: "They left without a scene",
      text: "Churn is up. The exit survey says 'confusing' and, from one poet, 'cold.'",
      choices: [
        {
          label: "Fix onboarding",
          detail: "The unglamorous work that keeps people.",
          effects: { runway: -8, traction: 10, morale: 2 },
          success: "The first five minutes got kinder. A few people stayed past them."
        },
        {
          label: "Email a human",
          detail: "Slow, warm, and it does not scale, which is the point.",
          effects: { morale: 6, traction: 6, runway: -3 },
          success: "You wrote to churned users like a person. Three wrote back."
        },
        {
          label: "Raise prices on the way out",
          detail: "Squeeze whoever remains. Some will remain angry.",
          effects: { runway: 10, traction: -6, morale: -4 },
          success: "The loyal few paid more. The graph looks brave and a little mean."
        }
      ]
    },
    {
      id: "tweet",
      segments: ["early", "users", "pmf", "seed", "board"],
      tags: ["press"],
      weight: 2,
      timed: 8,
      title: "Post before you think",
      build: function (game, rng) {
        var pair = pick(TWEETS, rng);
        var decoy = pick(TWEETS.filter(function (p) { return p[0] !== pair[0]; }), rng);
        var options = shuffle([
          { text: pair[0], correct: true },
          { text: pair[1], correct: false },
          { text: decoy[1], correct: false }
        ], rng);
        return {
          text: "Your thumb is hovering. The right line brings traction. The wrong line burns runway. Even a correct send gets mangled by the phone about 30% of the time. Pick the line you meant: you have seconds.",
          timeout: {
            effects: { runway: -6, morale: -3 },
            success: "Time ran out. The phone posted a half-eaten sentence and the timeline did the rest."
          },
          choices: options.map(function (opt) {
            if (opt.correct) {
              return {
                label: opt.text,
                detail: "Send this.",
                conceal: true,
                effects: { traction: 14, runway: 4, morale: 2 },
                risk: {
                  chance: 0.3,
                  replaces: true,
                  effects: { traction: 5, runway: -5, morale: -3 },
                  text: "The phone 'fixed' it. You went viral for the wrong sentence."
                },
                success: "Sent. A few of the right people saw the line you actually wrote."
              };
            }
            return {
              label: opt.text,
              detail: "Send this.",
              conceal: true,
              effects: { runway: -6, morale: -4, traction: 2 },
              success: "You posted the bit. The timeline made you the bit."
            };
          })
        };
      }
    },
    {
      id: "bad-hire",
      segments: ["early", "users", "pmf"],
      tags: ["team"],
      weight: 2,
      title: "The charming interview",
      text: "A candidate charmed everyone and has not shipped since the charm. The trial week is up.",
      choices: [
        {
          label: "Cut it now",
          detail: "Painful, clean, a little runway back.",
          effects: { morale: -3, runway: 4, equity: 2 },
          success: "You ended it kindly and fast. The repo exhaled."
        },
        {
          label: "Give it another month",
          detail: "Hope is a payroll strategy.",
          effects: { runway: -8, morale: -2 },
          risk: { chance: 0.55, effects: { morale: -8, traction: -4 }, text: "The month produced slides about the work." },
          success: "They found a gear. One real feature landed, which pays for the doubt."
        }
      ]
    },
    {
      id: "lease",
      segments: ["early", "seed", "board"],
      tags: ["money"],
      weight: 2,
      title: "An office with a plant",
      text: "A lease appears, as leases do, pretending to be a personality. There is a plant. The plant has a rider.",
      choices: [
        {
          label: "Sign it",
          detail: "A place to point at. A bill that does not blink.",
          effects: { morale: 8, runway: -12, traction: 3 },
          success: "You have a door. People came to the door. The plant is already dramatic."
        },
        {
          label: "Stay in the garage",
          detail: "Keep the cash. Keep the chill.",
          effects: { runway: 4, equity: 2, morale: -3 },
          success: "You stayed. The wifi is personal and the neighbors are not your board."
        }
      ]
    },
    {
      id: "feature-2014",
      segments: ["users", "pmf", "seed"],
      tags: ["market"],
      weight: 2,
      title: "The request from 2014",
      text: "Your biggest user wants a feature that solves their company and nobody else's. They pay like they know it.",
      choices: [
        {
          label: "Build their snowflake",
          detail: "Cash and focus, traded for a weird product.",
          effects: { runway: 12, traction: -2, equity: -3, morale: -3 },
          success: "You built it. They renewed. The roadmap grew a barnacle."
        },
        {
          label: "Sell the no",
          detail: "Risk the account. Keep the product.",
          effects: { equity: 4, morale: 4 },
          risk: { chance: 0.35, effects: { runway: -10, traction: -6 }, text: "They walked. The barnacle went with them, and so did the invoice." },
          success: "They stayed anyway. The no made you look like you have a spine."
        }
      ]
    },
    {
      id: "influencer",
      segments: ["users", "pmf", "seed"],
      tags: ["press"],
      weight: 2,
      title: "Equity for a story",
      text: "A person with an audience will mention you. They would like a little of the company for the mention, 'just a token.'",
      choices: [
        {
          label: "Pay in equity",
          detail: "Traction rented with a slice. Counts as raising.",
          effects: { equity: -7, traction: 14, morale: -2 },
          flags: ["raised"],
          success: "They posted. Strangers arrived. Quiet Wealth, if you wanted it, just left the chat."
        },
        {
          label: "Pay a normal invoice",
          detail: "Cash for a spike, company intact.",
          effects: { runway: -10, traction: 12 },
          success: "You paid like a business. The spike was real and it faded like spikes do."
        },
        {
          label: "No thanks",
          detail: "Keep both cash and slice.",
          effects: { equity: 2, morale: 2, traction: -1 },
          success: "You declined. They mentioned someone else by Thursday."
        }
      ]
    },
    {
      id: "side-project",
      segments: ["users", "pmf", "seed"],
      tags: ["team"],
      weight: 2,
      title: "A secret second startup",
      build: function (game, rng) {
        var who = victim(game, rng);
        var name = who ? who.name : "A cofounder";
        return {
          text: name + " has a side project. They call it a nights-and-weekends thing. The commit times say otherwise.",
          choices: [
            {
              label: "Make them choose",
              detail: "Clear air, real chance they pick the other wagon.",
              effects: { morale: -2 },
              quit: { chance: 0.28, cofounderId: who && who.id },
              success: name + " shut the other repo. The main one got their evenings back."
            },
            {
              label: "Ignore it",
              detail: "Keep the peace and the split attention.",
              effects: { traction: -3, morale: -4, runway: -2 },
              success: "You said nothing. The side project grew a logo."
            },
            {
              label: "Fold it into the company",
              detail: "Messy, possible upside, equity chatter.",
              effects: { equity: -4, traction: 8, morale: 3 },
              success: "You pulled the side project in. It might be a feature. It might be a hobby with a badge."
            }
          ]
        };
      }
    },
    {
      id: "prepaid",
      segments: ["early", "users", "pmf", "seed"],
      tags: ["money"],
      weight: 3,
      title: "A customer with a calendar",
      text: "A real customer asks how to pay. This is so rare you check the email headers for a prank.",
      choices: [
        {
          label: "Invoice the year up front",
          detail: "Cash without giving up the company.",
          effects: { runway: 11, traction: 4, morale: 4 },
          success: "They paid for a year like a person with a budget. You did not sell a slice to get it."
        },
        {
          label: "Keep it monthly",
          detail: "Less cash today, more trust, easier to cancel.",
          effects: { runway: 4, traction: 8, morale: 5, equity: 1 },
          success: "Monthly it is. They can leave, which means they might also stay."
        }
      ]
    },
    {
      id: "regulator",
      segments: ["board"],
      tags: ["money"],
      weight: 2,
      timed: 12,
      title: "A letter with a seal",
      text: "A regulator noticed you. The letter is polite in the way fences are polite.",
      timeout: {
        effects: { equity: -6, runway: -6, morale: -4 },
        success: "You missed the window to answer. They answered for you, expensively."
      },
      choices: [
        {
          label: "Hire someone who has done this",
          detail: "Cash for a cleaner record.",
          effects: { runway: -12, equity: 4, morale: 3 },
          success: "A specialist answered in the right dialect. The seal went quiet."
        },
        {
          label: "Answer it yourself",
          detail: "Cheap, slow, and you might say a true unhelpful thing.",
          effects: { runway: -3, morale: -4 },
          risk: { chance: 0.4, effects: { equity: -8, runway: -6 }, text: "You were honest in the wrong paragraph." },
          success: "Your plain-language reply worked. Someone on the other side was tired too."
        }
      ]
    },
    {
      id: "river",
      segments: ["users", "pmf", "seed", "board"],
      tags: ["river"],
      weight: 3,
      title: "The river",
      build: function (game, rng) {
        var name = pick(RIVERS, rng);
        var late = game.miles >= 1200;
        var ford = late ? 0.48 : 0.36;
        return {
          title: name,
          text: "The trail dead-ends at " + name + ". The water is term sheets. Some of them bite. You have to cross to keep the miles.",
          choices: [
            {
              label: "Ford it",
              detail: "Fast. A bad step costs equity, and sometimes a cofounder.",
              effects: { traction: 8, morale: -2 },
              risk: {
                chance: ford,
                replaces: true,
                effects: { equity: -14, runway: -8, morale: -6 },
                quit: { chance: late ? 0.28 : 0.16 },
                text: "You slipped. A page of preferences went over the side with someone's patience."
              },
              success: "You made it across. Your shoes will never be the same, and they were not great before."
            },
            {
              label: "Caulk the wagon and float",
              detail: "Slower than fording, kinder than the ferry.",
              effects: { traction: 4, runway: -3 },
              risk: {
                chance: late ? 0.28 : 0.18,
                replaces: true,
                effects: { equity: -8, runway: -6, morale: -4 },
                text: "A seam opened. You lost supplies and a little dignity to the current."
              },
              success: "The wagon floated like a nervous duck. You reached the far bank damp and intact."
            },
            {
              label: "Wait for better light",
              detail: "Burns time and a little cash. The odds improve.",
              effects: { runway: -7, morale: 4, traction: 2 },
              risk: { chance: 0.1, effects: { runway: -6 }, text: "The light never came. You paid for the wait anyway." },
              success: "You waited. The crossing was dull, which is the best kind."
            },
            {
              label: "Pay the ferry",
              detail: "Humiliating, dry, and not a raise.",
              effects: { runway: -14, traction: 3, morale: 2 },
              success: "The ferryman took the cash and did not make eye contact. You are across."
            }
          ]
        };
      }
    },
    {
      id: "naming",
      segments: ["early"],
      tags: ["press"],
      weight: 2,
      title: "The name is taken",
      build: function (game) {
        return {
          text: game.company + " is already a dentist, a yacht, or a crypto coin. The trail will not start calling you something else unless you do.",
          choices: [
            {
              label: "Buy the ugly domain",
              detail: "Pay up. Be findable.",
              effects: { runway: -6, traction: 6 },
              success: "You own a name you can say on a call without spelling it twice. Mostly."
            },
            {
              label: "Add a trendy suffix",
              detail: "Free-ish, and the internet may roast it.",
              effects: { traction: 5, morale: -2 },
              risk: { chance: 0.3, effects: { equity: -4, morale: -4 }, text: "A stranger turned the new name into a joke with better timing than yours." },
              success: "The suffix worked. Nobody loves it. Everybody can type it."
            },
            {
              label: "Keep the garage name",
              detail: "Confusing, proud, free.",
              effects: { equity: 3, morale: 4, traction: -2 },
              success: "You kept the name. Search is a mess and the story is better."
            }
          ]
        };
      }
    }
  ];

  function buildMilestone(id) {
    if (id === "users") {
      return {
        id: "users",
        milestone: true,
        title: "First Users",
        tags: ["launch"],
        text: "Ten people clicked the thing. Two might be related to you. This is the first goal on the map, and it will not wait.",
        choices: [
          {
            label: "Post where the nerds are",
            detail: "A public launch. Attention, and a little shame if it flops.",
            effects: { traction: 14, morale: -2, runway: -3 },
            success: "Strangers arrived. One of them was not your cousin. First Users is real."
          },
          {
            label: "Beg people you know",
            detail: "Warmer, smaller, the team feels it.",
            effects: { traction: 7, morale: 7, runway: -1 },
            success: "Friends showed up and, awkwardly, told the truth. You have users."
          },
          {
            label: "Buy the clicks",
            detail: "Spend runway for a crowd. Some crowds are bots.",
            effects: { runway: -14, traction: 18 },
            risk: { chance: 0.38, effects: { traction: -12 }, text: "The clicks were bots in a trench coat. The bill was human." },
            success: "The ads brought people who stayed long enough to matter."
          }
        ]
      };
    }
    if (id === "pmf") {
      return {
        id: "pmf",
        milestone: true,
        title: "Product-Market Fit",
        tags: ["market"],
        text: "A stranger used it twice without being asked. Do not spook them. This stop is the second goal: prove someone comes back.",
        choices: [
          {
            label: "Talk to them until it is awkward",
            detail: "The slow path to a product people mean.",
            effects: { traction: 12, morale: -5, runway: -3 },
            success: "You interviewed until the silence got long. Then you knew what to fix."
          },
          {
            label: "Build the one request",
            detail: "Narrow, costly, and it keeps this user.",
            effects: { runway: -11, traction: 8, equity: 3, morale: 2 },
            success: "You built the one thing they asked for. They came back on purpose."
          },
          {
            label: "Build the vision instead",
            detail: "Likely a miss. A real chance they wanted the weird version.",
            effects: { traction: -4, morale: -4 },
            risk: {
              chance: 0.42,
              replaces: true,
              effects: { traction: 20, morale: 6, runway: -2 },
              text: "They loved the thing you refused to water down. Fit, against the odds."
            },
            success: "The vision confused them. They did not come back. The slide still looks brave."
          }
        ]
      };
    }
    if (id === "seed") {
      return {
        id: "seed",
        milestone: true,
        title: "Seed Crossing",
        tags: ["money"],
        text: "The river here is money. You can pitch live, take a calm note, or refuse and keep the company whole. Raising blocks Quiet Wealth.",
        choices: [
          {
            label: "Pitch it live",
            detail: "One swing of the needle. Green pays best. Red is a story they tell. A hit counts as raising.",
            mini: "pitch",
            success: ""
          },
          {
            label: "Take the safe note",
            detail: "Sure runway, a real slice gone, Quiet Wealth off the table.",
            effects: { runway: 16, equity: -16, traction: 2, morale: -3 },
            flags: ["raised"],
            success: "The note is signed. The tank is heavier and the company is less yours."
          },
          {
            label: "Bootstrap the crossing",
            detail: "No new investors. The next miles are on you.",
            effects: { runway: -4, equity: 5, traction: 8, morale: -3 },
            flags: ["bootstrapped"],
            success: "You crossed without a new owner. The wagon is lighter and more yours."
          }
        ]
      };
    }
    if (id === "board") {
      return {
        id: "board",
        milestone: true,
        title: "The Board",
        tags: ["money"],
        text: "They want a seat, a weekly update, and your weekends. You can also sell here and end the trail early, for a smaller score.",
        choices: [
          {
            label: "Give them the seat",
            detail: "A fresh tank. More dilution. This counts as raising.",
            effects: { runway: 14, equity: -14, morale: -8 },
            flags: ["raised"],
            success: "They have a seat. You have runway and a meeting that recurs like weather."
          },
          {
            label: "Take the acquihire",
            detail: "Win now, on the ridge. The score is cut for leaving 400 miles early.",
            effects: { runway: 6, morale: 4 },
            ending: "acquihire",
            earlyExit: true,
            success: "You signed on the ridge. The last stretch can be someone else's problem."
          },
          {
            label: "Walk out",
            detail: "Keep the cap table. The road ahead gets meaner.",
            effects: { runway: -8, morale: 10, traction: 4 },
            flags: ["snubbed"],
            success: "You walked. Later hazards noticed. The company is still yours to finish."
          }
        ]
      };
    }
    if (id === "exit") {
      return {
        id: "exit",
        milestone: true,
        title: "The Exit",
        tags: ["money"],
        text: "Mile 2000. The wagon made it. How you finish sets the ending and the bonus. Quiet Wealth needs no raise on the books and at least 68% equity. The bell needs traction of 70 or it is a costume. Selling looks respectable at 40% equity or better.",
        choices: [
          {
            label: "Stay private",
            detail: "Quiet Wealth if you never raised and still hold 68%. Otherwise you simply survive.",
            effects: { morale: 6, traction: 2 },
            outcome: function (game) {
              if (!game.flags.raised && game.equity >= 68) return "quiet";
              return "real";
            },
            success: "You kept the lights on and the company private."
          },
          {
            label: "Ring the bell",
            detail: "If traction is at least 70, this is a company. Under that, it is a costume.",
            effects: { morale: 2, runway: -4 },
            outcome: function (game) {
              return game.traction >= 70 ? "bell" : "unicorn";
            },
            success: "You rang it. The sound will outlast the jacket they loaned you."
          },
          {
            label: "Sell to a giant",
            detail: "A bigger company writes the check. 40% equity or better and it looks respectable.",
            effects: { morale: 3, runway: 8 },
            outcome: function (game) {
              return game.equity >= 40 ? "respectable" : "acquihire";
            },
            success: "You sold at the end of the trail, on purpose."
          }
        ]
      };
    }
    return null;
  }

  var ENDINGS = {
    quiet: {
      title: "Quiet Wealth",
      win: true,
      bonus: 900,
      text: "You never took the meeting. The wagon still smells like coffee and solder. Revenue shows up on Tuesdays. Nobody knows your name, which is the point."
    },
    real: {
      title: "A Real Company",
      win: true,
      bonus: 750,
      text: "Customers pay, the repo builds, and at least one cofounder still answers the chat. That is the whole miracle."
    },
    bell: {
      title: "The Bell",
      win: true,
      bonus: 820,
      text: "You took it public. The bell is still in your ears. The cap table is ugly and the customers are real. Enjoy the jacket they will ask for back."
    },
    unicorn: {
      title: "Paper Unicorn",
      win: true,
      bonus: 480,
      text: "You rang a bell for a company that is mostly a slide. The photo will do numbers. Payroll is a problem for Monday."
    },
    acquihire: {
      title: "Acquihire with a View",
      win: true,
      bonus: 420,
      text: "A larger company bought the team, the domain, and the right to say they innovate. You kept your knees. You did not keep the wagon."
    },
    respectable: {
      title: "Respectable Exit",
      win: true,
      bonus: 680,
      text: "You sold for a number your parents can repeat. The group chat became an alumni channel before dessert."
    },
    broke: {
      title: "The Card Declined",
      win: false,
      bonus: 0,
      text: "Runway hit zero on an ordinary day. The domain tried to renew and the card laughed. That is the postmortem."
    },
    diluted: {
      title: "Employee 47",
      win: false,
      bonus: 0,
      text: "Your stake hit zero. You still have the laptop sticker. You do not have the company."
    },
    abandoned: {
      title: "Left on Read",
      win: false,
      bonus: 0,
      text: "Every cofounder quit. The wagon is three empty seats and a roadmap nobody opens."
    }
  };

  // Matt: replace every PLACEHOLDER_URL with a real clip. Do not leave invented links.
// Fields: title, url, category, lesson, reward.
var WATCH_CLIPS = [
  {
    title: "PLACEHOLDER: Silicon Valley short",
    url: "PLACEHOLDER_URL",
    category: "Silicon Valley",
    lesson: "PLACEHOLDER: one line on why this short is worth the minute.",
    reward: { traction: 6 }
  },
  {
    title: "PLACEHOLDER: founder clip",
    url: "PLACEHOLDER_URL",
    category: "Founders",
    lesson: "PLACEHOLDER: one line on the founder move worth copying.",
    reward: { unicorn: 8 }
  },
  {
    title: "PLACEHOLDER: epic history moment",
    url: "PLACEHOLDER_URL",
    category: "History",
    lesson: "PLACEHOLDER: one line on what this moment teaches a person who ships.",
    reward: { runway: 6 }
  },
  {
    title: "PLACEHOLDER: philosophy clip",
    url: "PLACEHOLDER_URL",
    category: "Philosophy",
    lesson: "PLACEHOLDER: one line on the idea that should bother a founder.",
    reward: { unicorn: 10 }
  },
  {
    title: "PLACEHOLDER: tech clip",
    url: "PLACEHOLDER_URL",
    category: "Tech",
    lesson: "PLACEHOLDER: one line on the technical lesson hiding in the demo.",
    reward: { traction: 8 }
  }
];

// Comment costumes for Watch and Engage. Matt can add more. Keep them kind.
var COMMENT_STYLES = [
  {
    id: "boomer",
    featured: true,
    label: "Most boomer comment possible",
    announce: "Dare: the most boomer comment you can write without being cruel. Caps and dot dot dot are welcome. Stay kind and on the clip.",
    keywords: ["back in my day", "youngsters", "kids these days", "forwarded", "as per my last email"],
    caps: true,
    ellipsis: true,
    nailAt: 2,
    bonus: { traction: 3 }
  },
  {
    id: "corporate",
    featured: true,
    label: "Max corporate-speak",
    announce: "Dare: maximum corporate-speak. Synergy, circle back, move the needle. Kind, and still about the clip.",
    keywords: ["synergy", "circle back", "move the needle", "leverage", "bandwidth", "alignment", "deep dive"],
    nailAt: 2,
    bonus: { traction: 3 }
  },
  {
    id: "dotcom99",
    label: "1999 dot-com founder",
    announce: "Dare: comment like a 1999 founder. Eyeballs, a portal, a land grab. Be silly, not mean.",
    keywords: ["eyeballs", "land grab", "portal", "stickiness", "first mover", "b2b", "ipo"],
    nailAt: 2,
    bonus: { unicorn: 3 }
  },
  {
    id: "philosopher",
    label: "Philosopher",
    announce: "Dare: comment like a philosopher. Therefore, virtue, the examined bit. On the clip, and kind.",
    keywords: ["therefore", "examined", "virtue", "absurd", "ought", "meaning"],
    nailAt: 2,
    bonus: { unicorn: 4 }
  },
  {
    id: "hype-vc",
    featured: true,
    label: "Hype VC",
    announce: "Dare: hype VC. Generational, category defining, let's go. Hype the idea, not a person.",
    keywords: ["generational", "100x", "crush it", "category defining", "let's go", "rocket ship"],
    nailAt: 2,
    bonus: { unicorn: 4 }
  },
  {
    id: "patagonia-vc",
    featured: true,
    label: "Patagonia vest VC",
    announce: "Dare: Patagonia vest VC. I want TAM, founder-market fit, huge if true, a cortado, an offsite, circle back, and not investment advice. Be kind. Stay on the clip.",
    keywords: ["tam", "founder-market fit", "huge if true", "circle back", "cortado", "offsite", "not investment advice"],
    nailAt: 2,
    bonus: { unicorn: 5 }
  },
  {
    id: "supportive",
    label: "Proud relative",
    announce: "Dare: comment like someone who is proud of the speaker. Warm, specific, not creepy.",
    keywords: ["proud of you", "so talented", "rooting for you", "you got this", "love this"],
    nailAt: 1,
    bonus: { runway: 2 }
  },
  {
    id: "tired-engineer",
    label: "Tired engineer",
    announce: "Dare: tired engineer. Logs, edge cases, it depends. Helpful, not hostile.",
    keywords: ["edge case", "logs", "it depends", "rollback", "undefined", "actually"],
    nailAt: 2,
    bonus: { traction: 3 }
  },
  {
    id: "poet",
    label: "Poet",
    announce: "Dare: a small poem of a comment. Moon, river, hush. About the clip.",
    keywords: ["moon", "silence", "river", "lantern", "hush"],
    nailAt: 2,
    bonus: { unicorn: 3 }
  },
  {
    id: "coach",
    label: "Sports coach",
    announce: "Dare: locker-room coach. Reps, execute, one play. Encourage, do not insult.",
    keywords: ["reps", "execute", "championship", "one play", "locker"],
    nailAt: 2,
    bonus: { traction: 3 }
  },
  {
    id: "pirate",
    label: "Friendly pirate",
    announce: "Dare: a friendly pirate. Arr, treasure, matey. Menace is banned.",
    keywords: ["arr", "treasure", "matey", "plunder", "ahoy"],
    nailAt: 2,
    bonus: { runway: 3 }
  },
  {
    id: "lawyer",
    label: "Careful lawyer",
    announce: "Dare: careful counsel. Hereby, pursuant, notwithstanding. Still human.",
    keywords: ["hereby", "pursuant", "notwithstanding", "without prejudice", "counsel"],
    nailAt: 2,
    bonus: { traction: 4 }
  },
  {
    id: "gen-z",
    label: "Group chat",
    announce: "Dare: group-chat voice. Lowkey, it's giving, ate that. Keep it kind.",
    keywords: ["slay", "lowkey", "it's giving", "rent free", "ate that", "no because"],
    nailAt: 2,
    bonus: { unicorn: 3 }
  },
  {
    id: "scientist",
    label: "Scientist",
    announce: "Dare: scientist. Hypothesis, evidence, replicate. Curious, not smug.",
    keywords: ["hypothesis", "control group", "evidence", "replicate", "sample size"],
    nailAt: 2,
    bonus: { traction: 4 }
  },
  {
    id: "chef",
    label: "Chef",
    announce: "Dare: a chef's comment. Reduce, simmer, season. Taste the idea, do not burn the cook.",
    keywords: ["reduce", "simmer", "season", "plate", "taste"],
    nailAt: 2,
    bonus: { runway: 2 }
  },
  {
    id: "western",
    label: "Trail western",
    announce: "Dare: western. Dust, partner, sunset. On topic. No threats.",
    keywords: ["partner", "dust", "saloon", "horseback", "sunset"],
    nailAt: 2,
    bonus: { runway: 3 }
  },
  {
    id: "haiku",
    label: "Haiku fan",
    announce: "Dare: three short lines, or say haiku and mean it. About the clip.",
    keywords: ["haiku", "syllable", "three lines"],
    lines: 3,
    nailAt: 1,
    bonus: { unicorn: 3 }
  }
];

// Matt: edit this list. Starters are the player's own posts, never a follow reward.
// gameUrl: replace PASTE_GAME_URL_HERE with the public game link when you have one.
var SIDE_QUESTS = {
  cooldownMs: 8 * 60 * 1000,
  streakWindowMs: 36 * 60 * 60 * 1000,
  gameUrl: "PASTE_GAME_URL_HERE",
  clips: WATCH_CLIPS,
  entries: [
    {
      id: "build-public",
      kind: "post",
      pace: "quick",
      title: "Build in public",
      blurb: "Post an honest update. What you shipped, what stalled, what is true today.",
      dare: "Founders skip this because it is slow and not a launch. Post the boring truth.",
      draft: "Build in public. {company} is at mile {mile}. Today is true: {pitch}. Score {score}. #HustleTrail",
      channels: ["x", "linkedin"],
      rewards: { runway: 8 },
      hype: "You put the wagon in public. That is runway for a quick, slightly naked post. Do it again before the streak dies."
    },
    {
      id: "thoughtful-comment",
      kind: "comment",
      pace: "steady",
      title: "Leave a thoughtful comment",
      blurb: "On a founder or investor post, or under a talk, write a real comment. Your words. Not a heart, not a follow.",
      dare: "Pick any post you already respect. Add something useful. Come back when it is up.",
      minLength: 24,
      rewards: { traction: 8 },
      hype: "A real comment, not a heart icon. Traction for the slow work. I am almost impressed."
    },
    {
      id: "sixty-seconds",
      kind: "video",
      pace: "vulnerable",
      title: "Record 60 seconds",
      blurb: "One minute on the startup, in your voice. Keep it or post it. The point is you sat in front of the camera.",
      dare: "Most people will rewrite the script forever. Hit record. Sixty seconds. Then tell me it exists.",
      rewards: { unicorn: 12 },
      hype: "You faced a lens. That is Unicorn Glow, the expensive kind. I am hyping you and I mean it."
    },
    {
      id: "dm-three",
      kind: "dm",
      pace: "steady",
      title: "DM 3 potential customers",
      blurb: "Three real people who might pay. No pitch deck. Ask if the problem is real.",
      dare: "This is the boring scary one. Send three. I am not collecting their names.",
      steps: 3,
      rewards: { traction: 10 },
      hype: "Three DMs. That is the grind with dirt under it. Traction, and a streak tick if you keep showing up."
    },
    {
      id: "ask-feedback",
      kind: "post",
      pace: "vulnerable",
      title: "Ask for feedback in public",
      blurb: "Post a specific question about the product. Invite the correction.",
      dare: "Ask like you can stand the answer. Vague pleas do not count.",
      draft: "Honest question about {company}: what is confusing, missing, or easy to ignore? Mile {mile}. {pitch} #HustleTrail",
      channels: ["x", "linkedin"],
      rewards: { unicorn: 8 },
      hype: "You asked to be corrected in public. Glow for the bruise. Read the replies before you get defensive."
    },
    {
      id: "failure-story",
      kind: "post",
      pace: "vulnerable",
      title: "Share a failure story",
      blurb: "One true miss. What broke, what you learned, no costume of success.",
      dare: "The vulnerable one. If it still stings, it is the right story.",
      draft: "A failure from {company}: we are at mile {mile} and this part hurt. What I would do differently is still ugly. #HustleTrail",
      channels: ["x", "linkedin"],
      rewards: { unicorn: 14 },
      hype: "You told the miss out loud. That is the biggest glow I give. I sold my company too early, so I know the price of the pretty version."
    }
  ]
};

var MILESTONES = [
    { id: "garage", mile: 0, name: "The Garage", goal: "Roll out of the driveway" },
    { id: "users", mile: 400, name: "First Users", goal: "Get ten humans who are not your parents" },
    { id: "pmf", mile: 800, name: "Product-Market Fit", goal: "Find one stranger who comes back" },
    { id: "seed", mile: 1200, name: "Seed Crossing", goal: "Pay for the next stretch of trail" },
    { id: "board", mile: 1600, name: "The Board", goal: "Decide who actually owns the wagon" },
    { id: "exit", mile: 2000, name: "The Exit", goal: "Finish the trail on your terms" }
  ];

  return {
    NAMES: NAMES,
    TRAITS: TRAITS,
    QUIT_REASONS: QUIT_REASONS,
    QUOTES: QUOTES,
    HELP: HELP,
    EVENTS: EVENTS,
    ENDINGS: ENDINGS,
    MILESTONES: MILESTONES,
    SIDE_QUESTS: SIDE_QUESTS,
    WATCH_CLIPS: WATCH_CLIPS,
    COMMENT_STYLES: COMMENT_STYLES,
    buildMilestone: buildMilestone,
    pick: pick,
    shuffle: shuffle
  };
});
