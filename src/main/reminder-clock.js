function createReminderClock(intervalMs, onDue) {
  let timer = null;
  let dueAt = null;

  function arm(delayMs) {
    if (timer) clearTimeout(timer);
    const delay = Math.max(0, delayMs);
    dueAt = Date.now() + delay;
    timer = setTimeout(() => {
      timer = null;
      dueAt = null;
      Promise.resolve(onDue()).catch((error) => console.error('DOST reminder could not be shown:', error));
    }, delay);
  }

  return Object.freeze({
    start(remainingMs = intervalMs) {
      if (dueAt === null) arm(remainingMs);
    },
    restart() { arm(intervalMs); },
    triggerNow() { arm(0); },
    remainingMs() { return dueAt === null ? null : Math.max(0, dueAt - Date.now()); },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      dueAt = null;
    }
  });
}

module.exports = { createReminderClock };
