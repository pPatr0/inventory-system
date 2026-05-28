const { parse } = require('csv-parse/sync');
const line = 'P1001,USB-C Kabel 1m,Esbjerg,120,49.95,Accessories';
const result = parse(line, { delimiter: ',', relaxQuotes: true, trim: true, columns: false });
console.log(JSON.stringify(result));
console.log('type', Array.isArray(result), result.length);
