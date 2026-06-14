# Pitch Perfect — Parent's Guide

A local Mac app for training **absolute pitch** ("perfect pitch") in a young
child, based on the **Eguchi Chord Identification Method (CIM)** — the only
approach with peer-reviewed evidence behind it.

---

## How to run it

**Easiest:** double-click **`start.command`** in this folder. It launches a tiny
local web server and opens the app in Chrome. Close the Terminal window to stop.

> First time: macOS may say the file is from an unidentified developer.
> Right-click `start.command` → **Open** → **Open**, just once.

**Alternative:** open Terminal in this folder and run
`python3 -m http.server 8723`, then visit `http://localhost:8723` in Chrome.
You can also just double-click `index.html`, but the server route is more reliable.

Click **▶ Play** once to enable sound (browsers require a tap before playing audio).

### Install it as a real iPad app (recommended)

In **Safari** on the iPad, open the app's address, then tap the **Share** button →
**Add to Home Screen**. It installs with its own icon and runs **full-screen, no
browser bars** — just like an App Store app. (Remote access over Tailscale works;
see the chat for the address.)

### The fun layer (rewards)

To keep your toddler engaged, correct answers trigger **confetti, sparkles, and a
star** that flies into a meter at the top. Filling the meter wins a **collectible
sticker** (tap the 🥚 to hatch it), viewable any time via the **🏅 sticker book**.
Streaks build a **combo** with rising celebration sounds. None of this changes the
training — it's reward on top. You can turn it all off in **⚙️ Settings →
Celebrations & sound effects** if it's ever too stimulating.

---

## The science, briefly

- **Absolute pitch is learnable — but only in early childhood.** There is a
  *critical period*: it's reliably acquirable before ~6 years old, and most
  readily before 4. About **40%** of people who began musical training before
  age 4 report having AP, dropping to ~3% for those who start after age 9.
  **A 2-year-old is in the ideal window.**
- **The method that works is chord identification, not single notes.**
  In Sakakibara's 2014 longitudinal study, **all 24 children (aged 2–6)** who
  completed CIM training acquired absolute pitch.
- **Why chords first?** If you start with single notes, children tend to learn
  *relative* pitch (naming a note by its distance from another). Whole chords
  give each pitch a fixed, absolute "color." Children first recognize a chord by
  its overall sound, then gradually start hearing the individual notes inside it
  — and *that* shift is the birth of absolute pitch. Single notes are introduced
  only much later.
- **Fixed tuning matters.** Every note plays from **real recorded grand-piano
  samples** (the Salamander Grand, bundled in `samples/piano/`), pitch-anchored to
  exact **A4 = 440 Hz**, so the pitches your child learns are stable and lifelike.
  The samples load once (~2 MB) on first launch, then run fully offline.

---

## The daily routine (this is the real commitment)

The evidence-based protocol is **short, frequent, playful, and consistent**:

| What | Guideline |
|------|-----------|
| Session length | **2–3 minutes** (the app defaults to 20 trials) |
| Frequency | **~5 short sessions per day** |
| Order | Chords always in **random** order — never the same sequence |
| New colors | Add **one at a time**, only after the current set is near-perfect, and **space new colors ≥2 weeks apart** |
| Duration | Plan for **about 2 years** of regular practice |

Keep it joyful. This is a game you play *together*, not a test. Stop before he's
bored. Consistency beats intensity at this age.

---

## How to run a session with a 2-year-old

The app is **parent-led**. You drive it; your child responds.

1. **Quiz mode** (the core loop): tap **▶** (or press **Space**) to play a chord.
2. Your child responds — out loud ("Red!"), by pointing at a card, or just
   reacting. **You tap the card** he chose (or press number keys **1–9**).
3. The app celebrates a correct answer and gently shows the right color either
   way. Press **Enter** (or **⏭**) for the next one.

**Early weeks = exposure, not testing.** A 2-year-old won't name colors at first.
Use **Listen & Learn** mode: the app plays a chord and immediately shows and says
its color. Just let him soak it in. Tap any card to hear it. Move to Quiz mode
once he starts pointing or naming colors on his own.

**Single Note** mode is *advanced* — only once all white-key colors are solid.
It plays the chord, then isolates its top note, building the bridge from "chord
color" to "individual note."

### Keyboard shortcuts (for you)
- **Space** — play / replay the chord
- **1–9** — choose the card in that position (the child's answer)
- **R** — reveal the answer
- **Enter** — next trial

---

## The colors (order they unlock)

The app starts with **Red** only and unlocks the rest one at a time. When the
active set is answered at ≥90%, it offers the next color — you decide when
(remember the ~2-week spacing). Mastering the 9 white-key colors means your child
has absolute pitch for every white-key note; the 5 black-key colors complete it.

**White-key chords:** 🦊 Red (C-E-G) · 🐥 Yellow (C-F-A) · 🐳 Blue (B-D-G) ·
🐈‍⬛ Black (A-C-F) · 🐸 Green (D-G-B) · 🐯 Orange (E-G-C) · 🐙 Purple (F-A-C) ·
🐷 Pink (G-B-D) · 🐻 Brown (G-C-E)

**Black-key chords:** 🐘 Gray · 🐫 Tan · 🐢 Mint · 🦄 Lavender · 🐦 Sky

---

## Tips

- **Same time, same place** each day helps build the habit.
- **One new color every couple of weeks**, not faster — accuracy first.
- Celebrate effort, never pressure. If he's not into it today, stop.
- Progress (accuracy per color, sessions done) is saved automatically in the
  browser. **Use the same browser/profile** each time. "Reset all progress" in
  Settings wipes it.

---

## A realistic word

This works, but it asks a lot of *you*: a couple of minutes, several times a day,
for around two years. The app removes the friction — accurate tuning, random
order, progress tracking, and a toddler-friendly interface — but the daily
showing-up is the active ingredient. Have fun with it. 🎵

---

## Sources

- Sakakibara, A. (2014). *A longitudinal study of the process of acquiring
  absolute pitch: A practical report of training with the 'chord identification
  method'.* **Psychology of Music.**
  <https://journals.sagepub.com/doi/abs/10.1177/0305735612463948>
- *An elusive musical gift could be at children's fingertips* (Washington Post,
  on the Eguchi method).
  <https://www.washingtonpost.com/wp-dyn/content/article/2009/07/26/AR2009072602350.html>
- *Elusive Musical Gift Can be Taught to Very Young* — Good News Network.
  <https://www.goodnewsnetwork.org/teaching-perfect-pitch/>
- Eguchi method overview — Chromatone.center.
  <https://chromatone.center/theory/notes/ear-traning/eguchi/>
- Reference open-source CIM trainer (chord/color set).
  <https://pganssle.github.io/cim/>
- *Why are people able to acquire absolute pitch only during early childhood?*
  <https://www.researchgate.net/publication/285940742>
