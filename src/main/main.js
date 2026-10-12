const { app, BrowserWindow, ipcMain, nativeImage, screen, Tray, Menu } = require('electron');
const path = require('node:path');
const { questions } = require('../shared/questions');
const { createGuestStore } = require('./guest-store');
const { addScore, choosePersona } = require('./persona');
const { selectLocalPack, selectReminder } = require('./message-selection');
const { getPersona } = require('../shared/personas');
const { createReminderClock } = require('./reminder-clock');

app.setName('DOST');

let mainWindow;
let reminderWindow;
let tray;
let isQuitting = false;
let guestStore;
let reminderClock;
let reminderWindowReady = false;
let activeReminderPresentation = null;
let dataRecoveryNotice = false;
let isPersistingQuit = false;
const isDeveloperMode = process.argv.includes('--dev');
const isDemo = isDeveloperMode || process.argv.includes('--demo');
const resetGuestOnLaunch = process.argv.includes('--reset-guest');
const incubationWaitMs = isDemo ? 30_000 : 24 * 60 * 60 * 1000;
const reminderIntervalMs = isDemo ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000;

function makeReminderPresentation(reminder, preview = false, personaId = null) {
  const profile = getPersona(personaId || guestStore.get().persona || 'chill') || getPersona('chill');
  return {
    persona: {
      id: profile.id,
      name: profile.name,
      label: profile.label,
      palette: profile.palette
    },
    message: reminder.text,
    preview,
    kind: reminder.kind,
    stage: reminder.stage || null
  };
}

function previewPresentation() {
  return makeReminderPresentation({
    kind: 'break',
    text: 'You’ve done good work. A little water break might help your next idea find its way.'
  }, true, 'chill');
}

function getReminderPresentation() {
  return activeReminderPresentation || previewPresentation();
}

function presentReminder(presentation) {
  activeReminderPresentation = presentation;
  const window = createReminderWindow();
  if (reminderWindowReady && !window.isDestroyed() && !window.webContents.isLoading()) {
    window.webContents.send('dost:reminder-updated', presentation);
    window.showInactive();
  }
}

async function handleReminderDue() {
  const guest = guestStore.get();
  if (!guest.persona || !guest.messagePack) return;

  let reminder = guest.pendingReminder;
  if (!reminder) {
    reminder = selectReminder(guest);
    await guestStore.update((draft) => {
      draft.pendingReminder = reminder;
      draft.reminderRemainingMs = 0;
    });
  }
  presentReminder(makeReminderPresentation(reminder, false, guestStore.get().persona));
}

async function resumeReminderClock() {
  const guest = guestStore.get();
  if (!guest.persona) return;
  reminderClock = createReminderClock(reminderIntervalMs, handleReminderDue);
  if (guest.pendingReminder) {
    await handleReminderDue();
    return;
  }
  const remaining = Number.isFinite(guest.reminderRemainingMs)
    ? Math.max(0, guest.reminderRemainingMs)
    : reminderIntervalMs;
  if (guest.reminderRemainingMs === null) {
    await guestStore.update((draft) => { draft.reminderRemainingMs = remaining; });
  }
  reminderClock.start(remaining);
}

function dismissReminder(action) {
  if (!['ok', 'cross'].includes(action)) return;
  const guest = guestStore.get();
  if (!guest.pendingReminder) {
    activeReminderPresentation = null;
    if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
    return;
  }

  guestStore.update((draft) => {
    const previous = draft.pendingReminder;
    if (previous.kind === 'break') draft.lastSuggestionId = previous.id;
    draft.lastReminderId = previous.id;
    if (previous.stage === 'follow-up') {
      draft.followUpState = null;
      draft.nextReminderKind = 'suggestion';
    } else if (action === 'cross') {
      draft.followUpState = 'check-in';
    } else {
      draft.followUpState = null;
      draft.nextReminderKind = 'variety';
    }
    draft.pendingReminder = null;
    draft.reminderRemainingMs = reminderIntervalMs;
  }).then(() => {
    activeReminderPresentation = null;
    if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
    reminderClock?.restart();
  }).catch((error) => console.error('Could not save DOST reminder response:', error));
}

