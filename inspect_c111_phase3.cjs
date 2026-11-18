const fs = require('fs');
const c111 = fs.readFileSync('c111.ts', 'utf-8');
const idx = c111.indexOf('PHASE 3: Publish the Reel!');
console.log(c111.slice(idx, idx + 2000));
