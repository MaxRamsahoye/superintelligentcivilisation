// ---------------------------------------------------------------------------
// Superintelligent Civilisation — animated pixel-art hero
// Renders a low-resolution scene onto <canvas>, stretched crisp with
// `image-rendering: pixelated` so every pixel reads as a big square.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  // ------------------------------- Scene ----------------------------------

  var Scene = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.rand = seededRandom(1337);
    this.W = 0;
    this.H = 0;
    this.running = true;
    this.lastT = 0;
    this.resize();
    window.addEventListener("resize", this.resize.bind(this));
    document.addEventListener("visibilitychange", function () {
      this.running = document.visibilityState !== "hidden";
    }.bind(this));
  };

  Scene.prototype.resize = function () {
    var vw = window.innerWidth || 1;
    var vh = window.innerHeight || 1;
    var aspect = vw / vh;
    var LOGICAL_H = 100;
    var LOGICAL_W = Math.max(120, Math.round(LOGICAL_H * aspect));

    this.W = LOGICAL_W;
    this.H = LOGICAL_H;
    this.canvas.width = LOGICAL_W;
    this.canvas.height = LOGICAL_H;

    this.horizon = Math.round(this.H * 0.66);
    this.roadY = Math.round(this.H * 0.88);
    this.groundY = Math.round(this.H * 0.7);

    this.buildClouds();
    this.buildMountains();
    this.buildCity();
    this.buildTrees();
    this.buildTurbines();
    this.buildCars();
    this.buildBirds();
  };

  Scene.prototype.buildClouds = function () {
    var rand = seededRandom(17);
    var clouds = [];
    for (var i = 0; i < 5; i++) {
      var puffs = 3 + Math.floor(rand() * 2);
      var shape = [];
      for (var p = 0; p < puffs; p++) {
        shape.push({
          dx: p * 4 - puffs * 2,
          dy: -Math.round(rand() * 2),
          w: 4 + Math.round(rand() * 3),
          h: 2 + Math.round(rand() * 2)
        });
      }
      clouds.push({
        y: this.horizon * (0.08 + rand() * 0.28),
        speed: 1.5 + rand() * 2,
        offset: rand() * (this.W + 40),
        depth: 0.5 + rand() * 0.5,
        shape: shape
      });
    }
    this.clouds = clouds;
  };

  Scene.prototype.buildMountains = function () {
    var rand = seededRandom(11);
    var pts = [];
    var x = -5;
    while (x < this.W + 5) {
      pts.push({ x: x, h: 6 + rand() * (this.H * 0.14) });
      x += 6 + rand() * 8;
    }
    this.mountains = pts;
  };

  Scene.prototype.buildCity = function () {
    var rand = seededRandom(23);
    var buildings = [];
    var x = this.W * 0.02;
    var maxX = this.W * 0.62;
    while (x < maxX) {
      var w = 4 + Math.floor(rand() * 6);
      var h = 8 + rand() * (this.H * 0.22);
      var isFactory = rand() < 0.3;
      var windows = [];
      var cols = Math.max(1, Math.floor(w / 2));
      var rows = Math.max(1, Math.floor(h / 3));
      for (var c = 0; c < cols; c++) {
        for (var r = 0; r < rows; r++) {
          if (rand() < 0.55) {
            windows.push({ c: c, r: r, phase: rand() * Math.PI * 2, speed: 0.5 + rand() });
          }
        }
      }
      buildings.push({ x: x, w: w, h: h, isFactory: isFactory, windows: windows, smokeSeed: rand() * 1000 });
      x += w + 1 + rand() * 3;
    }
    this.buildings = buildings;
  };

  Scene.prototype.buildTrees = function () {
    var rand = seededRandom(31);
    var trees = [];
    var x = this.W * 0.02;
    var maxX = this.W * 0.98;
    while (x < maxX) {
      if (rand() < 0.55) {
        trees.push({
          x: x,
          trunkH: 3 + rand() * 3,
          canopyR: 3 + rand() * 3,
          phase: rand() * Math.PI * 2
        });
      }
      x += 4 + rand() * 6;
    }
    this.trees = trees;
  };

  Scene.prototype.buildTurbines = function () {
    var rand = seededRandom(41);
    var turbines = [];
    var positions = [this.W * 0.72, this.W * 0.82, this.W * 0.90];
    for (var i = 0; i < positions.length; i++) {
      turbines.push({
        x: positions[i],
        baseY: this.horizon - (6 + rand() * 4),
        towerH: 14 + rand() * 8,
        angle: rand() * Math.PI * 2,
        speed: 1.6 + rand() * 0.6
      });
    }
    this.turbines = turbines;
  };

  Scene.prototype.buildCars = function () {
    var rand = seededRandom(53);
    var palette = ["#ff6b6b", "#ffd166", "#6ee7ff", "#c792ff", "#8dff9e"];
    var cars = [];
    var lanes = [this.roadY + 3, this.roadY + 8];
    for (var i = 0; i < 5; i++) {
      var lane = i % 2;
      cars.push({
        lane: lane,
        y: lanes[lane],
        dir: lane === 0 ? 1 : -1,
        speed: 10 + rand() * 6,
        offset: rand() * this.W,
        color: palette[i % palette.length]
      });
    }
    this.cars = cars;
  };

  Scene.prototype.buildBirds = function () {
    var rand = seededRandom(61);
    var birds = [];
    for (var i = 0; i < 3; i++) {
      birds.push({
        y: this.horizon * (0.25 + rand() * 0.3),
        speed: 6 + rand() * 4,
        offset: rand() * this.W,
        phase: rand() * Math.PI * 2
      });
    }
    this.birds = birds;
  };

  Scene.prototype.drawSky = function () {
    var ctx = this.ctx;
    px(ctx, 0, 0, this.W, this.horizon, "#ffffff");
  };

  Scene.prototype.drawSun = function (t) {
    var cx = this.W * 0.5;
    var cy = this.horizon * 0.62;
    var r = Math.max(6, this.H * 0.08);
    var ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (var yy = -r * 1.6; yy <= r * 1.6; yy++) {
      var haloSpan = Math.sqrt(Math.max(0, (r * 1.6) * (r * 1.6) - yy * yy));
      px(ctx, cx - haloSpan, cy + yy, haloSpan * 2, 1, "#ffe4a3");
    }
    ctx.globalAlpha = 0.95;
    for (var y = -r; y <= r; y++) {
      var span = Math.sqrt(Math.max(0, r * r - y * y));
      px(ctx, cx - span, cy + y, span * 2, 1, "#ffb238");
    }
    ctx.restore();
  };

  Scene.prototype.drawClouds = function (t) {
    var ctx = this.ctx;
    for (var i = 0; i < this.clouds.length; i++) {
      var cl = this.clouds[i];
      var span = this.W + 40;
      var x = ((cl.offset + t * cl.speed) % span) - 20;
      ctx.globalAlpha = 0.55 + cl.depth * 0.3;
      for (var p = 0; p < cl.shape.length; p++) {
        var puff = cl.shape[p];
        px(ctx, x + puff.dx, cl.y + puff.dy, puff.w, puff.h, "#b7bdd1");
      }
    }
    ctx.globalAlpha = 1;
  };

  Scene.prototype.drawMountains = function () {
    var ctx = this.ctx;
    ctx.fillStyle = "#9aa2b8";
    ctx.beginPath();
    ctx.moveTo(0, this.horizon);
    for (var i = 0; i < this.mountains.length; i++) {
      var m = this.mountains[i];
      ctx.lineTo(m.x, this.horizon - m.h);
    }
    ctx.lineTo(this.W, this.horizon);
    ctx.closePath();
    ctx.fill();
  };

  Scene.prototype.drawCity = function (t) {
    var ctx = this.ctx;
    for (var i = 0; i < this.buildings.length; i++) {
      var b = this.buildings[i];
      var top = this.horizon - b.h;
      px(ctx, b.x, top, b.w, b.h, b.isFactory ? "#3a3f52" : "#454b61");

      for (var w = 0; w < b.windows.length; w++) {
        var win = b.windows[w];
        var lit = Math.sin(t * win.speed + win.phase) > -0.2;
        px(ctx, b.x + win.c * 2, top + 1 + win.r * 3, 1, 1, lit ? "#ffcf6b" : "#282c3c");
      }

      if (b.isFactory) {
        var chimneyX = b.x + b.w - 1;
        var chimneyTop = top - 4;
        px(ctx, chimneyX, chimneyTop, 2, 4, "#2c2f3d");
        for (var p = 0; p < 4; p++) {
          var life = ((t * 6 + b.smokeSeed + p * 25) % 100) / 100;
          var sx = chimneyX + Math.sin(t * 0.8 + p + b.smokeSeed) * (2 + life * 4);
          var sy = chimneyTop - life * 16;
          var size = 1 + life * 2.5;
          ctx.globalAlpha = 0.45 * (1 - life);
          px(ctx, sx, sy, size, size, "#9aa0b8");
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  Scene.prototype.drawTurbines = function (t) {
    var ctx = this.ctx;
    for (var i = 0; i < this.turbines.length; i++) {
      var tb = this.turbines[i];
      var hubY = tb.baseY - tb.towerH;
      px(ctx, tb.x, hubY, 1, tb.towerH, "#6b7280");
      var angle = tb.angle + t * tb.speed;
      for (var blade = 0; blade < 3; blade++) {
        var a = angle + (blade * Math.PI * 2) / 3;
        var len = 5;
        var bx = tb.x + Math.cos(a) * len;
        var by = hubY + Math.sin(a) * len;
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tb.x, hubY);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      px(ctx, tb.x - 0.5, hubY - 0.5, 1, 1, "#454b5c");
    }
  };

  Scene.prototype.drawGround = function () {
    var ctx = this.ctx;
    px(ctx, 0, this.horizon, this.W, this.H - this.horizon, "#3fa86a");
    px(ctx, 0, this.groundY, this.W, this.roadY - this.groundY, "#1f6b3f");
    px(ctx, 0, this.roadY, this.W, this.H - this.roadY, "#33363f");

    var dashW = 3, gap = 3;
    for (var x = -((performance.now() / 60) % (dashW + gap)); x < this.W; x += dashW + gap) {
      px(ctx, x, this.roadY + 6, dashW, 1, "#e8d98a");
    }
  };

  Scene.prototype.drawTrees = function (t) {
    var ctx = this.ctx;
    for (var i = 0; i < this.trees.length; i++) {
      var tr = this.trees[i];
      var sway = Math.sin(t * 1.2 + tr.phase) * 0.6;
      var baseY = this.groundY;
      px(ctx, tr.x, baseY - tr.trunkH, 1, tr.trunkH, "#3a2317");
      px(ctx, tr.x - tr.canopyR / 2 + sway, baseY - tr.trunkH - tr.canopyR, tr.canopyR, tr.canopyR, "#1f6b3f");
      px(ctx, tr.x - tr.canopyR / 2 + sway + 1, baseY - tr.trunkH - tr.canopyR - 1, tr.canopyR - 1, tr.canopyR - 1, "#2f8f56");
    }
  };

  Scene.prototype.drawCars = function (t) {
    var ctx = this.ctx;
    for (var i = 0; i < this.cars.length; i++) {
      var c = this.cars[i];
      var travel = (t * c.speed + c.offset) % (this.W + 14);
      var x = c.dir === 1 ? travel - 10 : this.W - travel + 10;
      px(ctx, x, c.y, 6, 2, c.color);
      px(ctx, x + (c.dir === 1 ? 3 : 0), c.y - 1, 3, 1, c.color);
      px(ctx, x + 1, c.y + 2, 1, 1, "#111");
      px(ctx, x + 4, c.y + 2, 1, 1, "#111");
      px(ctx, c.dir === 1 ? x + 5 : x, c.y, 1, 1, "#fff7c2");
    }
  };

  Scene.prototype.drawPlane = function (t) {
    var period = 22;
    var phase = t % period;
    if (phase > 10) return;
    var x = -10 + phase * (this.W + 20) / 10;
    var y = this.H * 0.14 + Math.sin(t * 0.3) * 2;
    var ctx = this.ctx;
    px(ctx, x, y, 6, 1, "#4b5163");
    px(ctx, x + 2, y - 1, 1, 1, "#4b5163");
    px(ctx, x + 2, y + 1, 1, 1, "#4b5163");
    if (Math.floor(t * 4) % 2 === 0) {
      px(ctx, x + 6, y, 1, 1, "#ff5566");
    }
  };

  Scene.prototype.drawBirds = function (t) {
    var ctx = this.ctx;
    for (var i = 0; i < this.birds.length; i++) {
      var b = this.birds[i];
      var x = (t * b.speed + b.offset) % (this.W + 10) - 5;
      var flap = Math.sin(t * 8 + b.phase) > 0 ? 1 : 0;
      ctx.strokeStyle = "#241030";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 2, b.y + (flap ? 1 : -1));
      ctx.lineTo(x, b.y);
      ctx.lineTo(x + 2, b.y + (flap ? 1 : -1));
      ctx.stroke();
    }
  };

  Scene.prototype.draw = function (t) {
    this.drawSky();
    this.drawSun(t);
    this.drawClouds(t);
    this.drawMountains();
    this.drawPlane(t);
    this.drawBirds(t);
    this.drawCity(t);
    this.drawTurbines(t);
    this.drawGround();
    this.drawTrees(t);
    this.drawCars(t);
  };

  Scene.prototype.tick = function (nowMs) {
    if (this.running) {
      this.draw(nowMs / 1000);
    }
    requestAnimationFrame(this.tick.bind(this));
  };

  Scene.prototype.start = function () {
    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      this.draw(0);
      return;
    }
    requestAnimationFrame(this.tick.bind(this));
  };

  // ----------------------------- Pixel text -------------------------------
  // A tiny self-contained 5x7 dot-matrix font, drawn as literal on/off
  // pixels (no web font / network dependency) so it always renders as true
  // pixel-art blocks once stretched with `image-rendering: pixelated`.

  var GLYPH_W = 5;
  var GLYPH_H = 7;
  var FONT = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    G: ["01111", "10000", "10000", "10011", "10001", "10001", "01110"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"]
  };

  function renderPixelText(canvas) {
    var text = (canvas.dataset.text || "").toUpperCase();
    var gap = 3; // wide enough that the outline below still leaves a
                 // see-through sliver of scene between letters
    var pad = 1; // room for the outline halo so it never clips at the edge
    var letters = text.split("").map(function (ch) {
      return FONT[ch] || FONT[" "];
    });
    var cols = letters.length * GLYPH_W + (letters.length - 1) * gap;
    var paddedCols = cols + pad * 2;
    var paddedRows = GLYPH_H + pad * 2;

    var on = new Uint8Array(paddedCols * paddedRows);
    function set(x, y) { on[y * paddedCols + x] = 1; }
    function get(x, y) {
      return x >= 0 && x < paddedCols && y >= 0 && y < paddedRows
        ? on[y * paddedCols + x]
        : 0;
    }

    var xOffset = pad;
    letters.forEach(function (glyph) {
      for (var r = 0; r < GLYPH_H; r++) {
        var row = glyph[r];
        for (var c = 0; c < GLYPH_W; c++) {
          if (row[c] === "1") set(xOffset + c, r + pad);
        }
      }
      xOffset += GLYPH_W + gap;
    });

    canvas.width = paddedCols;
    canvas.height = paddedRows;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, paddedCols, paddedRows);

    // Outline pass: any empty cell orthogonally touching a letter cell gets
    // a dark halo pixel, then the bright fill goes on top of the letter
    // cells. Kept as two separate passes (rather than a single dilated
    // blob) so the sliver of gap between letters stays transparent and the
    // scene shows through.
    ctx.fillStyle = "#ffffff";
    for (var y = 0; y < paddedRows; y++) {
      for (var x = 0; x < paddedCols; x++) {
        if (!get(x, y) && (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1))) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.fillStyle = "#0a0a0a";
    for (var y2 = 0; y2 < paddedRows; y2++) {
      for (var x2 = 0; x2 < paddedCols; x2++) {
        if (get(x2, y2)) ctx.fillRect(x2, y2, 1, 1);
      }
    }

    // Width comes from the shared cell size (so both words use identical
    // block size); height is derived from aspect-ratio so a max-width
    // clamp on narrow screens can never distort the glyphs.
    canvas.style.width = "calc(var(--pixel-cell) * " + paddedCols + ")";
    canvas.style.height = "auto";
    canvas.style.aspectRatio = paddedCols + " / " + paddedRows;
  }

  function renderAllPixelText() {
    var nodes = document.querySelectorAll(".pixel-text");
    nodes.forEach(renderPixelText);
  }

  function init() {
    var canvas = document.getElementById("scene");
    if (canvas) {
      var scene = new Scene(canvas);
      scene.start();
    }
    renderAllPixelText();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