function getIncubationState() {
  const guest = guestStore.get();
  const profile = guest.persona ? getPersona(guest.persona) : null;
  const now = Date.now();
  const sessionQuestions = questions.filter((question) => question.session === guest.sessionIndex);
  const question = sessionQuestions.find((item) => !guest.answers[item.id]) || null;
  return {
    recovered: dataRecoveryNotice,
    demo: isDemo,
    developerMode: isDeveloperMode,
    reminderRemainingMs: reminderClock?.remainingMs() ?? (guest.pendingReminder ? 0 : guest.reminderRemainingMs),
    reminderPending: Boolean(guest.pendingReminder),
    sessionIndex: guest.sessionIndex,
    completedSessions: guest.completedSessions.length,
    completedQuestions: Object.keys(guest.answers).length,
    totalQuestions: questions.length,
    canConnect: guest.sessionIndex < 3 && (!guest.connectAvailableAt || now >= guest.connectAvailableAt),
    waitRemainingMs: guest.connectAvailableAt ? Math.max(0, guest.connectAvailableAt - now) : 0,
    question: question ? {
      id: question.id,
      group: question.group,
      type: question.type,
      prompt: question.prompt,
      options: question.options?.map(({ id, label }) => ({ id, label })) || []
    } : null,
    hatched: Boolean(guest.persona),
    persona: guest.persona,
    personaConfig: profile ? {
      id: profile.id,
      name: profile.name,
      label: profile.label,
      theme: profile.theme,
      introduction: profile.introduction,
      palette: profile.palette
    } : null,
    scores: guest.personaScores,
    messagePack: guest.messagePack
  };
}

