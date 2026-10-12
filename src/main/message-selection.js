const { getPersona } = require('../shared/personas');

function selectLocalPack(persona, answers = {}) {
  const profile = getPersona(persona) || getPersona('chill');
  const pack = { persona: profile.id, ...structuredClone(profile.messages) };
  const preferredReminder = answers.reminder?.optionId;
  const breakChoice = answers['break-style']?.optionId;
  const waterChoice = answers.water?.optionId;

  if (preferredReminder === 'move' || breakChoice === 'walk') {
    pack.suggestions.unshift({ id: 'walk-break', kind: 'break', text: profile.personalizedMessages?.walk || pack.suggestions[0].text });
  } else if (preferredReminder === 'water' || waterChoice === 'rarely') {
    pack.suggestions.unshift({ id: 'water-break', kind: 'break', text: profile.personalizedMessages?.water || pack.suggestions[1]?.text || pack.suggestions[0].text });
  }

  if (answers.role?.optionId === 'software') {
    pack.encouragement.unshift({ id: 'software-craft-personal', kind: 'encouragement', text: profile.personalizedMessages?.software || pack.encouragement[0].text });
  }
  return pack;
}

function selectReminder(guest) {
  const followUp = guest.followUpState === 'check-in';
  const variety = guest.nextReminderKind === 'variety' && !followUp;
  const stage = followUp ? 'follow-up' : variety ? 'variety' : 'suggestion';
  const pack = guest.messagePack;
  let candidates = followUp
    ? (pack.followUps?.length ? pack.followUps : pack.suggestions)
    : variety
      ? [...pack.encouragement, ...pack.wisdom, ...pack.jokes]
      : pack.suggestions;

  if (!candidates?.length) candidates = pack.suggestions;
  if (!candidates?.length) throw new Error('This DOST has no prepared reminder messages.');

  const avoidId = variety ? guest.lastReminderId : followUp ? null : guest.lastSuggestionId;
  if (candidates.length > 1 && avoidId) {
    const different = candidates.filter((message) => message.id !== avoidId);
    if (different.length) candidates = different;
  }
  const index = variety ? Math.floor(Math.random() * candidates.length) : 0;
  return { ...structuredClone(candidates[index]), stage };
}

module.exports = { selectLocalPack, selectReminder };
