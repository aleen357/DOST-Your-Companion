const { app, BrowserWindow, ipcMain, nativeImage, screen, Tray, Menu, Notification } = require('electron');
const path = require('node:path');
const { questions } = require('../shared/questions');
const { questions: legacyQuestions } = require('../shared/questions-v1');
const { questions: v2Questions } = require('../shared/questions-v2');
const { createGuestStore } = require('./guest-store');
const { addScore, choosePersona } = require('./persona');
const { selectLocalPack, selectReminder } = require('./message-selection');
const { getPersona } = require('../shared/personas');
const { createReminderClock } = require('./reminder-clock');
const localModel = require('./local-model');
const { buildPrompt, responseSchema } = require('./dost-prompt');
const { parseGeneratedPack, mergeIntoPack } = require('./generated-pack');

app.setName('DOST');

let mainWindow;
let reminderWindow;
let tray;
// DOST's face, rendered by dev/make-icon.js. Used for the window, taskbar and tray.
const appIcon = nativeImage.createFromPath(path.join(__dirname, '../../assets/icon.png'));
let isQuitting = false;
let guestStore;
let generationInProgress = false;
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
const lightIntervalMs = isDemo ? 50_000 : 50 * 60 * 1000;
const minimumReminderGapMs = isDemo ? 30_000 : 30 * 60 * 1000;
const lightMuteMs = isDemo ? 5 * 60 * 1000 : 5 * 60 * 60 * 1000;
const lightJitterMs = isDemo ? 5_000 : 5 * 60 * 1000;
// Sleep is always a real 5 hours, even in demo/dev; Wake ends it early.
const sleepMs = 5 * 60 * 60 * 1000;

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
    emotion: reminder.emotion || null,
    preview,
    kind: reminder.kind,
    stage: reminder.stage || null
  };
}

