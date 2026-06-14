// app.js — session loop, modes, progress, and the fun layer (stars, combos,
// stickers, celebrations). Parent-led: the app plays a chord, the toddler
// responds, the parent taps the chosen color. Training integrity is unchanged;
// everything here is reward/feedback on top of the Eguchi chord method.

const STORE_KEY = "pitchperfect_v1";
const METER_TARGET = 5;       // correct answers per sticker reward
const COMBO_MILESTONES = [3, 5, 8, 12, 16, 20, 25, 30];

// Collectible stickers (unlocked one per filled star-meter).
const STICKERS = [
  "🦄","🐶","🐱","🐰","🦊","🐻","🐼","🐨","🐯","🦁",
  "🐮","🐷","🐸","🐵","🐧","🐢","🐙","🦋","🐝","🐞",
  "🦖","🐳","🐬","🦕","🦜","🦩","🦒","🦘","🦔","🦦",
];

const DEFAULT_STATE = {
  unlocked: ["red"],
  stats: {},
  sessionsDone: 0,
  lastUnlockISO: null,
  stars: 0,                   // lifetime stars earned
  meter: 0,                   // progress toward the next sticker
  stickers: [],               // owned sticker emojis
  bestCombo: 0,
  settings: {
    trialsPerSession: 20,
    reveal: "after",
    speak: true,
    arpeggiate: true,
    effects: true,            // celebrations + sound effects
  },
};

let state = loadState();
let mode = "quiz";
let target = null;
let prevTargetId = null;
let trialIndex = 0;
let lastPickId = null;
let runLen = 0;
const MAX_RUN = 2;
let locked = false;
let sessionCorrect = 0;
let sessionPerChord = {};
let combo = 0;                // current consecutive-correct streak
let pendingReveal = false;    // a sticker reveal is blocking auto-advance
let afterReveal = null;       // what to run once the reveal closes
let pendingSticker = null;
let bigTextTimer = null;

// ---------- persistence ----------
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const p = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...p,
             settings: { ...DEFAULT_STATE.settings, ...(p.settings || {}) } };
  } catch { return structuredClone(DEFAULT_STATE); }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function effects() { return state.settings.effects; }

// ---------- helpers ----------
const el = (id) => document.getElementById(id);
let cardEls = {};
function unlockedChords() { return state.unlocked.map(chordById).filter(Boolean); }
function nextLockedChord() { return ALL_CHORDS.find((c) => !state.unlocked.includes(c.id)) || null; }
function statOf(id) { return state.stats[id] || { correct: 0, total: 0 }; }
function recordResult(id, correct) {
  const s = statOf(id); s.total += 1; if (correct) s.correct += 1; state.stats[id] = s;
  const ss = sessionPerChord[id] || { correct: 0, total: 0 };
  ss.total += 1; if (correct) ss.correct += 1; sessionPerChord[id] = ss;
}
// Speak a chord's color name using the bundled recorded voice clip.
function announce(id) {
  if (state.settings.speak) piano.sayColor(id);
}

// ---------- cards ----------
function buildCards() {
  const grid = el("cards"); grid.innerHTML = ""; cardEls = {};
  unlockedChords().forEach((chord, i) => {
    const card = document.createElement("button");
    card.className = "card";
    card.style.background = chord.color; card.style.color = chord.text;
    card.dataset.id = chord.id;
    card.innerHTML = `
      <div class="mascot">${chord.mascot}</div>
      <div class="cname">${chord.name}</div>
      <div class="letters">${chordLetters(chord)}</div>
      <div class="solfege">${chordSolfege(chord)}</div>
      <div class="keynum">${i < 9 ? i + 1 : ""}</div>`;
    card.addEventListener("click", () => onCardChosen(chord));
    grid.appendChild(card); cardEls[chord.id] = card;
  });
}
function clearCardStates() {
  Object.values(cardEls).forEach((c) => c.classList.remove("correct", "wrong", "reveal"));
}
function flash(chord, cls) { const c = cardEls[chord.id]; if (c) c.classList.add(cls); }

// ---------- session flow ----------
function startSession() {
  trialIndex = 0; sessionCorrect = 0; sessionPerChord = {}; prevTargetId = null;
  lastPickId = null; runLen = 0; combo = 0; updateCombo();
  el("summary").classList.add("hidden");
  el("unlockPrompt").classList.add("hidden");
  nextTrial();
}

