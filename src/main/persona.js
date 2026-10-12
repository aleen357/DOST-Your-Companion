const { getPersonaIds } = require('../shared/personas');

function addScore(scores, mapping) {
  for (const [personaId, points] of Object.entries(mapping)) {
    if (personaId !== 'random' && Object.hasOwn(scores, personaId) && Number.isFinite(points)) {
      scores[personaId] += points;
    }
  }
  if (mapping.random) {
    const eligiblePersonas = getPersonaIds();
    const target = eligiblePersonas[Math.floor(Math.random() * eligiblePersonas.length)];
    scores[target] += mapping.random;
  }
}

function choosePersona(scores) {
  const candidates = Object.entries(scores);
  if (!candidates.length) return getPersonaIds()[0];
  const highestScore = Math.max(...candidates.map(([, score]) => score));
  const tied = candidates.filter(([, score]) => score === highestScore).map(([id]) => id);
  return tied[Math.floor(Math.random() * tied.length)];
}

module.exports = { addScore, choosePersona };
