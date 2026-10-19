const questions = [
  {
    id: 'daily-roles', session: 0, group: 'Daily life', type: 'multi', maxSelections: 4,
    prompt: 'Which parts of life take up most of your time these days?',
    helperText: 'Choose up to four.',
    options: [
      { id: 'software', label: 'Technology or software work' },
      { id: 'paid-work', label: 'Other paid work' },
      { id: 'study', label: 'Studying or learning' },
      { id: 'care', label: 'Caring for someone' },
      { id: 'home', label: 'Managing a home' },
      { id: 'search', label: 'Looking for work' },
      { id: 'volunteer', label: 'Volunteering or community work' },
      { id: 'other', label: 'Something else' }
    ]
  },
  {
    id: 'day-shape', session: 0, group: 'Daily life', type: 'choice',
    prompt: 'Which best describes a typical weekday for you?',
    options: [
      { id: 'predictable', label: 'Mostly predictable' },
      { id: 'shifts', label: 'Shifts or changing hours' },
      { id: 'interruptions', label: 'Lots of interruptions' },
      { id: 'self-directed', label: 'Mostly self-directed' },
      { id: 'varies', label: 'It varies day to day' },
      { id: 'unsure', label: 'Not sure / prefer not to say' }
    ]
  },
  {
    id: 'energy-window', session: 0, group: 'Daily life', type: 'choice',
    prompt: 'When do you usually have the most energy?',
    options: [
      { id: 'morning', label: 'Morning' },
      { id: 'midday', label: 'Midday' },
      { id: 'evening', label: 'Evening' },
      { id: 'changes', label: 'It changes' },
      { id: 'unsure', label: 'Not sure / prefer not to say' }
    ]
  },
  {
    id: 'reminder-topics', session: 0, group: 'Daily life', type: 'multi', maxSelections: 4,
    prompt: 'What would you welcome an occasional reminder about?',
    helperText: 'Choose up to four.', exclusiveOptionIds: ['unsure'],
    options: [
      { id: 'move', label: 'Move or stretch' },
      { id: 'water', label: 'Have some water' },
      { id: 'break', label: 'Take a real break' },
      { id: 'start', label: 'Get started on a task' },
      { id: 'stop', label: 'Wind down for the day' },
      { id: 'connect', label: 'Connect with someone' },
      { id: 'hobby', label: 'Make time for a hobby' },
      { id: 'unsure', label: 'Nothing in particular right now' }
    ]
  },
  {
    id: 'restorative-break', session: 0, group: 'Daily life', type: 'multi', maxSelections: 3,
    prompt: 'What kind of break usually feels restorative?',
    helperText: 'Choose up to three.', exclusiveOptionIds: ['varies'],
    options: [
      { id: 'walk', label: 'A walk or a little movement' },
      { id: 'quiet', label: 'Quiet time' },
      { id: 'chat', label: 'A chat with someone' },
      { id: 'snack', label: 'A snack or drink' },
      { id: 'music', label: 'Music or entertainment' },
      { id: 'outside', label: 'Time outdoors' },
      { id: 'varies', label: 'It depends' }
    ]
  },
  {
    id: 'easier-goals', session: 1, group: 'Goals', type: 'multi', maxSelections: 3,
    prompt: 'What would you most like to make a little easier?',
    helperText: 'Choose up to three.', exclusiveOptionIds: ['unsure'],
    options: [
      { id: 'start', label: 'Getting started' },
      { id: 'focus', label: 'Staying focused' },
      { id: 'breaks', label: 'Taking breaks' },
      { id: 'routine', label: 'Keeping a routine' },
      { id: 'learning', label: 'Learning something new' },
      { id: 'self-time', label: 'Making time for myself' },
      { id: 'wind-down', label: 'Winding down' },
      { id: 'unsure', label: 'Nothing specific right now' }
    ]
  },
  {
    id: 'monthly-change', session: 1, group: 'Goals', type: 'text', canDecline: true,
    prompt: 'If one small change helped this month, what would you hope it was?',
    helperText: 'A sentence or two is plenty. Please leave out private details.'
  },
  {
    id: 'practice-topics', session: 1, group: 'Goals', type: 'multi', maxSelections: 3,
    prompt: 'What would you enjoy learning or practicing more often?',
    helperText: 'Choose up to three.', exclusiveOptionIds: ['nothing'],
    options: [
      { id: 'work-skill', label: 'A skill for work' },
      { id: 'study-topic', label: 'A study subject' },
      { id: 'creative', label: 'Something creative' },
      { id: 'life-skill', label: 'A practical everyday skill' },
      { id: 'communication', label: 'Communication' },
      { id: 'other', label: 'Something else' },
      { id: 'nothing', label: 'Nothing specific right now' }
    ]
  },
  {
    id: 'social-style', session: 1, group: 'Social style', type: 'choice',
    prompt: 'How do you usually describe your social energy?',
    options: [
      { id: 'introvert', label: 'Introvert' },
      { id: 'extrovert', label: 'Extrovert' },
      { id: 'ambivert', label: 'Ambivert' },
      { id: 'depends', label: 'It depends on the situation' },
      { id: 'no-label', label: 'I do not use these labels' },
      { id: 'unsure', label: 'Not sure / prefer not to say' }
    ]
  },
  {
    id: 'recharge-style', session: 1, group: 'Social style', type: 'multi', maxSelections: 3,
    prompt: 'After a demanding day, what tends to help you recharge?',
    helperText: 'Choose up to three.',
    options: [
      { id: 'alone', label: 'Time alone' },
      { id: 'one-person', label: 'Time with one person' },
      { id: 'group', label: 'Time with a group' },
      { id: 'activity', label: 'An activity or exercise' },
      { id: 'routine', label: 'A familiar routine' },
      { id: 'rest', label: 'Quiet rest' },
      { id: 'varies', label: 'It varies' }
    ]
  },
  {
    id: 'obstacles', session: 2, group: 'Hurdles', type: 'multi', maxSelections: 4,
    prompt: 'What most often makes the things you want to do harder?',
    helperText: 'Choose up to four.',
    options: [
      { id: 'energy', label: 'Low energy' },
      { id: 'interruptions', label: 'Interruptions' },
      { id: 'uncertainty', label: 'Not knowing where to start' },
      { id: 'too-many', label: 'Too many things to do' },
      { id: 'perfection', label: 'Worry about doing it badly' },
      { id: 'forgetting', label: 'Forgetting' },
      { id: 'time', label: 'Not enough time' },
      { id: 'other', label: 'Something else' }
    ]
  },
  {
    id: 'stuck-response', session: 2, group: 'Hurdles', type: 'choice-text', allowText: true,
    prompt: 'When you get stuck, what usually happens next?',
    helperText: 'Choose one. You can add a little context if you want.',
    options: [
      { id: 'switch', label: 'I switch to something easier' },
      { id: 'think', label: 'I keep thinking about it' },
      { id: 'help', label: 'I ask someone for help' },
      { id: 'break', label: 'I take a break' },
      { id: 'small-step', label: 'I make the first step smaller' },
      { id: 'depends', label: 'It depends' }
    ]
  },
  {
    id: 'nudge-tone', session: 2, group: 'Support style', type: 'choice',
    prompt: 'What kind of nudge would you rather get from Dost?',
    options: [
      { id: 'gentle', label: 'Gentle and reassuring', scores: { chill: 2 } },
      { id: 'direct', label: 'Clear and direct', scores: { bossy: 3 } },
      { id: 'playful', label: 'Playful and brief', scores: { chill: 2 } },
      { id: 'energetic', label: 'Energetic and challenging', scores: { bossy: 3 } },
      { id: 'depends', label: 'It depends on the moment', scores: { random: 2 } }
    ]
  },
  {
    id: 'follow-up-tone', session: 2, group: 'Support style', type: 'choice',
    prompt: 'If you dismiss a reminder, what should Dost do next time?',
    options: [
      { id: 'space', label: 'Give me space and try something different later', scores: { chill: 2 } },
      { id: 'check-in', label: 'Check in directly next time', scores: { bossy: 3 } },
      { id: 'joke', label: 'Send a joke or kind word later', scores: { chill: 2 } },
      { id: 'practical', label: 'Keep it short and practical', scores: { bossy: 3 } },
      { id: 'depends', label: 'It depends on the moment', scores: { random: 2 } }
    ]
  },
  {
    id: 'encouragement-note', session: 2, group: 'Support style', type: 'text', canDecline: true,
    prompt: 'What is one thing you would like Dost to understand about encouraging you?',
    helperText: 'A short note is enough. Please leave out private details.'
  }
];

module.exports = { questions, questionnaireVersion: 2 };
