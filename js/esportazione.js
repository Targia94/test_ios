let db;

async function initEsportazione() {
  await apriDB();
  impostaDateSettimana();
  cercaDati();

  document.getElementById("data-da").addEventListener("change", cercaDati);
  document.getElementById("data-a").addEventListener("change", cercaDati);
  document
    .getElementById("btn-esporta-pdf")
    .addEventListener("click", generaPDF);
}

function apriDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MyDB", 3);
    request.onerror = () => reject("Errore IndexedDB esportazione");
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
  });
}

function impostaDateSettimana() {
  const oggi = new Date();
  const giornoSettimana = oggi.getDay(); // 0 = domenica
  const lunedi = new Date(oggi);
  lunedi.setDate(
    oggi.getDate() - (giornoSettimana === 0 ? 6 : giornoSettimana - 1)
  );
  const domenica = new Date(lunedi);
  domenica.setDate(lunedi.getDate() + 6);

  document.getElementById("data-da").value = lunedi.toISOString().split("T")[0];
  document.getElementById("data-a").value = domenica
    .toISOString()
    .split("T")[0];
}

async function cercaDati() {
  const da = document.getElementById("data-da").value;
  const a = document.getElementById("data-a").value;

  const lavori = await getLavoriTraDate(da, a);
  renderAttivita(lavori);
}

function getLavoriTraDate(da, a) {
  return new Promise((resolve) => {
    const tx = db.transaction("lavori", "readonly");
    const store = tx.objectStore("lavori");
    const index = store.index("data");

    const range = IDBKeyRange.bound(da, a);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });
}

