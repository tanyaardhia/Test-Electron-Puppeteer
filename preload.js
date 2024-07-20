const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendLogin: (credentials) => ipcRenderer.send('login-tiktok', credentials)
});