function pickTarget() {
  // Uniform random WITH replacement, capped at MAX_RUN back-to-back repeats.
  const pool = unlockedChords();
  let choices = pool;
  if (pool.length > 1 && runLen >= MAX_RUN && lastPickId) {
    choices = pool.filter((c) => c.id !== lastPickId);
  }
  const pick = choices[Math.floor(Math.random() * choices.length)];
  runLen = pick.id === lastPickId ? runLen + 1 : 1;
  lastPickId = pick.id;
  return pick;
}

function nextTrial() {
  locked = false;
  clearCardStates();
  el("feedback").textContent = ""; el("feedback").className = "feedback";

  if (mode === "quiz" || mode === "single") {
    if (trialIndex >= state.settings.trialsPerSession) return endSession();
    target = pickTarget(); prevTargetId = target.id;
    updateStatus(); playTarget();
  } else { // learn — pure exposure, reveal immediately
    target = pickTarget(); prevTargetId = target.id; updateStatus();
    const delay = piano.playChord(target.notes, 1.8, state.settings.arpeggiate);
    flash(target, "reveal");
    setTimeout(() => announce(target.id), delay);
  }
}

function playTarget() {
  if (!target) return;
  if (mode === "single") {
    piano.playChord(target.notes, 1.4);
    const [l, o] = target.notes[target.notes.length - 1];
    setTimeout(() => piano.playNote(l, o, 1.6), 1100);
  } else {
    piano.playChord(target.notes, 1.8, state.settings.arpeggiate);
  }
}

function onCardChosen(chord) {
  if (mode === "learn") { // free exploration
    const delay = piano.playChord(chord.notes, 1.8, state.settings.arpeggiate);
    flash(chord, "reveal");
    setTimeout(() => announce(chord.id), delay);
    return;
  }
  if (locked || !target || pendingReveal) return;
  locked = true;
  const correct = chord.id === target.id;
  recordResult(target.id, correct);

  if (correct) {
    sessionCorrect += 1;
    flash(target, "correct");
    setFeedback(`✓ ${target.name}!`, "ok");
    announce(target.id);
    rewardCorrect(target);              // stars / combo / fx / maybe a sticker
  } else {
    combo = 0; updateCombo();
    flash(chord, "wrong");
    if (state.settings.reveal !== "never") flash(target, "reveal");
    setFeedback(`${target.name} — ${chordLetters(target)} (${chordSolfege(target)})`, "no");
    announce(target.id);
  }
  trialIndex += 1; updateStatus(); saveState();

  if (!pendingReveal) setTimeout(nextTrial, correct ? 1100 : 1900);
}

// ---------- the fun layer ----------
function rewardCorrect(chord) {
  state.stars += 1; state.meter += 1; combo += 1;
  if (combo > state.bestCombo) state.bestCombo = combo;
  updateCombo();

  if (effects()) {
    const c = cardEls[chord.id];
    const r = c ? c.getBoundingClientRect()
                : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    fx.confetti(cx, cy, 16, 1);
    piano.sparkle();
    flyStar(cx, cy);
    if (COMBO_MILESTONES.includes(combo)) {
      piano.combo(combo);
      bigText(`${combo} in a row! 🔥`);
      fx.bigCelebration(["⭐", "✨", "🎉"]);
    }
  }

  if (state.meter >= METER_TARGET) { state.meter = 0; awardSticker(); }
  updateStarHud();
}

function awardSticker() {
  const owned = new Set(state.stickers);
  const avail = STICKERS.filter((s) => !owned.has(s));
  const sticker = (avail.length ? avail : STICKERS)[Math.floor(Math.random() * (avail.length ? avail.length : STICKERS.length))];
  state.stickers.push(sticker); saveState();
  el("stickerCount").textContent = state.stickers.length;
  pendingReveal = true; afterReveal = nextTrial;
  openReveal(sticker);
  if (effects()) { piano.fanfare(); fx.bigCelebration(["⭐", "✨", "🎉", "🏅"]); }
}

function openReveal(sticker) {
  pendingSticker = sticker;
  el("revealText").textContent = "A surprise sticker! Tap to open 🎁";
  el("revealEgg").classList.remove("hidden");
  el("revealSticker").classList.add("hidden");
  el("revealCloseBtn").classList.add("hidden");
  el("revealModal").classList.remove("hidden");
}

