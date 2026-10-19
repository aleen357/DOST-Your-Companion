const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dost', Object.freeze({
  showReminderPreview: () => ipcRenderer.send('dost:show-reminder-preview'),
  getIncubationState: () => ipcRenderer.invoke('dost:get-incubation-state'),
  checkLocalModel: () => ipcRenderer.invoke('dost:check-local-model'),
  skipLocalGeneration: () => ipcRenderer.invoke('dost:skip-local-generation'),
  generateLocalPack: () => ipcRenderer.invoke('dost:generate-local-pack'),
  getReminderPresentation: () => ipcRenderer.invoke('dost:get-reminder-presentation'),
  showReminderNow: () => ipcRenderer.invoke('dost:show-reminder-now'),
  onReminderUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, presentation) => callback(presentation);
    ipcRenderer.on('dost:reminder-updated', listener);
    return () => ipcRenderer.removeListener('dost:reminder-updated', listener);
  },
  resetIncubation: () => ipcRenderer.invoke('dost:reset-incubation'),
  submitAnswer: (questionId, answer) => ipcRenderer.invoke('dost:submit-answer', { questionId, answer }),
  dismissReminder: (action) => {
    if (['ok', 'cross'].includes(action)) {
      ipcRenderer.send('dost:dismiss-reminder', action);
    }
  }
}));
