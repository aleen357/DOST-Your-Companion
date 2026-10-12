const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { getPersonaIds } = require('../shared/personas');
const { selectLocalPack } = require('./message-selection');

const SCHEMA_VERSION = 3;

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
    hatchedAt: null,
    reminderRemainingMs: null,
    followUpState: null,
    pendingReminder: null,
    lastSuggestionId: null,
    lastReminderId: null,
    nextReminderKind: 'suggestion'
  };
}

function isValidGuest(value) {
  return value && value.schemaVersion === SCHEMA_VERSION && typeof value.guestId === 'string' &&
    value.answers && typeof value.answers === 'object' && Number.isInteger(value.sessionIndex) &&
    value.sessionIndex >= 0 && value.sessionIndex <= 3 && Array.isArray(value.completedSessions) &&
    value.personaScores && getPersonaIds().every((id) => Number.isFinite(value.personaScores[id])) &&
    (value.reminderRemainingMs === null || (Number.isFinite(value.reminderRemainingMs) && value.reminderRemainingMs >= 0)) &&
    (value.followUpState === null || value.followUpState === 'check-in') &&
    (value.pendingReminder === null || (typeof value.pendingReminder.id === 'string' && typeof value.pendingReminder.text === 'string')) &&
    ['suggestion', 'variety'].includes(value.nextReminderKind);
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
    schemaVersion: 2,
    personaScores: Object.fromEntries(getPersonaIds().map((id) => [id, Number.isFinite(value.personaScores[id]) ? value.personaScores[id] : 0]))
  };
}

function createGuestStore(userDataPath) {
  const filePath = path.join(userDataPath, 'guest.json');
  let guest;
  let recovered = false;
  let writeQueue = Promise.resolve();

  function enqueue(operation) {
    const result = writeQueue.then(operation);
    writeQueue = result.catch(() => {});
    return result;
  }

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
        const current = migrated?.schemaVersion === 2 ? migrateToCurrent(migrated) : migrated;
        if (!isValidGuest(current)) throw new Error('Unsupported guest data');
        guest = current;
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
      return enqueue(async () => {
        const freshGuest = newGuest();
        await save(freshGuest);
        guest = freshGuest;
        recovered = false;
        return guest;
      });
    },
    async update(mutator) {
      return enqueue(async () => {
        const draft = structuredClone(guest);
        await mutator(draft);
        await save(draft);
        guest = draft;
        return guest;
      });
    },
    async flush() { await writeQueue; }
  };

}

function migrateToCurrent(value) {
  if (value.schemaVersion !== 2) return value;
  return {
    ...value,
    schemaVersion: SCHEMA_VERSION,
    messagePack: value.persona ? selectLocalPack(value.persona, value.answers) : value.messagePack,
    reminderRemainingMs: null,
    followUpState: null,
    pendingReminder: null,
    lastSuggestionId: null,
    lastReminderId: null,
    nextReminderKind: 'suggestion'
  };
}

module.exports = { createGuestStore, newGuest };
