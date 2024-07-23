const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  loginTikTok: (credentials) => ipcRenderer.send("login-tiktok", credentials),
  onLoginSuccess: (callback) => ipcRenderer.on("login-success", callback),
});
