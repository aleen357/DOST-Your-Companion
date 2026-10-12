const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dost', Object.freeze({
  showReminderPreview: () => ipcRenderer.send('dost:show-reminder-preview'),
  getIncubationState: () => ipcRenderer.invoke('dost:get-incubation-state'),
  resetIncubation: () => ipcRenderer.invoke('dost:reset-incubation'),
  submitAnswer: (questionId, answer) => ipcRenderer.invoke('dost:submit-answer', { questionId, answer }),
  dismissReminder: (action) => {
    if (['ok', 'cross'].includes(action)) {
      ipcRenderer.send('dost:dismiss-reminder', action);
    }
  }
}));
