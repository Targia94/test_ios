function caricaSezione(nome) {
  fetch(`sections/${nome}.html`)
    .then((res) => res.text())
    .then((html) => {
      const contenitore = document.getElementById("contenuto");
      contenitore.innerHTML = html;

      // ✅ Rimuovi eventuali script precedenti
      const oldScript = document.getElementById("script-dinamico");
      if (oldScript) oldScript.remove();

      // ✅ Aggiungi lo script della sezione
      const script = document.createElement("script");
      script.src = `js/${nome}.js`;
      script.id = "script-dinamico";
      script.onload = () => {
        if (typeof window[`init${capitalize(nome)}`] === "function") {
          window[`init${capitalize(nome)}`](); // es. initEsportazione()
        }
      };
      document.body.appendChild(script);
    })
    .catch((err) => {
      console.error("Errore nel caricamento sezione:", err);
      document.getElementById(
        "contenuto"
      ).innerHTML = `<p class="text-danger">Errore nel caricamento: ${err.message}</p>`;
    });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Espone la funzione globalmente
window.caricaSezione = caricaSezione;