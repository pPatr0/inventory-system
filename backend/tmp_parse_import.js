const { parseImportText } = require('./src/importer');
const fs = require('fs');
const path = require('path');
const csvText = fs.readFileSync(path.join(__dirname, 'data', 'sample-product-import.csv'), 'utf8');
const parsed = parseImportText(csvText);
console.log('entries', parsed.length);
console.log(JSON.stringify(parsed.slice(0, 10), null, 2));
