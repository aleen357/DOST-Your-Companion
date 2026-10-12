const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dost', Object.freeze({
  showReminderPreview: () => ipcRenderer.send('dost:show-reminder-preview'),
  dismissReminder: (action) => {
    if (['ok', 'cross'].includes(action)) {
      ipcRenderer.send('dost:dismiss-reminder', action);
    }
  }
}));
