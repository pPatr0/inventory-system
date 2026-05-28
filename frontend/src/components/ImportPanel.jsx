import { useState } from 'react';

export function ImportPanel({ onValidate, onImport, summary }) {
  const [csvText, setCsvText] = useState('');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Data import</p>
          <h2>Import product list</h2>
        </div>
      </div>

      <p className="muted">Paste CSV text or use the sample format. The import validates rows first, so broken lines are rejected instead of being inserted.</p>

      <textarea
        className="import-textarea"
        value={csvText}
        onChange={(event) => setCsvText(event.target.value)}
        placeholder="product_id,product_name,warehouse,quantity,price,category"
      />

      <div className="inline-two">
        <button className="primary-button" onClick={() => onValidate(csvText)} type="button">Validate import</button>
        <button className="primary-button" onClick={() => onImport(csvText)} type="button">Import into database</button>
      </div>

      {summary && (
        <div className={`status-banner ${summary.rejected > 0 ? 'error' : ''}`}>
          <p><strong>{summary.commit ? 'Import result' : 'Validation result'}</strong></p>
          <p>Accepted rows: {summary.accepted}</p>
          <p>Rejected rows: {summary.rejected}</p>
          {summary.rejectedRows?.length > 0 && (
            <ul>
              {summary.rejectedRows.slice(0, 8).map((entry, index) => (
                <li key={`${entry.lineNumber}-${index}`}>Line {entry.lineNumber}: {entry.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
