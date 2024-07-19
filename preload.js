window.addEventListener("DOMContentLoaded", () => {
  const { ipcRenderer } = require("electron");
  const from = document.getElementById("LoginForm");

  from.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    ipcRenderer.send("login-tiktok", { email, password });
  });

  ipcRenderer.on("login-response", (event, message) => {
    if (response.success) {
      alert("login successful! >>>", message);
    } else {
      alert("login failed");
    }
  });
});
