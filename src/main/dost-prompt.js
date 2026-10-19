// Turns the guest's saved answers into the prompt DOST sends to the local model.
// Works from whichever question definitions are active, so it never hardcodes question IDs.

const EMOTIONS = ['ANGRY', 'ALOOF', 'SCHOLAR', 'ARTIST', 'DANCER', 'CALM', 'QUESTION', 'TIME TICKING', 'STUDENT'];
const CATEGORIES = ['wisdom', 'nudge', 'joke'];
const ITEMS_PER_CATEGORY = 5;

function describeAnswer(question, answer) {
  if (!answer) return null;
  if (answer.type === 'multi') return answer.labels?.join('; ') || null;
  if (answer.type === 'choice' || answer.type === 'choice-text') {
    return answer.text ? `${answer.label} — in their words: "${answer.text}"` : answer.label;
  }
  if (answer.type === 'text') return answer.declined || !answer.text ? null : `"${answer.text}"`;
  return null;
}

function formatProfile(questionDefinitions, answers = {}) {
  const groups = new Map();
  for (const question of questionDefinitions) {
    const described = describeAnswer(question, answers[question.id]);
    if (!described) continue;
    if (!groups.has(question.group)) groups.set(question.group, []);
    groups.get(question.group).push(`Q: ${question.prompt}\nA: ${described}`);
  }
  return [...groups].map(([group, lines]) => `## ${group}\n${lines.join('\n')}`).join('\n\n');
}

const TEMPLATE = `You write the lines for DOST, a small slime-like desktop companion. "Dost" means "friend" in Urdu.
DOST pops up now and then over the person's work to suggest a break, share a bit of wisdom, or tell a joke.

Here is everything the person told DOST while it was still an egg:

<profile>
{{PROFILE}}
</profile>

STEP 1 — Understand the person.
From the answers, notice if any of these describe them: "procrastination", "a kind person", "a pushover", "scared", "going in an endless spiral".
- "procrastination" or "a pushover" means they do better with a BOSSY DOST: direct, loud, playful, firm, but never mean or shaming.
  Bossy example: "There is no tomorrow. YOU NEED TO DO IT NOW! I am there for you."
  Bossy example: "A glass of water won't cost you the time it took to build Rome. Go get one."
- "a kind person", "scared" or "going in an endless spiral" means they do better with a CHILL DOST: gentle, warm, calm, reassuring.
  Chill example: "No rush. One small step, then we'll see how it feels."
The person's own choices about support style point to: {{SCORE_PERSONA}}.
Set PERSONA to "chill" or "bossy".

STEP 2 — Write DOST_TALKS in that persona's voice. Write exactly:
- 5 items in "wisdom": short wisdom quotes that fit this person's life and goals. Original lines, no author names.
- 5 items in "nudge": reminders to do something now (move, water, a real break, start a task, wind down...), based on what they said they want reminders about and what restores them.
- 5 items in "joke": real jokes with a setup and a punchline (a pun, a one-liner, or a silly question and answer), clean and light, connected to their days, work, study or hobbies. A joke is meant to make them smile, not to push them.

Rules for every TALK:
- Speak directly to the person as DOST ("you"), one or two sentences, under 140 characters.
- DOST is always on the person's side. Bossy may shout in CAPITALS, but it cheers them on: no threats, no insults, no guilt-tripping.
- Use details from the profile, but never repeat private details or invent facts, numbers or times about them.
- No medical, diet or financial advice. No links. No emoji. No hashtags.
- Give each TALK one EMOTION, the face DOST makes while saying it, chosen from: ${EMOTIONS.join(', ')}.

Reply with JSON only, in this shape:
{"PERSONA": "chill", "DOST_TALKS": {"wisdom": [{"TALK": "...", "EMOTION": "CALM"}], "nudge": [...], "joke": [...]}}`;

function buildPrompt({ questionDefinitions, answers, scorePersona }) {
  const profile = formatProfile(questionDefinitions, answers) || '(The person chose not to share details.)';
  return TEMPLATE
    .replace('{{SCORE_PERSONA}}', scorePersona === 'bossy' ? 'bossy' : 'chill')
    .replace('{{PROFILE}}', () => profile);
}

// JSON schema handed to Ollama's structured-output mode. Grouping DOST_TALKS by
// category lets the grammar force exactly five lines of each kind.
const talkList = {
  type: 'array',
  minItems: ITEMS_PER_CATEGORY,
  maxItems: ITEMS_PER_CATEGORY,
  items: {
    type: 'object',
    properties: {
      TALK: { type: 'string' },
      EMOTION: { type: 'string', enum: EMOTIONS }
    },
    required: ['TALK', 'EMOTION']
  }
};

const responseSchema = {
  type: 'object',
  properties: {
    PERSONA: { type: 'string', enum: ['chill', 'bossy'] },
    DOST_TALKS: {
      type: 'object',
      properties: Object.fromEntries(CATEGORIES.map((category) => [category, talkList])),
      required: CATEGORIES
    }
  },
  required: ['PERSONA', 'DOST_TALKS']
};

module.exports = { buildPrompt, formatProfile, responseSchema, EMOTIONS, CATEGORIES, ITEMS_PER_CATEGORY };
