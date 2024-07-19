window.addEventListener("DOMContentLoaded", () => {
  const { ipcRenderer } = require("electron");
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    ipcRenderer.send("login-tiktok", { email, password });
  }); ipcRenderer.on("login-success", (event, message) => {
    alert(message);
  });
});