function renderAttivita(lavori) {
  const tbody = document.getElementById("tabella-attivita-body");
  const riepilogo = document.getElementById("riepilogo");

  tbody.innerHTML = "";
  riepilogo.innerHTML = "";

  if (lavori.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nessuna attività trovata</td></tr>`;
    return;
  }

  let totaleContratto = 0;
  let totaleSaldato = 0;
  let extraSuConsegne = 0;

  const totali = {
    contanti: 0,
    assegni: 0,
    bonifico: 0,
    finanziamento: 0,
    sospeso: 0,
    negozio: 0,
  };

  let righe = ""; // 👈 Costruiamo tutte le righe prima

  lavori.forEach((l) => {
    const importo = parseFloat(l.importo || 0);
    const saldato = parseFloat(l.saldato || 0);
    const extra = parseFloat(l.extra || 0);

    totaleContratto += importo;
    extraSuConsegne += extra;

    if (l.saldo === "Contanti") totali.contanti += saldato;
    if (l.saldo === "Assegno") totali.assegni += saldato;
    if (l.saldo === "Bonifico") totali.bonifico += saldato;
    if (l.saldo === "Finanziamento") totali.finanziamento += saldato;
    if (l.saldo === "Pag. Negozio") totali.negozio += saldato;
    if (l.saldo === "Sospeso") totali.sospeso += saldato;

    if (l.saldo !== "Sospeso" && l.saldo !== "Pag. Negozio") {
      totaleSaldato += saldato;
    }

    righe += `
        <tr>
          <td>${l.commessa}</td>
          <td>${l.data}</td>
          <td>${l.cliente}</td>
          <td>${l.saldo}</td>
          <td>${importo.toFixed(2)}€</td>
          <td>${saldato.toFixed(2)}€</td>
          <td>${extra.toFixed(2)}€</td>
        </tr>`;
  });

  righe += `
      <tr class="fw-bold table-primary">
        <td colspan="4">Totale</td>
        <td>${totaleContratto.toFixed(2)}€</td>
        <td>${totaleSaldato.toFixed(2)}€</td>
        <td>${extraSuConsegne.toFixed(2)}€</td>
      </tr>`;

  // ✅ Applichiamo TUTTO il contenuto della tabella
  tbody.innerHTML = righe;

  const percentualeTrasporto = totaleContratto * 0.06;
  const totaleLordo = percentualeTrasporto + extraSuConsegne;

  // ✅ Ora appendiamo il blocco sotto la tabella
  riepilogo.innerHTML = `
      <div class="mt-4 p-3 bg-light border rounded">
        <h4>Riepilogo Totali</h4>
        <table class="table table-bordered">
          <tbody>
            <tr><td>Totale Contratto</td><td>${totaleContratto.toFixed(
              2
            )}€</td></tr>
            <tr><td>Percentuale Trasporto (6%)</td><td>${percentualeTrasporto.toFixed(
              2
            )}€</td></tr>
            <tr><td>Extra su Consegne</td><td>${extraSuConsegne.toFixed(
              2
            )}€</td></tr>
            <tr class="fw-bold"><td>Totale Lordo:</td><td>${totaleLordo.toFixed(
              2
            )}€</td></tr>
          </tbody>
        </table>
        <h4>Dettaglio Pagamenti</h4>
        <table class="table table-bordered">
          <tbody>
            <tr><td>Totale Contanti</td><td>${totali.contanti.toFixed(
              2
            )}€</td></tr>
            <tr><td>Totale Assegni</td><td>${totali.assegni.toFixed(
              2
            )}€</td></tr>
            <tr><td>Totale Bonifico</td><td>${totali.bonifico.toFixed(
              2
            )}€</td></tr>
            <tr><td>Totale Finanziamento</td><td>${totali.finanziamento.toFixed(
              2
            )}€</td></tr>
            <tr><td>Totale Negozio</td><td>${totali.negozio.toFixed(
              2
            )}€</td></tr>
            <tr class="fw-bold"><td>Totale:</td><td>${totaleSaldato.toFixed(
              2
            )}€</td></tr>
            <tr><td>Totale Sospeso</td><td>${totali.sospeso.toFixed(
              2
            )}€</td></tr>
          </tbody>
        </table>
      </div>`;
}

function generaPDF() {
  const doc = new jsPDF(); // Usa il contesto globale, quindi jsPDF è già disponibile

  const da = document.getElementById("data-da").value;
  const a = document.getElementById("data-a").value;

  doc.setFontSize(16);
  doc.text(`Attività dal ${da} al ${a}`, 105, 15, { align: "center" });

  // Tabelle attività
  const rows = [];
  document.querySelectorAll("#tabella-attivita-body tr").forEach((tr) => {
    const row = [];
    tr.querySelectorAll("td").forEach((td) => {
      row.push(td.textContent.trim());
    });
    if (row.length) rows.push(row);
  });

  const headers = [
    ["Commessa", "Data", "Cliente", "Pagamento", "Contratto", "Saldo", "Extra"],
  ];

  doc.autoTable({
    startY: 25,
    head: headers,
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [22, 160, 133] },
  });

  // Recupera dati dal riepilogo HTML
  const cells = document.querySelectorAll("#riepilogo td");
  const riepilogoBody = [
    ["Totale Contratto", cells[0].textContent],
    ["Percentuale Trasporto (6%)", cells[1].textContent],
    ["Extra su Consegne", cells[2].textContent],
    ["Totale Lordo", cells[3].textContent],
  ];

  const pagamentoBody = [
    ["Totale Contanti", cells[4].textContent],
    ["Totale Assegni", cells[5].textContent],
    ["Totale Bonifico", cells[6].textContent],
    ["Totale Finanziamento", cells[7].textContent],
    ["Totale Negozio", cells[8].textContent],
    ["Totale", cells[9].textContent],
    ["Totale Sospeso", cells[10].textContent],
  ];

  // Tabella Riepilogo Totali
  let offsetY = doc.autoTable.previous.finalY + 10;
  doc.autoTable({
    startY: offsetY,
    head: [["Riepilogo Totali", "Valore"]],
    body: riepilogoBody,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [100, 100, 255], textColor: 255 },
  });

  // Tabella Dettaglio Pagamenti
  offsetY = doc.autoTable.previous.finalY + 10;
  doc.autoTable({
    startY: offsetY,
    head: [["Dettaglio Pagamenti", "Importo"]],
    body: pagamentoBody,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [100, 100, 255], textColor: 255 },
  });

  // Salva PDF
  doc.save(`attivita_${da}_to_${a}.pdf`);
}

window.initEsportazione = initEsportazione;
window.cercaDati = cercaDati;
window.generaPDF = generaPDF;
