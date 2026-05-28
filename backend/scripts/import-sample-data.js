require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { importRows } = require('../src/importer');

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'sample-product-import.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');

  const result = await importRows(csvText, true);

  console.log(JSON.stringify({
    accepted: result.accepted,
    rejected: result.rejected,
    rejectedRows: result.rejectedRows.map((entry) => ({
      lineNumber: entry.lineNumber,
      error: entry.error,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
