// fx.js — lightweight canvas particle engine for celebrations (no dependencies).
//
// Performance-tuned for tablets:
//  • the fx canvas renders at DPR 1 (decorative — no need for retina pixels)
//  • emoji are pre-rasterized once to small bitmaps and drawImage'd, instead of
//    the very expensive fillText-every-frame
//  • a hard particle cap stops bursts from stacking up and stuttering
// The loop only runs while particles are alive, so it costs nothing when idle.

const fx = (() => {
  let canvas, ctx, running = false;
  const DPR = 1;                 // decorative layer — 1 is plenty and ~4x cheaper
  const MAX = 240;               // hard ceiling on live particles
  const parts = [];
  const COLORS = ["#e53935","#fbc02d","#1e88e5","#43a047","#fb8c00","#8e24aa","#ec407a","#4fc3f7","#ffffff"];
  const glyphCache = {};

  function glyph(emoji) {
    if (glyphCache[emoji]) return glyphCache[emoji];
    const s = 64;
    const c = document.createElement("canvas"); c.width = c.height = s;
    const g = c.getContext("2d");
    g.font = `${s * 0.8}px ui-rounded, system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(emoji, s / 2, s / 2);
    glyphCache[emoji] = c;
    return c;
  }

  function init() {
    canvas = document.getElementById("fx");
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  function resize() {
    if (!canvas) return;
    canvas.width = Math.floor(innerWidth * DPR);
    canvas.height = Math.floor(innerHeight * DPR);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
  }

  function spawn(p) {
    if (parts.length >= MAX) return;   // drop excess instead of stuttering
    parts.push(p); start();
  }
  function start() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (document.hidden) { parts.length = 0; running = false; return; }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      if (p.life <= 0 || p.y > innerHeight + 40) { parts.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.fade));
      ctx.translate(p.x * DPR, p.y * DPR);
      ctx.rotate(p.rot);
      const s = p.size * DPR;
      if (p.bmp) ctx.drawImage(p.bmp, -s / 2, -s / 2, s, s);
      else { ctx.fillStyle = p.color; ctx.fillRect(-s / 2, -s / 2, s, s * 0.6); }
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  function confetti(x, y, count = 22, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = (4 + Math.random() * 9) * power;
      spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6 * power, g: 0.28,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5,
        size: 10 + Math.random() * 12, color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 64 + Math.random() * 36, fade: 46 });
    }
  }

  function emojiBurst(x, y, emojis, count = 10, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * 7) * power;
      spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5 * power, g: 0.22,
        rot: (Math.random() - 0.5), vr: (Math.random() - 0.5) * 0.2,
        size: 22 + Math.random() * 18, bmp: glyph(emojis[(Math.random() * emojis.length) | 0]),
        life: 72 + Math.random() * 36, fade: 50 });
    }
  }

  // Big multi-burst celebration — bounded so it can't pile up.
  function bigCelebration(emojis) {
    const w = innerWidth, h = innerHeight;
    confetti(w / 2, h * 0.42, 40, 1.3);
    if (emojis) emojiBurst(w / 2, h * 0.42, emojis, 8, 1.1);
    for (let k = 0; k < 2; k++) {
      const dx = w * (0.2 + Math.random() * 0.6), dy = h * (0.25 + Math.random() * 0.3);
      setTimeout(() => { confetti(dx, dy, 26, 1.1); }, 160 + k * 160);
    }
  }

  function rain(count = 20) {
    for (let i = 0; i < count; i++) {
      spawn({ x: Math.random() * innerWidth, y: -20, vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3, g: 0.03, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        size: 9 + Math.random() * 10, color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 200, fade: 60 });
    }
  }

  return { init, confetti, emojiBurst, bigCelebration, rain };
})();
