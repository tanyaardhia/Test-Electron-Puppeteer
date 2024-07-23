const { contextBridge, ipcRenderer } = require("electron");

// untuk menghubungkan kode antara renderer (HTML/javascript)
contextBridge.exposeInMainWorld("api", {
  // untuk mengirimkan data login ke main proses
  loginTikTok: (credentials) => ipcRenderer.send("login-tiktok", credentials),

  // untuk menerima respon login yang dikirim oleh main proses
  onLoginSuccess: (callback) => ipcRenderer.on("login-success", callback),
});