ipcMain.handle('dost:get-incubation-state', () => getIncubationState());
ipcMain.handle('dost:get-reminder-presentation', () => getReminderPresentation());
ipcMain.handle('dost:show-reminder-now', () => {
  if (!isDeveloperMode || !guestStore.get().persona || !reminderClock) return false;
  reminderClock.triggerNow();
  return true;
});
ipcMain.handle('dost:reset-incubation', async () => {
  if (!isDeveloperMode) throw new Error('Start DOST with --dev to reset incubation.');
  reminderClock?.stop();
  await guestStore.reset();
  dataRecoveryNotice = false;
  activeReminderPresentation = null;
  if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
  return getIncubationState();
});
ipcMain.handle('dost:submit-answer', async (_event, { questionId, answer }) => {
  if (typeof questionId !== 'string' || !answer || typeof answer !== 'object') throw new Error('Invalid answer');
  const guest = guestStore.get();
  if (guest.persona || guest.sessionIndex >= 3 || (guest.connectAvailableAt && Date.now() < guest.connectAvailableAt)) {
    throw new Error('Connect is not available yet');
  }
  const question = questions.find((item) => item.id === questionId && item.session === guest.sessionIndex);
  if (!question || guest.answers[questionId]) throw new Error('Question is not available');

  let selectedOption;
  let text;
  if (question.type === 'choice') {
    selectedOption = question.options.find((option) => option.id === answer.optionId);
    if (!selectedOption) throw new Error('Choose one of the available answers');
  } else {
    text = typeof answer.text === 'string' ? answer.text.trim().slice(0, 240) : '';
    if (!text) throw new Error('Write a short answer to continue');
  }

  const updatedGuest = await guestStore.update((draft) => {
    draft.answers[question.id] = question.type === 'choice'
      ? { type: 'choice', optionId: selectedOption.id, label: selectedOption.label }
      : { type: 'text', text };
    if (selectedOption) addScore(draft.personaScores, selectedOption.scores);

    const questionsInSession = questions.filter((item) => item.session === draft.sessionIndex);
    const sessionDone = questionsInSession.every((item) => draft.answers[item.id]);
    if (sessionDone) {
      draft.completedSessions.push(Date.now());
      draft.sessionIndex += 1;
      if (draft.sessionIndex < 3) draft.connectAvailableAt = Date.now() + incubationWaitMs;
      else {
        draft.connectAvailableAt = null;
        draft.persona = choosePersona(draft.personaScores);
        draft.messagePack = selectLocalPack(draft.persona, draft.answers);
        draft.hatchedAt = Date.now();
        draft.reminderRemainingMs = reminderIntervalMs;
        draft.followUpState = null;
        draft.pendingReminder = null;
        draft.nextReminderKind = 'suggestion';
      }
    }
  });
  if (updatedGuest.persona) await resumeReminderClock();
  return getIncubationState();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: 'DOST',
    backgroundColor: '#102447',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/bridge.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/incubation.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createReminderWindow() {
  if (reminderWindow && !reminderWindow.isDestroyed()) return reminderWindow;

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 390;
  const height = 176;
  const margin = 18;

  reminderWindow = new BrowserWindow({
    x: workArea.x + margin,
    y: workArea.y + workArea.height - height - margin,
    width,
    height,
    title: 'DOST companion',
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/bridge.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  reminderWindow.setAlwaysOnTop(true, 'floating');
  reminderWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
  reminderWindow.once('ready-to-show', () => {
    reminderWindowReady = true;
    if (reminderWindow && !reminderWindow.isDestroyed() && activeReminderPresentation) {
      reminderWindow.webContents.send('dost:reminder-updated', activeReminderPresentation);
      reminderWindow.showInactive();
    }
  });
  reminderWindow.once('closed', () => {
    reminderWindow = null;
    reminderWindowReady = false;
  });
  return reminderWindow;
}

function showReminderPreview() {
  if (!isDeveloperMode) return;
  const guest = guestStore.get();
  if (guest.pendingReminder) {
    presentReminder(makeReminderPresentation(guest.pendingReminder, false, guest.persona));
  } else {
    const preview = previewPresentation();
    presentReminder(makeReminderPresentation({ ...preview, text: preview.message }, true, guest.persona || 'chill'));
  }
}

function createTray() {
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="10" fill="#76d6b0"/><path d="M5 21c0-6 4-11 11-11s11 5 11 11c0 3-3 5-11 5S5 24 5 21Z" fill="#eafff6"/><circle cx="12" cy="19" r="1.5" fill="#24465f"/><circle cx="20" cy="19" r="1.5" fill="#24465f"/><path d="M13 22q3 2 6 0" fill="none" stroke="#24465f" stroke-linecap="round"/></svg>`;
  tray = new Tray(nativeImage.createFromDataURL(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`));
  tray.setToolTip('DOST — your desk companion');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open DOST', click: () => showMainWindow() },
    ...(isDeveloperMode ? [
      { label: 'Preview companion', click: () => showReminderPreview() },
      { label: 'Show reminder now', click: () => reminderClock?.triggerNow() },
      { type: 'separator' }
    ] : []),
    { label: 'Quit DOST', click: () => app.quit() }
  ]));
  tray.on('double-click', () => showMainWindow());
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
  mainWindow.show();
  mainWindow.focus();
}

ipcMain.on('dost:show-reminder-preview', () => showReminderPreview());
ipcMain.on('dost:dismiss-reminder', (_event, action) => dismissReminder(action));

app.whenReady().then(async () => {
  guestStore = createGuestStore(app.getPath('userData'));
  try {
    const { recovered } = await guestStore.load();
    dataRecoveryNotice = recovered;
    if (resetGuestOnLaunch) {
      await guestStore.reset();
      dataRecoveryNotice = false;
    }
    createTray();
    createMainWindow();
    app.on('activate', () => showMainWindow());
    await resumeReminderClock();
  } catch (error) {
    console.error('Could not initialize guest data:', error);
    app.quit();
  }
});

app.on('before-quit', (event) => {
  if (isQuitting) return;
  if (isPersistingQuit) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  isPersistingQuit = true;
  const remaining = reminderClock?.remainingMs() ?? null;
  reminderClock?.stop();
  (async () => {
    await guestStore?.flush();
    if (remaining !== null && guestStore?.get().persona && !guestStore.get().pendingReminder) {
      await guestStore.update((draft) => { draft.reminderRemainingMs = remaining; });
    }
    await guestStore?.flush();
    isQuitting = true;
    isPersistingQuit = false;
    app.quit();
  })().catch((error) => {
    console.error('Could not save DOST reminder time before quitting:', error);
    isQuitting = true;
    app.quit();
  });
});

app.on('window-all-closed', () => {
  // DOST stays available in the Windows tray until the user chooses Quit.
});