function flyStar(x, y) {
  const meter = document.querySelector(".star-meter");
  if (!meter) return;
  const mr = meter.getBoundingClientRect();
  const s = document.createElement("div");
  s.textContent = "⭐";
  s.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:34px;z-index:62;pointer-events:none;transform:translate(-50%,-50%)`;
  document.body.appendChild(s);
  const tx = mr.left + 22 - x, ty = mr.top + mr.height / 2 - y;
  s.animate(
    [{ transform: "translate(-50%,-50%) scale(1.2)", opacity: 1 },
     { transform: `translate(${tx}px,${ty}px) scale(.4)`, opacity: .2 }],
    { duration: 650, easing: "cubic-bezier(.4,0,.2,1)" }
  ).onfinish = () => s.remove();
}

function bigText(msg) {
  const b = el("bigText"); b.textContent = msg; b.classList.remove("hidden");
  b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
  clearTimeout(bigTextTimer); bigTextTimer = setTimeout(() => b.classList.add("hidden"), 1200);
}

function updateCombo() {
  const b = el("comboBadge");
  if (combo >= 2) {
    el("comboCount").textContent = combo; b.classList.remove("hidden");
    b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
  } else b.classList.add("hidden");
}
function updateStarHud() {
  el("starTotal").textContent = state.stars;
  el("starMeterFill").style.width = Math.round((state.meter / METER_TARGET) * 100) + "%";
}

function setFeedback(text, kind) {
  const f = el("feedback"); f.textContent = text; f.className = "feedback " + (kind || "");
}
function updateStatus() {
  if (mode === "learn") {
    el("status").textContent = "Listen & Learn — tap any color to hear it";
  } else {
    el("status").textContent =
      `Trial ${Math.min(trialIndex + 1, state.settings.trialsPerSession)} of ${state.settings.trialsPerSession}   •   ${sessionCorrect} correct`;
  }
}
function revealTarget() {
  if (!target) return;
  flash(target, "reveal"); announce(target.id);
}

function endSession() {
  state.sessionsDone += 1; saveState(); renderDashboard();
  const total = Object.values(sessionPerChord).reduce((a, s) => a + s.total, 0);
  const acc = total ? Math.round((sessionCorrect / total) * 100) : 0;
  el("summaryText").innerHTML =
    `🎉 Great job!<br><b>${sessionCorrect}/${total}</b> correct (${acc}%)<br>Session #${state.sessionsDone} complete`;
  el("summary").classList.remove("hidden");
  if (effects()) { piano.fanfare(); fx.bigCelebration(["🎉", "⭐", "✨"]); }
  maybeOfferUnlock();
}

// ---------- unlock guidance ----------
function maybeOfferUnlock() {
  const next = nextLockedChord(); if (!next) return;
  const total = Object.values(sessionPerChord).reduce((a, s) => a + s.total, 0);
  const acc = total ? sessionCorrect / total : 0;
  if (total >= 10 && acc >= 0.9) {
    const since = daysSinceUnlock();
    el("unlockText").innerHTML =
      `Accuracy is high! 🌟 Ready to add a new color: ` +
      `<b style="color:${next.color}">${next.mascot} ${next.name}</b>?` +
      (since !== null && since < 14
        ? `<br><span class="hint">Tip: the method suggests ~2 weeks between new colors (last added ${since} day${since === 1 ? "" : "s"} ago).</span>` : "");
    el("unlockPrompt").classList.remove("hidden");
  }
}
function daysSinceUnlock() {
  if (!state.lastUnlockISO) return null;
  return Math.floor((Date.now() - new Date(state.lastUnlockISO).getTime()) / 86400000);
}
function doUnlock() {
  const next = nextLockedChord(); if (!next) return;
  state.unlocked.push(next.id); state.lastUnlockISO = new Date().toISOString(); saveState();
  buildCards(); renderDashboard();
  el("unlockPrompt").classList.add("hidden");
  announce(next.id);
  if (effects()) { piano.fanfare(); bigText(`New color: ${next.name}! 🌈`); fx.bigCelebration(); }
}

// In-app confirm dialog. Native confirm()/alert() are disabled when the app
// runs from the iOS Home Screen (standalone), so we use our own modal.
let confirmResolve = null;
function askConfirm(html) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    el("confirmText").innerHTML = html;
    el("confirmModal").classList.remove("hidden");
  });
}
function closeConfirm(answer) {
  el("confirmModal").classList.add("hidden");
  const r = confirmResolve; confirmResolve = null;
  if (r) r(answer);
}

