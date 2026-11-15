// m9 automated translation check: every language has every key, the same {placeholders},
// the same HTML tags and the same emoji as English, and nothing is left in English by mistake.
// Run: node tests/i18n-check.mjs [--dump]   (--dump writes en|xx pairs to i18n-review/ for a language review)
import fs from 'fs';
const src = fs.readFileSync(new URL('../game/i18n.js', import.meta.url), 'utf8')
  .replace(/^export function[\s\S]*$/m, '').replace(/^export /gm, '');
const T = new Function(src + '\nreturn { en, es, pt, hi, id };')();
const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
const tags = (s) => (s.match(/<\/?\w+/g) || []).sort().join(',');
const emo = (s) => (s.match(/\p{Extended_Pictographic}/gu) || []).sort().join('');
// strings that are fine to keep identical to English (brand names, symbols, numbers, loanwords)
const SAME_OK = /^[\s\p{P}\p{S}\d{}a-z]*$|^(FLASH|VIP|GOAT|OK|STOP|DJ|Star Gems?|❓.*|.*\{\w+\}.*)$/u;
// Reviewed and kept the same as English on purpose (m9 AI review, round 3):
// VIRAL and ADMIN are spelled the same in es/pt/id; Indonesian players use "Rebirth", "Album", "Superstar"
// and the item name "Mega Flash" as-is.
const SAME_KEYS = { es: ['r1', 'admin5'], pt: ['r1', 'admin5'], hi: [], id: ['r1', 'r3', 'admin5', 'mRebirth', 'mAlbum', 'up_flash', 'rbTitle', 'rbGo'] };
let fails = 0; const out = [];
for (const code of ['es', 'pt', 'hi', 'id']) {
  const L = T[code], E = T.en, issues = [];
  for (const k of Object.keys(E)) {
    if (!(k in L)) { issues.push(`missing  ${k}`); continue; }
    const e = String(E[k]), x = String(L[k]);
    if (ph(e) !== ph(x)) issues.push(`placeholders ${k}: en[${ph(e)}] ${code}[${ph(x)}]`);
    if (tags(e) !== tags(x)) issues.push(`html ${k}: en[${tags(e)}] ${code}[${tags(x)}]`);
    if (emo(e) !== emo(x)) issues.push(`emoji ${k}: en[${emo(e)}] ${code}[${emo(x)}]`);
    if (e === x && e.length > 3 && !SAME_OK.test(e) && !SAME_KEYS[code].includes(k)) issues.push(`untranslated ${k}: ${e}`);
  }
  for (const k of Object.keys(L)) if (!(k in E)) issues.push(`extra ${k}`);
  fails += issues.length;
  out.push(`== ${code}: ${Object.keys(E).length} keys, ${issues.length} issues`, ...issues.map((i) => '  ' + i));
}
console.log(out.join('\n'));
if (process.argv.includes('--dump')) {
  const dir = new URL('../i18n-review/', import.meta.url); fs.mkdirSync(dir, { recursive: true });
  for (const code of ['es', 'pt', 'hi', 'id']) fs.writeFileSync(new URL(code + '.tsv', dir), Object.keys(T.en).map((k) => `${k}\t${T.en[k]}\t${T[code][k]}`).join('\n'));
}
process.exit(fails ? 1 : 0);
