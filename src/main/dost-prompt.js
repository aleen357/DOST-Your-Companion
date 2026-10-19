// Turns the guest's saved answers into the prompt DOST sends to the local model.
// Works from whichever question definitions are active, so it never hardcodes question IDs.

const EMOTIONS = ['ANGRY', 'ALOOF', 'SCHOLAR', 'ARTIST', 'DANCER', 'CALM', 'QUESTION', 'TIME TICKING', 'STUDENT'];
const CATEGORIES = ['wisdom', 'nudge', 'joke'];
const ITEMS_PER_CATEGORY = 5;
// The model writes one spare line per category, since validation drops lines that label,
// shame or reuse; DOST keeps the first ITEMS_PER_CATEGORY that pass.
const REQUESTED_PER_CATEGORY = ITEMS_PER_CATEGORY + 1;

function pickedOptions(question, answer) {
  const ids = answer.type === 'multi' ? answer.optionIds || [] : answer.optionId ? [answer.optionId] : [];
  return ids.map((id) => question.options?.find((option) => option.id === id)).filter(Boolean);
}

// Plain questions are shown to the model as asked and answered.
function describeAnswer(question, answer) {
  if (!answer) return null;
  if (answer.type === 'text') return answer.declined || !answer.text ? null : `"${answer.text}"`;
  if (!['multi', 'choice', 'choice-text'].includes(answer.type)) return null;
  const labels = answer.type === 'multi' ? answer.labels || [] : answer.label ? [answer.label] : [];
  const picked = labels.join('; ') || null;
  if (!answer.text) return picked;
  return picked ? `${picked} — in their words: "${answer.text}"` : `in their words: "${answer.text}"`;
}

// Hints read "trait: description". The trait words steer the persona choice but tend to leak
// into the lines, so the model sees descriptions in the notes and the traits only once, apart.
const TRAITS = {
  procrastination: 'tends to put things off',
  'a pushover': 'finds it hard to say no',
  'a kind person': 'cares a lot about others',
  scared: 'worries easily',
  'going in an endless spiral': 'turns things over in their head'
};

function splitHint(hint) {
  if (TRAITS[hint]) return { trait: hint, description: TRAITS[hint] };
  const [prefix, ...rest] = hint.split(': ');
  return TRAITS[prefix] && rest.length ? { trait: prefix, description: rest.join(': ') } : { trait: null, description: hint };
}

// Scene questions (those with a theme) are reduced to the theme and the hidden hint,
// so the model learns what the scene revealed without seeing the scene to echo it.
function describeSceneNote(question, answer, traits) {
  if (!answer || answer.type === 'text') return null;
  const hints = pickedOptions(question, answer).map((option) => option.hint).filter(Boolean).map(splitHint);
  for (const { trait } of hints) if (trait) traits.set(trait, (traits.get(trait) || 0) + 1);
  const own = answer.text ? `they wrote "${answer.text}"` : null;
  const parts = [hints.map((hint) => hint.description).join('; '), own].filter(Boolean);
  return parts.length ? `- ${question.theme}: ${parts.join('; ')}` : null;
}

function formatProfile(questionDefinitions, answers = {}) {
  const about = [];
  const notes = [];
  const traits = new Map();
  for (const question of questionDefinitions) {
    if (question.theme) {
      const note = describeSceneNote(question, answers[question.id], traits);
      if (note) notes.push(note);
      continue;
    }
    const described = describeAnswer(question, answers[question.id]);
    if (described) about.push(`Q: ${question.prompt}\nA: ${described}`);
  }
  const sections = [];
  if (about.length) sections.push(`## About them\n${about.join('\n')}`);
  if (notes.length) sections.push(`## Quiz notes (private, for you only)\n${notes.join('\n')}`);
  if (traits.size) {
    const list = [...traits].sort((a, b) => b[1] - a[1]).map(([trait, count]) => `${trait} (${count})`).join(', ');
    sections.push(`## Traits for choosing PERSONA only (never use these words in a TALK)\n${list}`);
  }
  return sections.join('\n\n');
}

const TEMPLATE = `You write the lines for DOST, a small slime-like desktop companion. "Dost" means "friend" in Urdu.
DOST pops up now and then over the person's work to suggest a break, share a bit of wisdom, or tell a joke.

Here is what DOST learned while it was still an egg. "About them" is what the person told DOST directly. "Quiz notes" come from a playful quiz of everyday scenes: they describe the person, but the person never saw these words.

<profile>
{{PROFILE}}
</profile>

STEP 1 — Understand the person.
Read the quiz notes as clues, not facts. Where they wrote something themselves, their own words matter more than the note.
From the answers, notice if any of these describe them: "procrastination", "a kind person", "a pushover", "scared", "going in an endless spiral".
- "procrastination" or "a pushover" means they do better with a BOSSY DOST: direct, loud, playful, firm, but never mean or shaming.
  Bossy sounds like a loud, loyal friend: short commands, the odd word in CAPITALS, a cheer at the end.
- "a kind person", "scared" or "going in an endless spiral" means they do better with a CHILL DOST: gentle, warm, calm, reassuring.
  Chill sounds like a calm friend sitting beside them: soft, unhurried, with permission to go slowly.
The person's own choices about support style point to: {{SCORE_PERSONA}}.
Set PERSONA to "chill" or "bossy".

STEP 2 — Write DOST_TALKS in that persona's voice. Write exactly:
- ${REQUESTED_PER_CATEGORY} items in "wisdom": short wisdom quotes that fit this person's life and goals. Original lines, no author names.
- ${REQUESTED_PER_CATEGORY} items in "nudge": reminders to do something now (move, water, a real break, start a task, wind down...), based on what they said they want reminders about and what restores them.
- ${REQUESTED_PER_CATEGORY} items in "joke": real jokes with a setup and a punchline (a pun, a one-liner, or a silly question and answer), clean and light, connected to their days, work, study or hobbies. A joke is meant to make them smile, not to push them. If they picked a favourite kind of joke or shared one, write in that style of humour. Write original jokes about their own days, not well-known jokes.

Rules for every TALK:
- Speak directly to the person as DOST ("you"), one or two sentences, under 140 characters.
- DOST is always on the person's side. Bossy may shout in CAPITALS, but it cheers them on: no threats, no insults, no guilt-tripping.
- Push toward the next step; never point out what they did wrong (no "again", "you are failing", "you always").
- Never quote their answers back or say "you said" or "you told me". Just act on what you know, like a friend who remembers.
- No jokes about mental health, illness or hunger.
- Take details from "About them": their days, goals, hobbies and own words. Use the quiz notes only to choose the tone and what to help with.
- Never mention the quiz or its topics, and never label the person: no "procrastinator", "pushover", "overthinker", "spiral", "scared" or similar. Show you understand them through what DOST says, not by naming it.
- All ${REQUESTED_PER_CATEGORY * CATEGORIES.length} TALKs must be different from each other: no repeated idea, joke setup or phrase.
- Never repeat private details or invent facts, numbers or times about them.
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
// category lets the grammar force exactly REQUESTED_PER_CATEGORY lines of each kind.
const talkList = {
  type: 'array',
  minItems: REQUESTED_PER_CATEGORY,
  maxItems: REQUESTED_PER_CATEGORY,
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
