const { getPersona } = require('../shared/personas');

function selectLocalPack(persona, answers = {}) {
  const profile = getPersona(persona) || getPersona('chill');
  const pack = { persona: profile.id, ...structuredClone(profile.messages) };
  const preferredReminder = answers.reminder?.optionId;
  const breakChoice = answers['break-style']?.optionId;
  const waterChoice = answers.water?.optionId;

  if (preferredReminder === 'move' || breakChoice === 'walk') {
    pack.suggestions.unshift({ id: 'walk-break-personal', kind: 'break', text: profile.personalizedMessages?.walk || pack.suggestions[0].text });
  } else if (preferredReminder === 'water' || waterChoice === 'rarely') {
    pack.suggestions.unshift({ id: 'water-break-personal', kind: 'break', text: profile.personalizedMessages?.water || pack.suggestions[1]?.text || pack.suggestions[0].text });
  }

  if (answers.role?.optionId === 'software') {
    pack.encouragement.unshift({ id: 'software-craft-personal', kind: 'encouragement', text: profile.personalizedMessages?.software || pack.encouragement[0].text });
  }
  return pack;
}

module.exports = { selectLocalPack };
