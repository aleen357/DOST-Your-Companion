const { getPersona } = require('../shared/personas');

function selectLocalPack(persona, answers = {}) {
  const profile = getPersona(persona) || getPersona('chill');
  const pack = { persona: profile.id, ...structuredClone(profile.messages) };
  const selectedIds = (answer) => answer?.optionIds || (answer?.optionId ? [answer.optionId] : []);
  const reminderChoices = selectedIds(answers['reminder-topics']);
  const breakChoices = selectedIds(answers['restorative-break'] || answers['break-style']);
  const preferredReminder = answers.reminder?.optionId;
  const waterChoice = answers.water?.optionId;

  if (preferredReminder === 'move' || reminderChoices.includes('move') || breakChoices.includes('walk')) {
    pack.suggestions.unshift({ id: 'walk-break', kind: 'break', text: profile.personalizedMessages?.walk || pack.suggestions[0].text });
  } else if (preferredReminder === 'water' || reminderChoices.includes('water') || waterChoice === 'rarely') {
    pack.suggestions.unshift({ id: 'water-break', kind: 'break', text: profile.personalizedMessages?.water || pack.suggestions[1]?.text || pack.suggestions[0].text });
  }

  if (selectedIds(answers.role).includes('software') || selectedIds(answers['daily-roles']).includes('software')) {
    pack.encouragement.unshift({ id: 'software-craft-personal', kind: 'encouragement', text: profile.personalizedMessages?.software || pack.encouragement[0].text });
  }
  return pack;
}

function chooseUnused(candidates, usedIds = []) {
  if (!candidates?.length) return null;
  let available = candidates.filter((message) => !usedIds.includes(message.id));
  if (!available.length) available = candidates;
  return available[Math.floor(Math.random() * available.length)];
}

function selectReminder(guest, lane = 'habit') {
  const pack = guest.messagePack;
  if (lane === 'light') {
    const encouragementNext = guest.nextLightKind === 'encouragement' && pack.encouragement?.length;
    const candidates = encouragementNext ? pack.encouragement : [...(pack.wisdom || []), ...(pack.jokes || [])];
    const message = chooseUnused(candidates, guest.usedLightMessageIds);
    if (!message) throw new Error('This DOST has no light companion messages.');
    return { ...structuredClone(message), stage: encouragementNext ? 'encouragement' : 'light', scheduleLane: 'light' };
  }

  const followUp = guest.followUpState === 'check-in';
  const candidates = followUp
    ? (pack.followUps?.length ? pack.followUps : pack.suggestions)
    : pack.suggestions;
  const message = chooseUnused(candidates, guest.usedHabitMessageIds);
  if (!message) throw new Error('This DOST has no habit reminder messages.');
  return { ...structuredClone(message), stage: followUp ? 'follow-up' : 'suggestion', scheduleLane: 'habit' };
}

module.exports = { selectLocalPack, selectReminder };
