(function (root) {
  var W = 240;
  var H = 64;
  var marks = [
    { id: "garage", mile: 0, name: "Garage" },
    { id: "coffee", mile: 400, name: "Coffee" },
    { id: "demo", mile: 1000, name: "Demo day" },
    { id: "vc", mile: 1500, name: "VC office" },
    { id: "unicorn", mile: 2000, name: "Unicorn" }
  ];
  var view = { miles: 0, runway: 0, traction: 0, unicorn: 0, moving: false };
  var canvas;
  var ctx;
  var raf = 0;

  function mount() {
    if (document.getElementById("pixel-trail")) return;
    var bar = document.createElement("div");
    bar.id = "pixel-trail";
    bar.innerHTML = ""
      + "<canvas id='pixel-canvas' width='" + W + "' height='" + H + "' aria-label='Trail progress'></canvas>"
      + "<div class='px-meters'>"
      + meter("run", "Run")
      + meter("trc", "Trac")
      + meter("glo", "Glow")
      + "</div>";
    document.body.prepend(bar);
    canvas = document.getElementById("pixel-canvas");
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function meter(id, label) {
    var blocks = "";
    for (var i = 0; i < 8; i++) blocks += "<i></i>";
    return "<div class='px-meter'><span>" + label + "</span><b id='px-" + id + "'>" + blocks + "</b></div>";
  }

  function sync(game) {
    mount();
    if (!game) {
      view.miles = 0;
      view.runway = 0;
      view.traction = 0;
      view.unicorn = 0;
      view.moving = false;
      return;
    }
    var miles = Math.max(0, Math.min(2000, game.miles || 0));
    view.moving = game.phase === "travel" && !game.paused && miles !== view.miles;
    view.miles = miles;
    view.runway = game.runway || 0;
    view.traction = game.traction || 0;
    view.unicorn = game.unicorn || 0;
    paintMeters();
  }

  function paintMeters() {
    fill("px-run", view.runway / 100);
    fill("px-trc", Math.min(1, view.traction / 80));
    fill("px-glo", (view.unicorn || 0) / 100);
  }

  function fill(id, ratio) {
    var node = document.getElementById(id);
    if (!node) return;
    var n = Math.max(0, Math.min(8, Math.round(ratio * 8)));
    var cells = node.children;
    for (var i = 0; i < cells.length; i++) cells[i].className = i < n ? "on" : "";
  }

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!ctx) return;
    draw(Math.floor(Date.now() / 180) % 2);
  }

  function draw(step) {
    ctx.clearRect(0, 0, W, H);
    px(0, 0, W, 46, "#16122c");
    px(0, 46, W, 18, "#24180f");
    px(0, 46, W, 2, "#3a2818");
    var i;
    for (i = 0; i < 18; i++) {
      var sx = (i * 37) % W;
      var sy = (i * 13) % 28;
      px(sx, sy, 1, 1, i % 4 === 0 ? "#f0c36a" : "#d7def5");
    }
    skyline();
    marks.forEach(function (mark, index) {
      var x = 8 + index * 56;
      var on = view.miles >= mark.mile;
      icon(mark.id, x, 30, on);
    });
    var vanX = 6 + Math.round((view.miles / 2000) * (W - 28));
    van(vanX, 34, view.moving ? step : 0, view.miles >= 2000);
  }

  function skyline() {
    var blocks = [
      [4, 28, 10, 18, "#2a2344"],
      [16, 22, 8, 24, "#32284e"],
      [28, 32, 14, 14, "#241c3c"],
      [70, 18, 6, 28, "#3a3058"],
      [78, 26, 10, 20, "#2e2648"],
      [96, 14, 5, 32, "#463868"],
      [104, 24, 12, 22, "#2a2344"],
      [150, 16, 8, 30, "#3a3058"],
      [160, 22, 14, 24, "#241c3c"],
      [186, 12, 6, 34, "#4a3c70"],
      [194, 20, 16, 26, "#2e2648"],
      [214, 18, 8, 28, "#3a3058"]
    ];
    blocks.forEach(function (b) {
      px(b[0], b[1], b[2], b[3], b[4]);
      var wx;
      for (wx = b[0] + 2; wx < b[0] + b[2] - 2; wx += 4) {
        px(wx, b[1] + 4, 2, 2, "#f0c36a");
        if (b[3] > 16) px(wx, b[1] + 10, 2, 2, "#7d6a3a");
      }
    });
  }

  function icon(id, x, y, on) {
    var c = on ? "#f0c36a" : "#3a3450";
    var d = on ? "#ff7a45" : "#2a243c";
    if (on) px(x - 1, y - 1, 12, 12, "rgba(240,195,106,0.35)");
    if (id === "garage") {
      px(x + 1, y + 4, 8, 6, c);
      px(x + 2, y + 1, 6, 3, d);
      px(x + 4, y + 6, 2, 4, "#1a120c");
    } else if (id === "coffee") {
      px(x + 2, y + 3, 6, 5, c);
      px(x + 8, y + 4, 2, 3, d);
      px(x + 3, y + 1, 4, 2, d);
    } else if (id === "demo") {
      px(x + 1, y + 2, 8, 6, c);
      px(x + 2, y + 3, 6, 4, "#1a1440");
      px(x + 4, y + 8, 2, 2, d);
    } else if (id === "vc") {
      px(x + 2, y + 1, 6, 9, c);
      px(x + 3, y + 3, 1, 1, "#1a1440");
      px(x + 6, y + 3, 1, 1, "#1a1440");
      px(x + 3, y + 6, 1, 1, "#1a1440");
      px(x + 6, y + 6, 1, 1, "#1a1440");
    } else {
      px(x + 2, y + 6, 6, 3, c);
      px(x + 6, y + 3, 2, 3, d);
      px(x + 7, y + 1, 2, 2, on ? "#fff1cc" : c);
    }
  }

  function van(x, y, step, done) {
    var body = done ? "#f0c36a" : "#ff7a45";
    px(x + 2, y, 14, 7, body);
    px(x + 4, y + 1, 5, 3, "#1a1440");
    px(x + 14, y + 2, 4, 5, "#c2410c");
    px(x + 3, y + 7, 3, 3, "#1a120c");
    px(x + 11, y + 7, 3, 3, "#1a120c");
    var wobble = step ? 1 : 0;
    px(x + 4, y + 8 + wobble, 1, 1, "#f4ead7");
    px(x + 12, y + 8 - wobble, 1, 1, "#f4ead7");
    if (done) px(x + 1, y - 2, 16, 1, "#fff1cc");
  }

  root.HT_PIXEL = { mount: mount, sync: sync };
})(typeof window !== "undefined" ? window : globalThis);
