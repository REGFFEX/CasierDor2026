import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (['node_modules', 'dist', '.git', 'scripts'].includes(f) && dir === '.') continue;
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(f)) acc.push(p);
  }
  return acc;
}

const keys = new Set();
for (const file of walk('.')) {
  const c = fs.readFileSync(file, 'utf8');
  const re = /\bt\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(c))) keys.add(m[1]);
}

const i18n = fs.readFileSync('utils/i18n.ts', 'utf8');
function extractKeys(startPattern, nextMarker) {
  const re = new RegExp(`${startPattern}\\s*\\{([\\s\\S]*?)\\n\\s*\\},\\s*\\n\\s*${nextMarker}`);
  const m = i18n.match(re);
  if (!m) return new Set();
  const set = new Set();
  const kr = /'([^']+)':/g;
  let k;
  while ((k = kr.exec(m[1]))) set.add(k[1]);
  return set;
}

const fr = extractKeys('fr:', "'en-us':");
const en = extractKeys("'en-us':", "'en-uk':");
const missingFr = [...keys].filter((k) => !fr.has(k)).sort();
const missingEn = [...keys].filter((k) => !en.has(k)).sort();
console.log('Used keys:', keys.size);
console.log('FR keys:', fr.size, 'EN keys:', en.size);
console.log('Missing FR:', missingFr.length);
console.log(missingFr.join('\n'));
console.log('---');
console.log('Missing EN:', missingEn.length);
console.log(missingEn.slice(0, 80).join('\n'));
