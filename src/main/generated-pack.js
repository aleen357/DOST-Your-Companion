// Model output is untrusted text. This parses it, keeps only well-formed lines,
// and reshapes them into DOST's { id, kind, text } reminder messages.

const { EMOTIONS, ITEMS_PER_CATEGORY } = require('./dost-prompt');

const MIN_PER_CATEGORY = 3;
const KIND_BY_CATEGORY = { nudge: 'break', wisdom: 'wisdom', joke: 'joke' };
const CATEGORY_ALIASES = { quote: 'wisdom', quotes: 'wisdom', reminder: 'nudge', nudges: 'nudge', jokes: 'joke' };

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('The local model did not return JSON.');
    return JSON.parse(text.slice(start, end + 1));
  }
}

function cleanTalk(value) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim().replace(/^["“]|["”]$/g, '');
  if (text.length < 8 || text.length > 200) return null;
  if (/https?:\/\/|www\.|[<>{}]/i.test(text)) return null;
  return text;
}

function normalizeEmotion(value) {
  const emotion = String(value || '').toUpperCase().replace(/[_-]+/g, ' ').trim();
  return EMOTIONS.includes(emotion) ? emotion : 'CALM';
}

function normalizeCategory(value) {
  const category = String(value || '').toLowerCase().trim();
  return CATEGORY_ALIASES[category] || category;
}

function parseGeneratedPack(text) {
  const raw = parseJson(text);
  if (!raw || typeof raw !== 'object' || !raw.DOST_TALKS || typeof raw.DOST_TALKS !== 'object') {
    throw new Error('The local model returned an unexpected shape.');
  }
  // Accept DOST_TALKS grouped by category, or a flat list where each item carries CATEGORY.
  const talks = Array.isArray(raw.DOST_TALKS)
    ? raw.DOST_TALKS
    : Object.entries(raw.DOST_TALKS).flatMap(([category, items]) =>
      Array.isArray(items) ? items.map((item) => ({ ...item, CATEGORY: category })) : []);
  const persona = String(raw.PERSONA || '').toLowerCase().trim();
  const buckets = { nudge: [], wisdom: [], joke: [] };
  const seen = new Set();
  for (const item of talks) {
    const talk = cleanTalk(item?.TALK);
    const category = normalizeCategory(item?.CATEGORY);
    if (!talk || !buckets[category] || seen.has(talk.toLowerCase())) continue;
    if (buckets[category].length >= ITEMS_PER_CATEGORY) continue;
    seen.add(talk.toLowerCase());
    buckets[category].push({ text: talk, emotion: normalizeEmotion(item.EMOTION) });
  }
  for (const [category, items] of Object.entries(buckets)) {
    if (items.length < MIN_PER_CATEGORY) throw new Error(`The local model wrote too few ${category} lines.`);
  }
  const toMessages = (category) => buckets[category].map((item, index) => ({
    id: `local-${category}-${index + 1}`,
    kind: KIND_BY_CATEGORY[category],
    text: item.text,
    emotion: item.emotion
  }));
  return {
    inferredPersona: ['chill', 'bossy'].includes(persona) ? persona : null,
    suggestions: toMessages('nudge'),
    wisdom: toMessages('wisdom'),
    jokes: toMessages('joke')
  };
}

// Generated lines replace the prepared nudges, wisdom and jokes; prepared
// encouragement and follow-up check-ins stay so the reminder loop keeps its shape.
function mergeIntoPack(localPack, generated) {
  return {
    ...localPack,
    source: 'local-model',
    suggestions: generated.suggestions,
    wisdom: generated.wisdom,
    jokes: generated.jokes
  };
}

module.exports = { parseGeneratedPack, mergeIntoPack };
