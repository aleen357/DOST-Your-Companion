const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { getPersonaIds } = require('../shared/personas');

const SCHEMA_VERSION = 2;

function newGuest() {
  return {
    schemaVersion: SCHEMA_VERSION,
    guestId: randomUUID(),
    answers: {},
    sessionIndex: 0,
    completedSessions: [],
    connectAvailableAt: null,
    personaScores: Object.fromEntries(getPersonaIds().map((id) => [id, 0])),
    persona: null,
    messagePack: null,
    hatchedAt: null
  };
}

function isValidGuest(value) {
  return value && value.schemaVersion === SCHEMA_VERSION && typeof value.guestId === 'string' &&
    value.answers && typeof value.answers === 'object' && Number.isInteger(value.sessionIndex) &&
    value.sessionIndex >= 0 && value.sessionIndex <= 3 && Array.isArray(value.completedSessions) &&
    value.personaScores && getPersonaIds().every((id) => Number.isFinite(value.personaScores[id]));
}

function migrateGuest(value) {
  if (!value || value.schemaVersion !== 1 || typeof value.guestId !== 'string' ||
      !value.answers || typeof value.answers !== 'object' || !Number.isInteger(value.sessionIndex) ||
      value.sessionIndex < 0 || value.sessionIndex > 3 || !Array.isArray(value.completedSessions) ||
      !value.personaScores || !Number.isFinite(value.personaScores.chill) || !Number.isFinite(value.personaScores.bossy)) {
    return null;
  }
  return {
    ...value,
    schemaVersion: SCHEMA_VERSION,
    personaScores: Object.fromEntries(getPersonaIds().map((id) => [id, Number.isFinite(value.personaScores[id]) ? value.personaScores[id] : 0]))
  };
}

function createGuestStore(userDataPath) {
  const filePath = path.join(userDataPath, 'guest.json');
  let guest;
  let recovered = false;

  async function save(value) {
    const tempPath = `${filePath}.tmp`;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8');
    await fs.rename(tempPath, filePath);
  }

  return {
    async load() {
      try {
        const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const migrated = parsed?.schemaVersion === 1 ? migrateGuest(parsed) : parsed;
        if (!isValidGuest(migrated)) throw new Error('Unsupported guest data');
        guest = migrated;
        if (parsed.schemaVersion !== SCHEMA_VERSION) await save(guest);
      } catch (error) {
        recovered = error.code !== 'ENOENT';
        guest = newGuest();
        await save(guest);
      }
      return { guest, recovered };
    },
    get() { return guest; },
    async reset() {
      const freshGuest = newGuest();
      await save(freshGuest);
      guest = freshGuest;
      recovered = false;
      return guest;
    },
    async update(mutator) {
      const draft = structuredClone(guest);
      await mutator(draft);
      await save(draft);
      guest = draft;
      return guest;
    }
  };
}

module.exports = { createGuestStore, newGuest };
