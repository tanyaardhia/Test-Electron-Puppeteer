// untuk menambahkan event listener form login saat di submit
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault(); //mencegah form dari reload halaman saat di submit

  //mengambil value email dan passoword dari input form login
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  //mengirim data login ke main process untuk diproses
  window.api.loginTikTok({ email, password });
});

//mendaftarkan callback untuk menangani pesan "login-success" dari main process
window.api.onLoginSuccess((event, message) => {
  alert(message); // menampilkan jumlah postingan yang telah di-like
});
