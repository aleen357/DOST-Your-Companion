const personas = {
  chill: {
    id: 'chill',
    name: 'Dost',
    label: 'Chill',
    theme: 'chill',
    introduction: 'I’m Dost. We’ll take it one step at a time.',
    palette: { body: '#70d4a5', line: '#23594f', shine: '#eafff4', blush: '#f4979d' },
    face: { brows: 'none' },
    messages: {
      suggestions: [
        { id: 'walk-break', kind: 'break', text: 'A short walk could make room for your next good idea.' },
        { id: 'water-break', kind: 'break', text: 'A sip of water and a little stretch might help.' }
      ],
      encouragement: [
        { id: 'steady-progress', kind: 'encouragement', text: 'Small, steady progress still counts. You are doing okay.' },
        { id: 'coding-craft', kind: 'encouragement', text: 'Every bug you understand makes you a stronger engineer.' }
      ],
      followUps: [{ id: 'did-you-break', kind: 'follow-up', text: 'Hey, did you get a chance to take a little break?' }],
      wisdom: [{ id: 'one-step', kind: 'wisdom', text: 'A small step is still a step toward the thing you want.' }],
      jokes: [{ id: 'debug-joke', kind: 'joke', text: 'Why did the developer go broke? Too many cache misses.' }]
    },
    personalizedMessages: {
      walk: 'You mentioned enjoying a walk. Want to take a few minutes outside?',
      water: 'A water break sounded helpful to you. Keep a glass nearby?',
      software: 'The care you put into each fix is how your software craft grows.'
    }
  },
  bossy: {
    id: 'bossy',
    name: 'Dost',
    label: 'Bossy',
    theme: 'bossy',
    introduction: 'I’m Dost. Let’s make your day count.',
    palette: { body: '#f28f75', line: '#693e45', shine: '#fff0e8', blush: '#d87572' },
    face: { brows: 'confident' },
    messages: {
      suggestions: [
        { id: 'walk-break', kind: 'break', text: 'Stand up. Take a 15-minute walk. Your code will still be here.' },
        { id: 'water-break', kind: 'break', text: 'Water check. Get a glass before you start the next task.' }
      ],
      encouragement: [
        { id: 'steady-progress', kind: 'encouragement', text: 'You showed up and made progress. Give yourself credit.' },
        { id: 'coding-craft', kind: 'encouragement', text: 'You can learn the pattern. One clear example at a time.' }
      ],
      followUps: [{ id: 'did-you-break', kind: 'follow-up', text: 'Did you take that break? If not, let’s try a different one next time.' }],
      wisdom: [{ id: 'one-step', kind: 'wisdom', text: 'Consistency beats waiting for the perfect moment.' }],
      jokes: [{ id: 'debug-joke', kind: 'joke', text: 'There are 10 kinds of people: those who get binary and those who do not.' }]
    },
    personalizedMessages: {
      walk: 'You said movement helps. Take a 15-minute walk before the next task.',
      water: 'You asked for a water nudge. Go fill a glass now.',
      software: 'You are building software. Keep learning one pattern and one clean fix at a time.'
    }
  }
};

function getPersonaIds() {
  return Object.keys(personas);
}

function getPersona(id) {
  return personas[id] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { personas, getPersonaIds, getPersona };
} else if (typeof window !== 'undefined') {
  window.DostPersonas = Object.freeze({ personas, getPersonaIds, getPersona });
}
