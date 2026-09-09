const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  checkLicense: () => ipcRenderer.invoke('check-license'),
  // Add SQL query methods here
  querySql: (query) => ipcRenderer.invoke('sql-query', query)
});
