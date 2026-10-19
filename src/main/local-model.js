// Talks to Ollama running on this PC. The endpoint is fixed to loopback on purpose:
// DOST never sends the profile to a remote host or cloud model.

const OLLAMA_URL = 'http://127.0.0.1:11434';
const MODEL = 'qwen3.5:4b';
const SETUP_TIMEOUT_MS = 3_000;
const GENERATION_TIMEOUT_MS = 240_000;

async function request(pathname, { body, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OLLAMA_URL}${pathname}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Ollama answered with status ${response.status}.`);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The local model took too long to answer.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function matchesModel(name) {
  return name === MODEL || (!MODEL.includes(':') && name === `${MODEL}:latest`);
}

async function checkSetup() {
  let tags;
  try {
    tags = await request('/api/tags', { timeoutMs: SETUP_TIMEOUT_MS });
  } catch {
    return { status: 'no-ollama', model: MODEL };
  }
  const installed = (tags.models || []).some((item) => matchesModel(item.name) || matchesModel(item.model));
  return { status: installed ? 'ready' : 'no-model', model: MODEL };
}

async function generate(prompt, schema) {
  const result = await request('/api/chat', {
    timeoutMs: GENERATION_TIMEOUT_MS,
    body: {
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      format: schema,
      stream: false,
      think: false,
      keep_alive: '1m',
      options: { temperature: 0.8, num_ctx: 4096, num_predict: 2048 }
    }
  });
  const text = result.message?.content?.trim();
  if (!text) throw new Error('The local model returned no text.');
  return text;
}

module.exports = { checkSetup, generate, MODEL, OLLAMA_URL };