// Lock the most-recently-added color again (keeps at least one). Its accuracy
// history is preserved in case it's re-added later.
async function removeLastColor() {
  if (state.unlocked.length <= 1) return;
  const removed = chordById(state.unlocked[state.unlocked.length - 1]);
  const ok = await askConfirm(
    `Remove <b style="color:${removed.color}">${removed.name}</b> (${chordLetters(removed)})?` +
    `<br><span class="hint">Its progress is kept if you add it back.</span>`);
  if (!ok) return;
  state.unlocked.pop();
  state.lastUnlockISO = null;
  saveState();
  buildCards(); renderDashboard();
  startSession();   // restart cleanly so the removed color isn't mid-trial
}

// ---------- dashboard + sticker book ----------
function renderDashboard() {
  const d = el("progressList"); d.innerHTML = "";
  unlockedChords().forEach((chord) => {
    const s = statOf(chord.id);
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    const row = document.createElement("div"); row.className = "prow";
    row.innerHTML = `
      <span class="swatch" style="background:${chord.color}"></span>
      <span class="plabel">${chord.mascot} ${chord.name}</span>
      <span class="pbar"><span class="pfill" style="width:${pct}%;background:${chord.color}"></span></span>
      <span class="ppct">${s.total ? pct + "%" : "—"}</span>
      <span class="pn">${s.total} tries</span>`;
    d.appendChild(row);
  });
  el("sessionCount").textContent = state.sessionsDone;
  el("starsLifetime").textContent = state.stars;
  el("bestCombo").textContent = state.bestCombo;
  const next = nextLockedChord();
  el("nextColor").innerHTML = next
    ? `Next: <b style="color:${next.color}">${next.mascot} ${next.name}</b>` : `All 14 colors! 🏆`;
  el("addColorBtn").style.display = next ? "" : "none";
  el("removeColorBtn").style.display = state.unlocked.length > 1 ? "" : "none";
}

function renderStickerBook() {
  const grid = el("stickerGrid"); grid.innerHTML = "";
  const owned = new Set(state.stickers);
  STICKERS.forEach((s) => {
    const cell = document.createElement("div");
    cell.className = "sticker-cell " + (owned.has(s) ? "owned" : "locked");
    cell.textContent = owned.has(s) ? s : "❓";
    grid.appendChild(cell);
  });
  el("stickerProgress").textContent = `(${state.stickers.length}/${STICKERS.length})`;
}

// ---------- background ambiance ----------
function spawnBgNotes() {
  const box = el("bgnotes"); if (!box || box.childElementCount) return;
  const glyphs = ["🎵", "🎶", "⭐", "✨", "🎈"];
  for (let i = 0; i < 7; i++) {
    const n = document.createElement("div"); n.className = "bgnote";
    n.textContent = glyphs[(Math.random() * glyphs.length) | 0];
    n.style.left = (Math.random() * 100) + "vw";
    const dur = 14 + Math.random() * 16;
    n.style.animationDuration = dur + "s";
    n.style.animationDelay = (-Math.random() * dur) + "s";
    n.style.fontSize = (20 + Math.random() * 26) + "px";
    box.appendChild(n);
  }
}

// ---------- mode switching & wiring ----------
function setMode(m) {
  mode = m;
  ["learn", "quiz", "single"].forEach((x) => el("mode-" + x).classList.toggle("active", x === m));
  el("single-note-hint").classList.toggle("hidden", m !== "single");
  startSession();
}
function applySettingsToControls() {
  el("trials").value = state.settings.trialsPerSession;
  el("reveal").value = state.settings.reveal;
  el("speak").checked = state.settings.speak;
  el("arp").checked = state.settings.arpeggiate;
  el("effects").checked = state.settings.effects;
}

function startApp(doResume) {
  const begin = () => {
    el("startOverlay").classList.add("hidden");
    el("app").classList.remove("hidden");
    fx.init(); spawnBgNotes();
    buildCards(); renderDashboard(); applySettingsToControls();
    el("stickerCount").textContent = state.stickers.length;
    updateStarHud(); updateCombo();
    setMode("quiz");
  };
  if (doResume) {
    const btn = el("startBtn");
    btn.textContent = "Loading piano…"; btn.classList.remove("pulse"); btn.disabled = true;
    piano.resume().then(begin).catch(begin);
  } else begin();
}