// Previews show one of this DOST's own saved lines (with its emotion); before hatching, a sample line.
function previewPresentation() {
  const pack = guestStore?.get().messagePack;
  const lines = pack ? [...(pack.suggestions || []), ...(pack.wisdom || []), ...(pack.jokes || []), ...(pack.encouragement || [])] : [];
  const line = lines[Math.floor(Math.random() * lines.length)] || {
    kind: 'break',
    text: 'You’ve done good work. A little water break might help your next idea find its way.'
  };
  return makeReminderPresentation(line, true, 'chill');
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

function isAsleep(guest = guestStore.get()) {
  return Number.isFinite(guest.sleepUntil) && guest.sleepUntil > Date.now();
}

// A sleeping DOST skips whatever comes due (and drops anything still on screen); the clock moves on.
async function skipWhileAsleep() {
  if (guestStore.get().pendingReminder) await guestStore.update((draft) => { draft.pendingReminder = null; });
  activeReminderPresentation = null;
  if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
  reminderClock?.resume();
}

async function handleReminderDue(lane) {
  const guest = guestStore.get();
  if (!guest.persona || !guest.messagePack) return;
  if (isAsleep(guest)) return skipWhileAsleep();

  let reminder = guest.pendingReminder;
  if (!reminder) {
    reminder = selectReminder(guest, lane);
    await guestStore.update((draft) => {
      draft.pendingReminder = reminder;
      draft.reminderSchedule = reminderClock.snapshot();
      const usedKey = lane === 'light' ? 'usedLightMessageIds' : 'usedHabitMessageIds';
      draft[usedKey] = [...draft[usedKey], reminder.id];
      if (lane === 'light' && reminder.stage === 'encouragement') draft.nextLightKind = 'random';
    });
  }
  presentReminder(makeReminderPresentation(reminder, false, guestStore.get().persona));
}

async function resumeReminderClock() {
  const guest = guestStore.get();
  if (!guest.persona || !guest.hatchedAt) return;
  reminderClock = createReminderClock({
    lightIntervalMs,
    habitIntervalMs: reminderIntervalMs,
    minimumGapMs: minimumReminderGapMs,
    lightMuteMs,
    lightJitterMs,
    onDue: handleReminderDue
  });
  reminderClock.start(guest.reminderSchedule || {});
  if (guest.pendingReminder) {
    reminderClock.hold();
    await handleReminderDue();
    return;
  }
  await guestStore.update((draft) => { draft.reminderSchedule = reminderClock.snapshot(); });
}

function dismissReminder(action) {
  if (!['ok', 'cross'].includes(action)) return;
  const guest = guestStore.get();
  if (!guest.pendingReminder) {
    activeReminderPresentation = null;
    if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
    return;
  }

  if (action === 'cross') reminderClock?.muteLight(lightMuteMs);
  guestStore.update((draft) => {
    const previous = draft.pendingReminder;
    if (previous.kind === 'break') draft.lastSuggestionId = previous.id;
    draft.lastReminderId = previous.id;
    if (previous.scheduleLane === 'habit' && previous.stage === 'follow-up') {
      draft.followUpState = null;
      draft.nextReminderKind = 'suggestion';
    } else if (previous.scheduleLane === 'habit' && action === 'cross') {
      draft.followUpState = 'check-in';
    } else if (previous.scheduleLane === 'habit') {
      draft.followUpState = null;
      draft.nextReminderKind = 'variety';
    }
    draft.nextLightKind = action === 'ok' && !(previous.scheduleLane === 'light' && previous.stage === 'encouragement')
      ? 'encouragement'
      : 'random';
    draft.pendingReminder = null;
    draft.reminderSchedule = reminderClock?.snapshot() || draft.reminderSchedule;
  }).then(() => {
    activeReminderPresentation = null;
    if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
    reminderClock?.resume();
    return guestStore.update((draft) => { draft.reminderSchedule = reminderClock?.snapshot() || draft.reminderSchedule; });
  }).catch((error) => console.error('Could not save DOST reminder response:', error));
}

function getIncubationState() {
  const guest = guestStore.get();
  const activeQuestions = activeQuestionsFor(guest);
  const profile = guest.persona ? getPersona(guest.persona) : null;
  const now = Date.now();
  const sessionQuestions = activeQuestions.filter((question) => question.session === guest.sessionIndex);
  const question = sessionQuestions.find((item) => !guest.answers[item.id]) || null;
  return {
    recovered: dataRecoveryNotice,
    demo: isDemo,
    developerMode: isDeveloperMode,
    localGeneration: guest.localGeneration,
    generationInProgress,
    localModelName: localModel.MODEL,
    hatchPending: Boolean(guest.persona && !guest.hatchedAt),
    reminderRemainingMs: reminderClock?.remainingMs() ?? (guest.pendingReminder ? 0 : guest.reminderRemainingMs),
    reminderPending: Boolean(guest.pendingReminder),
    sessionIndex: guest.sessionIndex,
    completedSessions: guest.completedSessions.length,
    completedQuestions: Object.keys(guest.answers).length,
    totalQuestions: questions.length,
    questionnaireVersion: guest.questionnaireVersion,
    canConnect: guest.sessionIndex < 3 && (!guest.connectAvailableAt || now >= guest.connectAvailableAt),
    waitRemainingMs: guest.connectAvailableAt ? Math.max(0, guest.connectAvailableAt - now) : 0,
    question: question ? {
      id: question.id,
      group: question.group,
      type: question.type,
      prompt: question.prompt,
      helperText: question.helperText || '',
      allowText: Boolean(question.allowText),
      textPlaceholder: question.textPlaceholder || '',
      canDecline: Boolean(question.canDecline),
      maxSelections: question.maxSelections || null,
      exclusiveOptionIds: question.exclusiveOptionIds || [],
      options: question.options?.map(({ id, label }) => ({ id, label })) || []
    } : null,
    hatched: Boolean(guest.hatchedAt),
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
    messagePack: guest.messagePack,
    sleepUntil: isAsleep(guest) ? guest.sleepUntil : null
  };
}

ipcMain.handle('dost:get-incubation-state', () => getIncubationState());
ipcMain.handle('dost:set-sleep', async (_event, asleep) => {
  if (!guestStore.get().hatchedAt) throw new Error('DOST has not hatched yet.');
  await guestStore.update((draft) => { draft.sleepUntil = asleep === true ? Date.now() + sleepMs : null; });
  if (asleep === true) await skipWhileAsleep();
  return getIncubationState();
});
function activeQuestionsFor(guest) {
  if (guest.questionnaireVersion === 1) return legacyQuestions;
  if (guest.questionnaireVersion === 2) return v2Questions;
  return questions;
}

async function hatch(mutator) {
  await guestStore.update((draft) => {
    mutator?.(draft);
    draft.hatchedAt = Date.now();
  });
  await resumeReminderClock();
}

function assertWaitingToHatch() {
  const guest = guestStore.get();
  if (!guest.persona || guest.hatchedAt) throw new Error('DOST is not waiting to hatch.');
  return guest;
}

ipcMain.handle('dost:check-local-model', () => localModel.checkSetup());
ipcMain.handle('dost:skip-local-generation', async () => {
  assertWaitingToHatch();
  if (generationInProgress) throw new Error('DOST is still writing its messages.');
  await hatch((draft) => {
    if (draft.localGeneration?.status !== 'failed') draft.localGeneration = { status: 'skipped', at: Date.now() };
  });
  // Let's Go falls back here after a slow failed or missing model, so the user may have looked away.
  notifyDostReady();
  return { status: 'skipped', state: getIncubationState() };
});
ipcMain.handle('dost:generate-local-pack', async () => {
  const guest = assertWaitingToHatch();
  if (generationInProgress) throw new Error('DOST is already writing its messages.');
  const setup = await localModel.checkSetup();
  if (setup.status !== 'ready') return { status: setup.status, state: getIncubationState() };

  generationInProgress = true;
  try {
    const scorePersona = guest.persona;
    let generated;
    try {
      const prompt = buildPrompt({ questionDefinitions: activeQuestionsFor(guest), answers: guest.answers, scorePersona });
      generated = parseGeneratedPack(await localModel.generate(prompt, responseSchema));
    } catch (error) {
      console.warn('DOST local generation did not finish:', error.message);
      await guestStore.update((draft) => {
        draft.localGeneration = { status: 'failed', model: localModel.MODEL, error: error.message, at: Date.now() };
      });
      return { status: 'failed', error: error.message, state: getIncubationState() };
    }
    // Agreed rule: if the model's reading disagrees with the answer score, DOST hatches Chill.
    const inferred = generated.inferredPersona || scorePersona;
    const finalPersona = inferred === scorePersona ? scorePersona : 'chill';
    await hatch((draft) => {
      draft.persona = finalPersona;
      draft.messagePack = mergeIntoPack(selectLocalPack(finalPersona, draft.answers), generated);
      draft.localGeneration = {
        status: 'generated', model: localModel.MODEL, scorePersona, inferredPersona: generated.inferredPersona, at: Date.now()
      };
    });
    notifyDostReady();
    return { status: 'generated', state: getIncubationState() };
  } finally {
    generationInProgress = false;
  }
});
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
  const activeQuestions = activeQuestionsFor(guest);
  const question = activeQuestions.find((item) => item.id === questionId && item.session === guest.sessionIndex);
  if (!question || guest.answers[questionId]) throw new Error('Question is not available');

  let selectedOption;
  let selectedOptions = [];
  let text;
  const optionalText = question.allowText && typeof answer.text === 'string' ? answer.text.trim().slice(0, 240) : '';
  if (question.type === 'choice' || question.type === 'choice-text') {
    selectedOption = question.options.find((option) => option.id === answer.optionId);
    if (!selectedOption && !(question.allowText && answer.optionId == null && optionalText)) {
      throw new Error(question.allowText ? 'Choose an answer or write your own' : 'Choose one of the available answers');
    }
    text = optionalText;
  } else if (question.type === 'multi') {
    if (!Array.isArray(answer.optionIds)) throw new Error('Choose at least one answer');
    const uniqueIds = [...new Set(answer.optionIds)];
    if (uniqueIds.length > question.maxSelections) throw new Error(`Choose up to ${question.maxSelections} answers`);
    if (uniqueIds.length === 0 && !optionalText) {
      throw new Error(question.allowText ? 'Choose an answer or write your own' : `Choose between one and ${question.maxSelections} answers`);
    }
    if (uniqueIds.some((id) => question.exclusiveOptionIds?.includes(id)) && uniqueIds.length > 1) throw new Error('Choose the “none” answer by itself');
    selectedOptions = uniqueIds.map((optionId) => question.options.find((option) => option.id === optionId));
    if (selectedOptions.some((option) => !option)) throw new Error('Choose only the answers shown');
    text = optionalText;
  } else {
    text = typeof answer.text === 'string' ? answer.text.trim().slice(0, 240) : '';
    if (!text && !(question.canDecline && answer.declined === true)) throw new Error('Write a short answer or choose “Prefer not to share”');
  }

  const updatedGuest = await guestStore.update((draft) => {
    if (question.type === 'choice' || question.type === 'choice-text') {
      draft.answers[question.id] = {
        type: question.type,
        optionId: selectedOption?.id ?? null,
        label: selectedOption?.label ?? null,
        ...(text ? { text } : {})
      };
    } else if (question.type === 'multi') {
      draft.answers[question.id] = {
        type: 'multi',
        optionIds: selectedOptions.map((option) => option.id),
        labels: selectedOptions.map((option) => option.label),
        ...(text ? { text } : {})
      };
    } else {
      draft.answers[question.id] = { type: 'text', text, declined: Boolean(answer.declined && !text) };
    }
    if (selectedOption) addScore(draft.personaScores, selectedOption.scores || {});
    for (const option of selectedOptions) addScore(draft.personaScores, option.scores || {});

    const questionsInSession = activeQuestions.filter((item) => item.session === draft.sessionIndex);
    const sessionDone = questionsInSession.every((item) => draft.answers[item.id]);
    if (sessionDone) {
      draft.completedSessions.push(Date.now());
      draft.sessionIndex += 1;
      if (draft.sessionIndex < 3) draft.connectAvailableAt = Date.now() + incubationWaitMs;
      else {
        draft.connectAvailableAt = null;
        draft.persona = choosePersona(draft.personaScores);
        draft.messagePack = selectLocalPack(draft.persona, draft.answers);
        draft.hatchedAt = null;
        draft.reminderRemainingMs = reminderIntervalMs;
        draft.followUpState = null;
        draft.pendingReminder = null;
        draft.nextReminderKind = 'suggestion';
      }
    }
  });
  if (updatedGuest.hatchedAt) await resumeReminderClock();
  return getIncubationState();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: 'DOST',
    icon: appIcon,
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
  // The window is larger than the card by a transparent gutter so the card's shadow fades out
  // instead of being clipped into grey corners. Keep in sync with .overlay-page padding.
  const gutter = 12;
  const width = 390 + gutter * 2;
  const height = 176 + gutter * 2;
  const margin = 18 - gutter;

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
  tray = new Tray(appIcon.resize({ width: 32, height: 32, quality: 'best' }));
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

// The model can take a minute or two, so if the user looked away, tell them the egg is ready to open.
function notifyDostReady() {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && mainWindow.isFocused()) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.flashFrame(true);
    mainWindow.once('focus', () => mainWindow?.flashFrame(false));
  }
  const title = 'Your DOST is ready!';
  const body = 'Come say hello.';
  if (Notification.isSupported()) {
    const notification = new Notification({ title, body });
    notification.on('click', () => showMainWindow());
    notification.show();
  } else {
    tray?.displayBalloon({ title, content: body });
  }
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
  const scheduleSnapshot = reminderClock?.snapshot() ?? null;
  reminderClock?.stop();
  (async () => {
    await guestStore?.flush();
    if (scheduleSnapshot && guestStore?.get().persona) {
      await guestStore.update((draft) => { draft.reminderSchedule = scheduleSnapshot; });
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
