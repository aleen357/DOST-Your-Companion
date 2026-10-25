const MODEL = 'gemini-3.8-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const sampleSchema = {
  type: 'object',
  properties: {
    suggestions: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    encouragement: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    followUps: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
    wisdom: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
    jokes: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 }
  },
  required: ['suggestions', 'encouragement', 'followUps', 'wisdom', 'jokes'],
  additionalProperties: false
};

const fictionalPrompt = `Create a small message pack for a fictional desktop companion named Dost. The only sample profile is fictional: a software engineer called Sam who wants gentle reminders to stretch, take a short walk, drink water, and keep learning programming patterns. Sam prefers a warm, playful, chill companion. This profile is invented and is not based on an app user.

Write short, kind, specific messages. Do not make medical claims, shame the person, or imply that you know what the person is doing. Make the wisdom lines original rather than quoting a known author. Return 2 or 3 break suggestions, 2 or 3 encouragement lines, 1 or 2 check-in questions, 1 or 2 original wisdom lines, and 1 or 2 light programming jokes. Keep each line under 140 characters. Return only the requested JSON.`;

function validateTextList(value, field, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new Error(`Gemini returned an invalid ${field} list.`);
  }
  return value.map((item) => {
    if (typeof item !== 'string') throw new Error(`Gemini returned invalid ${field} text.`);
    const text = item.trim();
    if (text.length < 4 || text.length > 160 || /https?:\/\//i.test(text)) {
      throw new Error(`Gemini returned out-of-bounds ${field} text.`);
    }
    return text;
  });
}

function toMessages(texts, prefix, kind) {
  return texts.map((text, index) => ({ id: `${prefix}-${index + 1}`, kind, text }));
}

function validateAndShape(pack) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error('Gemini returned an invalid message pack.');
  return {
    suggestions: toMessages(validateTextList(pack.suggestions, 'suggestions', 2, 3), 'sample-break', 'break'),
    encouragement: toMessages(validateTextList(pack.encouragement, 'encouragement', 2, 3), 'sample-encouragement', 'encouragement'),
    followUps: toMessages(validateTextList(pack.followUps, 'check-in', 1, 2), 'sample-follow-up', 'follow-up'),
    wisdom: toMessages(validateTextList(pack.wisdom, 'wisdom', 1, 2), 'sample-wisdom', 'wisdom'),
    jokes: toMessages(validateTextList(pack.jokes, 'jokes', 1, 2), 'sample-joke', 'joke')
  };
}

async function generateFictionalPack(apiKey) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('No Gemini API key is configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey.trim() },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fictionalPrompt }] }],
        generationConfig: {
          responseFormat: { text: { mimeType: 'application/json', schema: sampleSchema } },
          maxOutputTokens: 700,
          temperature: 0.8
        }
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!text) throw new Error('Gemini returned no sample text.');
    return validateAndShape(JSON.parse(text));
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateFictionalPack };
