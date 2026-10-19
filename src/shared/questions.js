// Questionnaire v3: indirect, scene-based questions. Scores and hints never reach the
// renderer. Scene questions (those with a theme) are never shown to the local model as
// written: it only sees the theme and the picked option's hint, so it cannot echo the scenes.
// Every option question takes an optional free-text answer, and text alone is enough when
// none of the options fit.
const B = { bossy: 2 };
const C = { chill: 2 };
const R = { random: 2 };

const questions = [
  {
    id: 'daily-roles', session: 0, group: 'Your days', type: 'multi', maxSelections: 4, allowText: true,
    prompt: 'If DOST peeked at your week, where would it find you most?',
    helperText: 'Choose up to four, or tell DOST in your own words.',
    textPlaceholder: 'Anything else that fills your week…',
    options: [
      { id: 'software', label: 'Tech or software work' },
      { id: 'desk-work', label: 'Other desk or office work' },
      { id: 'hands-on', label: 'Work on my feet or with my hands' },
      { id: 'study', label: 'Studying or learning' },
      { id: 'care', label: 'Looking after someone' },
      { id: 'home', label: 'Running a home' },
      { id: 'search', label: 'Looking for work' },
      { id: 'time-off', label: 'Taking time off' }
    ]
  },
  {
    id: 'restorative-break', session: 0, group: 'Your days', type: 'multi', maxSelections: 2, allowText: true,
    prompt: 'A free afternoon falls from the sky. You’d most likely…',
    helperText: 'Choose up to two.',
    textPlaceholder: 'Or what you’d really do…',
    options: [
      { id: 'walk', label: 'Go for a walk or move around' },
      { id: 'outside', label: 'Sit somewhere outdoors' },
      { id: 'quiet', label: 'Nap or do nothing at all' },
      { id: 'chat', label: 'Call or meet someone' },
      { id: 'music', label: 'Music, a show or a game' },
      { id: 'make', label: 'Make or fix something' },
      { id: 'snack', label: 'Snack and wander' }
    ]
  },
  {
    id: 'reminder-topics', session: 0, group: 'Your days', type: 'multi', maxSelections: 4, allowText: true,
    prompt: 'DOST can tap your shoulder about a few things. Which would you secretly thank it for?',
    helperText: 'Choose up to four, or add your own.', exclusiveOptionIds: ['unsure'],
    textPlaceholder: 'Something else DOST could remind you about…',
    options: [
      { id: 'move', label: 'Move or stretch' },
      { id: 'water', label: 'Drink some water' },
      { id: 'break', label: 'Take a real break' },
      { id: 'start', label: 'Start the thing' },
      { id: 'stop', label: 'Wind down for the day' },
      { id: 'connect', label: 'Message someone' },
      { id: 'hobby', label: 'Make time for a hobby' },
      { id: 'unsure', label: 'Nothing yet, surprise me' }
    ]
  },
  {
    id: 'todo-weather', theme: 'how their to-do list feels', session: 0, group: 'Your days', type: 'choice', allowText: true,
    prompt: 'If your to-do list were weather today, it would be…',
    textPlaceholder: 'Or describe your own forecast…',
    options: [
      { id: 'sunny', label: 'Sunny and short', hint: 'feels on top of things' },
      { id: 'fog', label: 'Foggy, I can’t see where to start', scores: B, hint: 'procrastination: unsure where to start' },
      { id: 'storm', label: 'A storm, way too much at once', scores: C, hint: 'scared: feels overwhelmed' },
      { id: 'drizzle', label: 'A drizzle that never stops', scores: C, hint: 'low energy, worn down' },
      { id: 'blown-away', label: 'It blew away, I forgot it existed', scores: B, hint: 'procrastination: forgets and drifts' }
    ]
  },
  {
    id: 'late-night', theme: 'late nights', session: 0, group: 'Your days', type: 'choice', allowText: true,
    prompt: 'It’s 1 a.m. and you’re still awake. Most likely because…',
    textPlaceholder: 'Or the real reason…',
    options: [
      { id: 'one-more', label: 'One more episode, one more scroll', scores: B, hint: 'procrastination: puts off stopping' },
      { id: 'replaying', label: 'I’m replaying a conversation', scores: C, hint: 'going in an endless spiral: replays things' },
      { id: 'planning', label: 'I’m planning tomorrow in my head', scores: C, hint: 'going in an endless spiral: mind won’t switch off' },
      { id: 'catching-up', label: 'I’m finally doing what I put off all day', scores: B, hint: 'procrastination: last-minute worker' },
      { id: 'asleep', label: 'I’m not. I’m asleep.', hint: 'switches off well at night' }
    ]
  },
  {
    id: 'deadline-day-ten', theme: 'deadlines', session: 1, group: 'Little scenes', type: 'choice', allowText: true,
    prompt: 'Something is due in two weeks. It’s day ten. Where is it?',
    textPlaceholder: 'Or where it would really be…',
    options: [
      { id: 'done', label: 'Done already', hint: 'starts early, organised' },
      { id: 'steady', label: 'Half done, at a steady pace', hint: 'works at a steady pace' },
      { id: 'thinking', label: 'Not started, but I’ve thought about it a lot', scores: C, hint: 'going in an endless spiral: thinks a lot before starting' },
      { id: 'night-before', label: 'Not started. The night before is my thing.', scores: B, hint: 'procrastination' }
    ]
  },
  {
    id: 'saturday-favour', theme: 'favours for friends', session: 1, group: 'Little scenes', type: 'choice', allowText: true,
    prompt: 'A friend asks for help on your only free Saturday. You…',
    textPlaceholder: 'Or what you’d actually do…',
    options: [
      { id: 'cancel-own', label: 'Say “of course!” and quietly cancel my own plans', scores: B, hint: 'a pushover: puts others first' },
      { id: 'other-day', label: 'Offer a different day', hint: 'sets kind, healthy boundaries' },
      { id: 'they-would', label: 'Go, because they’d do the same for me', scores: C, hint: 'a kind person' },
      { id: 'unread', label: 'Leave the message unread for a while', scores: B, hint: 'procrastination: avoids awkward things' }
    ]
  },
  {
    id: 'got-a-minute', theme: 'unexpected messages', session: 1, group: 'Little scenes', type: 'choice', allowText: true,
    prompt: 'A message says “Got a minute?” and nothing else. Your brain goes…',
    textPlaceholder: 'Or your own first thought…',
    options: [
      { id: 'what-did-i-do', label: '“Oh no, what did I do?”', scores: C, hint: 'scared: expects bad news' },
      { id: 'probably-nothing', label: '“Probably nothing.”', hint: 'calm, not easily worried' },
      { id: 'get-it-over', label: '“Let’s get it over with.”', scores: B, hint: 'likes things direct' },
      { id: 'after-this', label: '“After I finish this…” and then forget', scores: B, hint: 'procrastination' }
    ]
  },
  {
    id: 'stairs-trip', theme: 'small embarrassing moments', session: 1, group: 'Little scenes', type: 'choice', allowText: true,
    prompt: 'You trip on the stairs in front of people. In your head:',
    textPlaceholder: 'Or what you’d really think…',
    options: [
      { id: 'smooth', label: '“Smooth. Very smooth.”', hint: 'laughs at themselves' },
      { id: 'replay-week', label: '“Everyone saw. I’ll replay this all week.”', scores: C, hint: 'scared: worries what others think' },
      { id: 'keep-walking', label: '“Whatever. Keep walking.”', hint: 'shrugs things off, can take a firm push' },
      { id: 'bumped-anyone', label: '“Did I bump anyone? Are they okay?”', scores: C, hint: 'a kind person: thinks of others first' }
    ]
  },
  {
    id: 'monthly-win', session: 1, group: 'Little scenes', type: 'text', canDecline: true,
    prompt: 'What’s one small win you’d love to have by the end of this month?',
    helperText: 'A sentence or two is plenty. Please leave out private details.'
  },
  {
    id: 'pick-a-coach', theme: 'the support they like', session: 2, group: 'Your kind of friend', type: 'choice', allowText: true,
    prompt: 'Pick a coach for your team:',
    textPlaceholder: 'Or describe your ideal coach…',
    options: [
      { id: 'sideline', label: 'Shouts from the sideline that you’ve got this', scores: B, hint: 'wants loud, firm cheering' },
      { id: 'beside-you', label: 'Sits beside you and talks it through', scores: C, hint: 'wants gentle, calm support' },
      { id: 'jokes', label: 'Cracks jokes during drills', scores: R, hint: 'wants humour in support' },
      { id: 'clear-plan', label: 'Hands you a clear, simple plan', scores: B, hint: 'wants short, direct instructions' }
    ]
  },
  {
    id: 'missed-alarm', theme: 'what gets them going', session: 2, group: 'Your kind of friend', type: 'choice', allowText: true,
    prompt: 'You slept through your alarm. What would actually get you up?',
    textPlaceholder: 'Or what really works for you…',
    options: [
      { id: 'louder', label: 'A louder alarm', scores: B, hint: 'responds to firm nudges' },
      { id: 'curtains', label: 'Someone gently opening the curtains', scores: C, hint: 'responds to gentle nudges' },
      { id: 'silly-voice', label: 'A ridiculous voice saying my name', scores: R, hint: 'responds to playful nudges' },
      { id: 'breakfast', label: '“Breakfast is ready!”', scores: C, hint: 'responds to a kind reward' },
      { id: 'keeps-trying', label: 'Someone who keeps trying until I’m up', scores: B, hint: 'needs persistent check-ins' }
    ]
  },
  {
    id: 'stuck-animal', theme: 'getting unstuck', session: 2, group: 'Your kind of friend', type: 'choice', allowText: true,
    prompt: 'Stuck on something hard, you’re most like a…',
    textPlaceholder: 'Or your own animal, and why…',
    options: [
      { id: 'cat', label: 'Cat: wanders off to something easier', scores: B, hint: 'procrastination: switches to easier tasks' },
      { id: 'owl', label: 'Owl: thinks it over and over', scores: C, hint: 'going in an endless spiral: turns problems over and over' },
      { id: 'ant', label: 'Ant: breaks it into tiny pieces', hint: 'already breaks tasks into steps' },
      { id: 'dog', label: 'Dog: goes to find a friend', scores: C, hint: 'asks others for help' },
      { id: 'sloth', label: 'Sloth: nap first, try later', hint: 'rests before retrying' }
    ]
  },
  {
    id: 'joke-pick', theme: 'humour they enjoy', session: 2, group: 'Your kind of friend', type: 'choice', allowText: true,
    prompt: 'Which one makes you smile?',
    textPlaceholder: 'Or tell DOST a joke you love…',
    options: [
      { id: 'pun', label: '“I’m reading a book on gravity. I can’t put it down.”', hint: 'humour: puns and wordplay' },
      { id: 'dry', label: '“I’m not lazy. I’m in energy-saving mode.”', hint: 'humour: dry and deadpan' },
      { id: 'silly', label: '“Why did the slime cross the road? It was already everywhere.”', hint: 'humour: silly and absurd' },
      { id: 'wholesome', label: '“You’re doing great. So is the plant you forgot to water.”', hint: 'humour: warm and wholesome' }
    ]
  },
  {
    id: 'friend-cheers', session: 2, group: 'Your kind of friend', type: 'text', canDecline: true,
    prompt: 'What’s something a friend does that always cheers you up?',
    helperText: 'A short note is enough. Please leave out private details.'
  }
];

module.exports = { questions, questionnaireVersion: 3 };
