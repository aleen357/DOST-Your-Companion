const questions = [
  { id: 'role', session: 0, group: 'Work', type: 'choice', prompt: 'Which best describes your day-to-day?', options: [
    { id: 'software', label: 'Building software', scores: { chill: 2 } }, { id: 'people', label: 'Working with people', scores: { bossy: 3 } }, { id: 'study', label: 'Learning or studying', scores: { random: 2 } }, { id: 'mix', label: 'A mix of different things', scores: { chill: 2 } }
  ] },
  { id: 'work-style', session: 0, group: 'Work', type: 'choice', prompt: 'What kind of workday feels best?', options: [
    { id: 'focused', label: 'A few focused blocks', scores: { chill: 2 } }, { id: 'varied', label: 'Lots of variety', scores: { random: 2 } }, { id: 'structured', label: 'A clear plan and milestones', scores: { bossy: 3 } }
  ] },
  { id: 'work-win', session: 0, group: 'Work', type: 'text', prompt: 'What is one small win you would like more often?' },
  { id: 'break-style', session: 0, group: 'Habits', type: 'choice', prompt: 'What kind of break sounds most refreshing?', options: [
    { id: 'walk', label: 'A short walk or stretch', scores: { chill: 2 } }, { id: 'quiet', label: 'A quiet minute away', scores: { chill: 2 } }, { id: 'reset', label: 'A quick tidy-up', scores: { bossy: 3 } }
  ] },
  { id: 'water', session: 0, group: 'Habits', type: 'choice', prompt: 'How often do you remember to drink water?', options: [
    { id: 'often', label: 'Most of the time', scores: { chill: 2 } }, { id: 'sometimes', label: 'When I remember', scores: { random: 2 } }, { id: 'rarely', label: 'I could use a nudge', scores: { bossy: 3 } }
  ] },
  { id: 'ideal', session: 1, group: 'Ideals', type: 'choice', prompt: 'What would you most like a little more of?', options: [
    { id: 'energy', label: 'Energy and movement', scores: { bossy: 3 } }, { id: 'learning', label: 'Learning something useful', scores: { chill: 2 } }, { id: 'balance', label: 'A calmer balance', scores: { random: 2 } }
  ] },
  { id: 'skill', session: 1, group: 'Ideals', type: 'text', prompt: 'What is one skill you would enjoy getting better at?' },
  { id: 'motivation', session: 1, group: 'Personality', type: 'choice', prompt: 'What kind of encouragement works for you?', options: [
    { id: 'gentle', label: 'Gentle and reassuring', scores: { chill: 2 } }, { id: 'direct', label: 'Clear and direct', scores: { bossy: 3 } }, { id: 'surprise', label: 'A bit of both', scores: { random: 2 } }
  ] },
  { id: 'tone', session: 1, group: 'Personality', type: 'choice', prompt: 'When a task feels big, what helps you start?', options: [
    { id: 'tiny', label: 'Make the first step tiny', scores: { chill: 2 } }, { id: 'deadline', label: 'Set a short timer', scores: { bossy: 3 } }, { id: 'company', label: 'Have someone cheer me on', scores: { random: 2 } }
  ] },
  { id: 'joy', session: 1, group: 'Personality', type: 'choice', prompt: 'What usually lifts your mood?', options: [
    { id: 'outside', label: 'Fresh air', scores: { chill: 2 } }, { id: 'progress', label: 'Seeing progress', scores: { bossy: 3 } }, { id: 'laugh', label: 'A little laugh', scores: { random: 2 } }
  ] },
  { id: 'hurdle', session: 2, group: 'Hurdles', type: 'choice', prompt: 'What most often gets in the way of a break?', options: [
    { id: 'forget', label: 'I lose track of time', scores: { bossy: 3 } }, { id: 'busy', label: 'I feel too busy', scores: { chill: 2 } }, { id: 'momentum', label: 'I want to finish one more thing', scores: { random: 2 } }
  ] },
  { id: 'scroll', session: 2, group: 'Hurdles', type: 'choice', prompt: 'When you reach for your phone, what are you often looking for?', options: [
    { id: 'rest', label: 'A quick rest', scores: { chill: 2 } }, { id: 'interest', label: 'Something interesting', scores: { random: 2 } }, { id: 'connection', label: 'A connection with someone', scores: { chill: 2 } }
  ] },
  { id: 'help', session: 2, group: 'Hurdles', type: 'text', prompt: 'What is one small thing that could make a busy day easier?' },
  { id: 'reminder', session: 2, group: 'Ideals', type: 'choice', prompt: 'Which reminder would you welcome most?', options: [
    { id: 'move', label: 'Stand up and move a little', scores: { bossy: 3 } }, { id: 'water', label: 'Take a water break', scores: { chill: 2 } }, { id: 'encourage', label: 'A kind word about my progress', scores: { random: 2 } }
  ] },
  { id: 'timing', session: 2, group: 'Habits', type: 'choice', prompt: 'When would a friendly nudge be most useful?', options: [
    { id: 'midday', label: 'Around the middle of my day', scores: { random: 2 } }, { id: 'long-session', label: 'After I have focused for a while', scores: { bossy: 3 } }, { id: 'anytime', label: 'A gentle surprise is fine', scores: { chill: 2 } }
  ] }
];

module.exports = { questions };
