import fs from 'fs';

const content = fs.readFileSync('utils/i18n.ts', 'utf8');
const frMatch = content.match(/^\s*fr:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*en:\s*\{/m);
const enMatch = content.match(/^\s*en:\s*\{([\s\S]*?)\n\s*\},\s*\n\};/m);
if (!frMatch || !enMatch) {
  console.error('Parse failed');
  process.exit(1);
}

function parseBlock(body) {
  const map = new Map();
  const re = /'([^']+)':\s*'((?:\\'|[^'])*)'/g;
  let m;
  while ((m = re.exec(body))) {
    map.set(m[1], m[2]);
  }
  return map;
}

const fr = parseBlock(frMatch[1]);
const en = parseBlock(enMatch[1]);
let added = 0;
for (const [key, value] of en) {
  if (!fr.has(key)) {
    fr.set(key, value);
    added++;
  }
}

const lines = [...fr.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `    '${k}': '${v.replace(/'/g, "\\'")}',`);

const header = content.split('export const TRANSLATIONS')[0];
const enBody = enMatch[1];
const extraEn = enMatch[0].includes('stock.productInfo') ? '' : `
    'stock.productInfo': 'Product information',
    'stock.active': 'Active',
    'stock.inactive': 'Inactive',
    'stock.barcode': 'Barcode',
    'button.back': 'Back',
`;

const out =
  header +
  'export const TRANSLATIONS: Record<Language, Record<string, string>> = {\n  fr: {\n' +
  lines.join('\n') +
  '\n  },\n  en: {' +
  enBody +
  extraEn +
  '\n  },\n};\n\n' +
  content.slice(content.indexOf('export const t ='));

fs.writeFileSync('utils/i18n.ts', out);
console.log('Merged', added, 'keys into FR. Total FR:', fr.size);
