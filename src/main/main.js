const { app, BrowserWindow, ipcMain, nativeImage, screen, Tray, Menu } = require('electron');
const path = require('node:path');
const { questions } = require('../shared/questions');
const { createGuestStore } = require('./guest-store');
const { addScore, choosePersona } = require('./persona');
const { selectLocalPack } = require('./message-selection');
const { getPersona } = require('../shared/personas');

app.setName('DOST');

let mainWindow;
let reminderWindow;
let tray;
let isQuitting = false;
let guestStore;
let dataRecoveryNotice = false;
const isDemo = process.argv.includes('--demo');
const resetGuestOnLaunch = process.argv.includes('--reset-guest');
const incubationWaitMs = isDemo ? 30_000 : 24 * 60 * 60 * 1000;

function getIncubationState() {
  const guest = guestStore.get();
  const profile = guest.persona ? getPersona(guest.persona) : null;
  const now = Date.now();
  const sessionQuestions = questions.filter((question) => question.session === guest.sessionIndex);
  const question = sessionQuestions.find((item) => !guest.answers[item.id]) || null;
  return {
    recovered: dataRecoveryNotice,
    demo: isDemo,
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
ipcMain.handle('dost:reset-incubation', async () => {
  await guestStore.reset();
  dataRecoveryNotice = false;
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

  await guestStore.update((draft) => {
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
      }
    }
  });
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
    if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.showInactive();
  });
  reminderWindow.once('closed', () => {
    reminderWindow = null;
  });
  return reminderWindow;
}

function showReminderPreview() {
  const window = createReminderWindow();
  if (window.webContents.isLoading() === false) window.showInactive();
}

function createTray() {
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="10" fill="#76d6b0"/><path d="M5 21c0-6 4-11 11-11s11 5 11 11c0 3-3 5-11 5S5 24 5 21Z" fill="#eafff6"/><circle cx="12" cy="19" r="1.5" fill="#24465f"/><circle cx="20" cy="19" r="1.5" fill="#24465f"/><path d="M13 22q3 2 6 0" fill="none" stroke="#24465f" stroke-linecap="round"/></svg>`;
  tray = new Tray(nativeImage.createFromDataURL(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`));
  tray.setToolTip('DOST — your desk companion');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open DOST', click: () => showMainWindow() },
    { label: 'Show companion preview', click: () => showReminderPreview() },
    { type: 'separator' },
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
ipcMain.on('dost:dismiss-reminder', (_event, action) => {
  if (!['ok', 'cross'].includes(action)) return;
  if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
});

app.whenReady().then(() => {
  guestStore = createGuestStore(app.getPath('userData'));
  guestStore.load().then(({ recovered }) => {
    dataRecoveryNotice = recovered;
    if (resetGuestOnLaunch) {
      return guestStore.reset().then(() => {
        dataRecoveryNotice = false;
        createTray();
        createMainWindow();
        app.on('activate', () => showMainWindow());
      });
    }
    createTray();
    createMainWindow();
    app.on('activate', () => showMainWindow());
  }).catch((error) => {
    console.error('Could not initialize guest data:', error);
    app.quit();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // DOST stays available in the Windows tray until the user chooses Quit.
});
