let db;

function initInserimento() {
  const oggi = new Date().toISOString().split('T')[0];
  document.getElementById('data-lavoro').value = oggi;

  apriDB().then(() => {
    caricaLavoriPerData(oggi);
  });

  document.getElementById('data-lavoro').addEventListener('change', () => {
    caricaLavoriPerData(document.getElementById('data-lavoro').value);
  });
}

function apriDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDB', 3);

    request.onerror = () => reject('Errore nell’apertura IndexedDB');
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('lavori')) {
        const store = db.createObjectStore('lavori', { keyPath: 'id', autoIncrement: true });
        store.createIndex('data', 'data');
      }
    };
  });
}

window.salvaLavoro = async function () {
  const data = document.getElementById('data-lavoro').value;
  const lavoro = {
    data,
    commessa: document.getElementById('commessa').value,
    cliente: document.getElementById('cliente').value,
    importo: parseFloat(document.getElementById('importo').value),
    saldato: parseFloat(document.getElementById('saldato').value),
    extra: parseFloat(document.getElementById('extra-consegna').value || 0),
    saldo: document.getElementById('saldo').value,
  };

  const tx = db.transaction('lavori', 'readwrite');
  tx.objectStore('lavori').add(lavoro);
  await tx.complete;

  caricaLavoriPerData(data);
  resetForm();
};

function caricaLavoriPerData(data) {
  const ul = document.getElementById('riepilogo-lavori');
  ul.innerHTML = '';

  const tx = db.transaction('lavori', 'readonly');
  const store = tx.objectStore('lavori');
  const index = store.index('data');

  const request = index.getAll(IDBKeyRange.only(data));
  request.onsuccess = () => {
    const lavori = request.result;
    if (lavori.length === 0) {
      ul.innerHTML = `<li class="list-group-item text-muted">Nessun lavoro per questa data.</li>`;
    } else {
      lavori.forEach(l => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = `${l.commessa} - ${l.cliente} (€${l.importo}) - ${l.saldo}`;
        ul.appendChild(li);
      });
    }
  };
}

function resetForm() {
  ['commessa', 'cliente', 'importo', 'saldato', 'extra-consegna', 'saldo']
    .forEach(id => document.getElementById(id).value = '');
}


window.initInserimento = initInserimento;
