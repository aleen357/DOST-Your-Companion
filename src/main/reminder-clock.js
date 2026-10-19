// Coordinates the two DOST message lanes. Time is counted while the app runs;
// snapshots store remaining time so quitting does not consume the schedule.

function createReminderClock({
  lightIntervalMs,
  habitIntervalMs,
  minimumGapMs,
  lightMuteMs,
  lightJitterMs = 0,
  onDue
}) {
  let timer = null;
  let lightDueAt = null;
  let habitDueAt = null;
  let lightMutedUntil = 0;
  let paused = false;
  let started = false;

  function jitter() {
    return lightJitterMs ? Math.round((Math.random() * 2 - 1) * lightJitterMs) : 0;
  }

  function advanceLight(from = lightDueAt) {
    lightDueAt = from + Math.max(1, lightIntervalMs + jitter());
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function skipLightSlots() {
    const now = Date.now();
    while (lightDueAt !== null && lightDueAt <= lightMutedUntil) advanceLight();
    while (lightDueAt !== null && habitDueAt !== null && Math.abs(lightDueAt - habitDueAt) < minimumGapMs) {
      advanceLight();
    }
    // A light message that is already overdue while the habit lane was active
    // is discarded instead of appearing immediately after the habit prompt.
    while (lightDueAt !== null && lightDueAt <= now && habitDueAt !== null && habitDueAt > now && habitDueAt - now < minimumGapMs) {
      advanceLight();
    }
  }

  function arm() {
    clearTimer();
    if (!started || paused || lightDueAt === null || habitDueAt === null) return;
    skipLightSlots();
    const dueAt = Math.min(lightDueAt, habitDueAt);
    timer = setTimeout(() => {
      timer = null;
      const now = Date.now();
      let kind;
      if (habitDueAt <= lightDueAt && habitDueAt <= now) {
        kind = 'habit';
        const firedAt = habitDueAt;
        habitDueAt = firedAt + habitIntervalMs;
        if (lightDueAt < firedAt + minimumGapMs) lightDueAt = firedAt + minimumGapMs;
      } else if (lightDueAt <= now) {
        if (lightDueAt <= lightMutedUntil || Math.abs(lightDueAt - habitDueAt) < minimumGapMs) {
          advanceLight();
          arm();
          return;
        }
        kind = 'light';
        advanceLight();
      } else {
        arm();
        return;
      }
      paused = true;
      Promise.resolve(onDue(kind)).catch((error) => console.error('DOST reminder could not be shown:', error));
    }, Math.max(0, dueAt - Date.now()));
  }

  function start(snapshot = {}) {
    if (started) return;
    const now = Date.now();
    lightDueAt = now + (Number.isFinite(snapshot.lightRemainingMs) ? snapshot.lightRemainingMs : lightIntervalMs);
    habitDueAt = now + (Number.isFinite(snapshot.habitRemainingMs) ? snapshot.habitRemainingMs : habitIntervalMs);
    lightMutedUntil = now + (Number.isFinite(snapshot.lightMutedRemainingMs) ? snapshot.lightMutedRemainingMs : 0);
    started = true;
    arm();
  }

  function resume() {
    if (!started) return;
    paused = false;
    const now = Date.now();
    while (habitDueAt <= now) habitDueAt += habitIntervalMs;
    while (lightDueAt <= now) advanceLight();
    arm();
  }

  function hold() {
    paused = true;
    clearTimer();
  }

  return Object.freeze({
    start,
    resume,
    hold,
    muteLight(durationMs = lightMuteMs) {
      lightMutedUntil = Math.max(lightMutedUntil, Date.now() + durationMs);
      arm();
    },
    triggerNow() {
      if (!started) return;
      habitDueAt = Date.now();
      paused = false;
      arm();
    },
    remainingMs() {
      if (!started) return null;
      if (paused) return 0;
      return Math.max(0, Math.min(lightDueAt, habitDueAt) - Date.now());
    },
    snapshot() {
      if (!started) return null;
      const now = Date.now();
      return {
        lightRemainingMs: Math.max(0, lightDueAt - now),
        habitRemainingMs: Math.max(0, habitDueAt - now),
        lightMutedRemainingMs: Math.max(0, lightMutedUntil - now)
      };
    },
    stop() {
      clearTimer();
      started = false;
      paused = false;
      lightDueAt = null;
      habitDueAt = null;
      lightMutedUntil = 0;
    }
  });
}

module.exports = { createReminderClock };
