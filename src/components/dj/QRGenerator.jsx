import { useState } from 'react';

export default function QRGenerator({ partyId }) {
  const [tables, setTables] = useState(10);
  const [generated, setGenerated] = useState(false);

  const tableList = Array.from({ length: tables }, (_, i) => i + 1);

  const qrUrl = (n) => `/api/party/${partyId}/qr/${n}`;

  const handlePrintAll = () => {
    const w = window.open('', '_blank');
    const cards = tableList
      .map(
        (n) => `
        <div style="display:inline-block;margin:16px;text-align:center;
                    page-break-inside:avoid;border:1px solid #ddd;
                    border-radius:12px;padding:16px;background:#fff">
          <img src="${window.location.origin}/api/party/${partyId}/qr/${n}"
               width="180" height="180" style="display:block" />
          <p style="margin:10px 0 0;font-size:16px;font-weight:700;font-family:sans-serif">
            Mesa ${n}
          </p>
        </div>`
      )
      .join('');

    w.document.write(`<!doctype html><html><head>
      <title>QR - Mesa</title>
      <style>body{margin:20px;background:#f9f9f9}@media print{body{margin:0}}</style>
    </head><body onload="window.print()">${cards}</body></html>`);
    w.document.close();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      {/* Controles */}
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-white/60 text-sm">Numero de mesas</label>
          <input
            type="number"
            min={1}
            max={100}
            value={tables}
            onChange={(e) => {
              setTables(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)));
              setGenerated(false);
            }}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          onClick={() => setGenerated(true)}
          className="px-5 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition"
        >
          Generar
        </button>
        {generated && (
          <button
            onClick={handlePrintAll}
            className="px-5 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition"
          >
            Imprimir todos
          </button>
        )}
      </div>

      {/* URL base info */}
      <p className="text-white/30 text-xs break-all">
        Cada QR apunta a: <span className="text-white/50">{window.location.origin}/party/{partyId}?mesa=N</span>
      </p>

      {/* Grid de QRs */}
      {generated && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tableList.map((n) => (
            <QRCard key={n} n={n} url={qrUrl(n)} partyId={partyId} />
          ))}
        </div>
      )}
    </div>
  );
}

function QRCard({ n, url, partyId }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white rounded-2xl p-3 shadow">
      <img
        src={url}
        alt={`QR Mesa ${n}`}
        width={150}
        height={150}
        className="rounded-lg"
        loading="lazy"
      />
      <p className="text-gray-800 font-bold text-sm">Mesa {n}</p>
      <a
        href={url}
        download={`mesa-${n}.png`}
        className="text-xs text-purple-600 hover:text-purple-800 underline"
      >
        Descargar
      </a>
    </div>
  );
}
