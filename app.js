document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageEl = document.getElementById('loginMessage');
  
    if (username === 'gio' && password === 'kira') {
      window.location.href = 'home.html'; // Pagina successiva
    } else {
      messageEl.textContent = 'Nome utente o password non corretti.';
      messageEl.style.display = 'block';
    }
  });
  