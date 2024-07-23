document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    window.api.loginTikTok({ email, password });
});

window.api.onLoginSuccess((event, message) => {
  console.log(message);
});