function wire() {
  el("startBtn").addEventListener("click", () => startApp(true));

  el("mode-learn").addEventListener("click", () => setMode("learn"));
  el("mode-quiz").addEventListener("click", () => setMode("quiz"));
  el("mode-single").addEventListener("click", () => setMode("single"));

  el("playBtn").addEventListener("click", playTarget);
  el("nextBtn").addEventListener("click", () => { if (!pendingReveal) nextTrial(); });
  el("revealBtn").addEventListener("click", revealTarget);

  el("summaryAgain").addEventListener("click", startSession);
  el("unlockYes").addEventListener("click", doUnlock);
  el("unlockNo").addEventListener("click", () => el("unlockPrompt").classList.add("hidden"));
  el("addColorBtn").addEventListener("click", () => {
    const next = nextLockedChord(); if (!next) return;
    el("unlockText").innerHTML = `Add the next color: <b style="color:${next.color}">${next.mascot} ${next.name}</b>?`;
    el("unlockPrompt").classList.remove("hidden");
  });
  el("removeColorBtn").addEventListener("click", removeLastColor);

  // sticker reveal
  el("revealEgg").addEventListener("click", () => {
    el("revealEgg").classList.add("hidden");
    const s = el("revealSticker"); s.textContent = pendingSticker; s.classList.remove("hidden");
    el("revealText").textContent = "You got a new sticker!";
    el("revealCloseBtn").classList.remove("hidden");
    if (effects()) { piano.sparkle(); fx.emojiBurst(innerWidth / 2, innerHeight * 0.45, ["✨", "⭐"], 16, 1.1); }
  });
  el("revealCloseBtn").addEventListener("click", () => {
    el("revealModal").classList.add("hidden");
    pendingReveal = false;
    const cb = afterReveal; afterReveal = null;
    if (cb) setTimeout(cb, 200);
  });

  // sticker book
  el("stickerBtn").addEventListener("click", () => { renderStickerBook(); el("stickerBook").classList.remove("hidden"); });
  el("stickerCloseBtn").addEventListener("click", () => el("stickerBook").classList.add("hidden"));

  // settings
  el("trials").addEventListener("change", (e) => {
    state.settings.trialsPerSession = Math.max(5, Math.min(50, +e.target.value || 20)); saveState();
  });
  el("reveal").addEventListener("change", (e) => { state.settings.reveal = e.target.value; saveState(); });
  el("speak").addEventListener("change", (e) => { state.settings.speak = e.target.checked; saveState(); });
  el("arp").addEventListener("change", (e) => { state.settings.arpeggiate = e.target.checked; saveState(); });
  el("effects").addEventListener("change", (e) => { state.settings.effects = e.target.checked; saveState(); });
  el("resetBtn").addEventListener("click", async () => {
    const ok = await askConfirm("Reset ALL progress (stars, stickers, accuracy)?<br><span class=\"hint\">This cannot be undone.</span>");
    if (!ok) return;
    state = structuredClone(DEFAULT_STATE); saveState();
    buildCards(); renderDashboard(); applySettingsToControls();
    el("stickerCount").textContent = 0; updateStarHud(); setMode("quiz");
  });
  el("confirmYes").addEventListener("click", () => closeConfirm(true));
  el("confirmNo").addEventListener("click", () => closeConfirm(false));

  // keyboard shortcuts (parent)
  document.addEventListener("keydown", (e) => {
    if (el("app").classList.contains("hidden")) return;
    if (e.code === "Space") { e.preventDefault(); playTarget(); }
    else if (e.code === "Enter") { e.preventDefault(); if (!pendingReveal) nextTrial(); }
    else if (e.code === "KeyR") { revealTarget(); }
    else if (e.key >= "1" && e.key <= "9") {
      const list = unlockedChords(); const idx = +e.key - 1;
      if (list[idx]) onCardChosen(list[idx]);
    }
  });

  // PWA service worker (works on localhost/https; harmless elsewhere)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // Demo auto-start (for screenshots): index.html?demo=1
  if (new URLSearchParams(location.search).get("demo")) startApp(false);
}

document.addEventListener("DOMContentLoaded", wire);
