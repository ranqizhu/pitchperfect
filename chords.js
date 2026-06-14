// chords.js — the Eguchi Chord Identification Method chord set.
//
// Each chord is identified by a COLOR (the primary label a toddler learns),
// a friendly mascot, and a solfège phrase. Notes are given as [letter, octave]
// in scientific pitch notation (C4 = middle C, A4 = 440 Hz).
//
// Chords are introduced STRICTLY in the order listed below — one at a time.
// The 9 white-key chords come first (mastering them = absolute pitch for every
// white-key note). The 5 black-key chords complete the full chromatic set.

const WHITE_CHORDS = [
  { id: "red",    color: "#e53935", text: "#ffffff", name: "Red",    mascot: "🦊", notes: [["C",4],["E",4],["G",4]] },
  { id: "yellow", color: "#fbc02d", text: "#3a2f00", name: "Yellow", mascot: "🐥", notes: [["C",4],["F",4],["A",4]] },
  { id: "blue",   color: "#1e88e5", text: "#ffffff", name: "Blue",   mascot: "🐳", notes: [["B",3],["D",4],["G",4]] },
  { id: "black",  color: "#263238", text: "#ffffff", name: "Black",  mascot: "🐈‍⬛", notes: [["A",3],["C",4],["F",4]] },
  { id: "green",  color: "#43a047", text: "#ffffff", name: "Green",  mascot: "🐸", notes: [["D",4],["G",4],["B",4]] },
  { id: "orange", color: "#fb8c00", text: "#3a2200", name: "Orange", mascot: "🐯", notes: [["E",4],["G",4],["C",5]] },
  { id: "purple", color: "#8e24aa", text: "#ffffff", name: "Purple", mascot: "🐙", notes: [["F",4],["A",4],["C",5]] },
  { id: "pink",   color: "#ec407a", text: "#ffffff", name: "Pink",   mascot: "🐷", notes: [["G",4],["B",4],["D",5]] },
  { id: "brown",  color: "#6d4c41", text: "#ffffff", name: "Brown",  mascot: "🐻", notes: [["G",4],["C",5],["E",5]] },
];

const BLACK_CHORDS = [
  { id: "gray",    color: "#9e9e9e", text: "#1a1a1a", name: "Gray",     mascot: "🐘", notes: [["C#",4],["F",4],["G#",4]] },
  { id: "tan",     color: "#cd9b6c", text: "#2a1c00", name: "Tan",      mascot: "🐫", notes: [["D#",4],["G",4],["A#",4]] },
  { id: "ltgreen", color: "#aed581", text: "#1f3500", name: "Mint",     mascot: "🐢", notes: [["F#",4],["A#",4],["C#",5]] },
  { id: "ltpurple",color: "#b39ddb", text: "#241338", name: "Lavender", mascot: "🦄", notes: [["G#",4],["C",5],["D#",5]] },
  { id: "skyblue", color: "#4fc3f7", text: "#00303f", name: "Sky",      mascot: "🐦", notes: [["A#",3],["D",4],["F",4]] },
];

// Full ordered list. White-key chords first, then black-key.
const ALL_CHORDS = [...WHITE_CHORDS, ...BLACK_CHORDS];

// Solfège names (fixed-do) for display.
const SOLFEGE = {
  "C": "do", "C#": "di", "D": "re", "D#": "ri", "E": "mi", "F": "fa",
  "F#": "fi", "G": "so", "G#": "si", "A": "la", "A#": "li", "B": "ti",
};

function chordSolfege(chord) {
  return chord.notes.map(([n]) => SOLFEGE[n]).join("-");
}

function chordLetters(chord) {
  return chord.notes.map(([n]) => n).join("-");
}

function chordById(id) {
  return ALL_CHORDS.find((c) => c.id === id);
}
