// Harnais 3 : mix/test du capitaine, sauvegardes corrompues, #import hostile, restoreFrom
'use strict';
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
function el(tag) {
  const e = {
    tag, style: new Proxy({}, { get: (t, k) => k === 'setProperty' || k === 'removeProperty' ? () => {} : t[k], set: (t, k, v) => { t[k] = v; return true; } }),
    children: [], dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null,
    appendChild(c) { this.children.push(c); return c; }, prepend() {}, after() {}, remove() {},
    addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 375, bottom: 700, width: 375, height: 700 }),
    get firstElementChild() { return null; },
    clientWidth: 375, clientHeight: 700, offsetTop: 0, scrollTop: 0, scrollHeight: 0,
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
    set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; },
    focus() {}, click() {}, animate: () => ({}),
  };
  if (tag === 'canvas') { e.getContext = () => new Proxy({}, { get: (t, k) => k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} }); }
  return e;
}
const appEl = el('div');
const mem = new Map();
const storage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
global.window = global;
global.document = { querySelector: s => s === '#app' ? appEl : null, querySelectorAll: () => [], createElement: t => el(t), body: el('body'), documentElement: el('html'), addEventListener() {}, hidden: false };
global.localStorage = storage; global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
global.atob = s => Buffer.from(s, 'base64').toString('binary');
global.history = { replaceState() {} };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });
global.innerWidth = 375; global.innerHeight = 700;
global.addEventListener = () => {}; global.matchMedia = () => ({ matches: false });
global.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
global.requestAnimationFrame = () => 0;
global.Image = class { set src(v) {} };
global.fetch = () => Promise.reject(new Error('x'));
global.XMLHttpRequest = class { open() {} send() { this.onerror && this.onerror(); } };
const realST = global.setTimeout; global.setTimeout = () => 0;

// ---- 1. #import hostile : clé non préfixée, JSON valide ----
const payload = { 'archipel-nombres-v2': JSON.stringify({ name: '<img src=x onerror=alert(1)>', gold: 1e9, g: { ce2: { isl: { canons: {} } } } }), 'evil': 'x', 'moussaillon-profils': JSON.stringify({ cur: 'p1', list: [{ id: 'p1', name: 'kid' }] }) };
global.location = { hash: '#import=' + encodeURIComponent(global.btoa(unescape(encodeURIComponent(JSON.stringify(payload))))), search: '', pathname: '/', protocol: 'https:', reload() {} };

eval(code);
const A = window.__arch;
const out = [];
out.push('import: clé evil copiée ? ' + (mem.has('evil') ? 'OUI (BUG)' : 'non'));
out.push('import: sauvegarde copiée ? ' + (mem.has('archipel-nombres-v2') ? 'oui' : 'NON'));
out.push('S.name après import hostile : ' + JSON.stringify(A.S.name));
out.push('S.gold : ' + A.S.gold);

// ---- 2. Sauvegarde corrompue : île sans stars/ok/tot ----
try {
  const s = A.IS('canons'); // entrée {} venue de l'import
  out.push('IS(canons) après import = ' + JSON.stringify(s));
  // renderIsle sur cette entrée corrompue
  try { A.renderIsle('canons'); out.push('renderIsle(canons) corrompu : OK, pas de crash'); }
  catch (e) { out.push('renderIsle(canons) corrompu : CRASH => ' + e.message); }
  try { A.startEscale('canons', 1, false); out.push('startEscale corrompu : OK ; R.n=' + (A.R && A.R.n)); }
  catch (e) { out.push('startEscale corrompu : CRASH => ' + e.message); }
} catch (e) { out.push('IS corrompu : CRASH => ' + e.message); }

// ---- 3. mix et test du capitaine ----
try {
  A.setGrade('ce2');
  A.startEscale('mix', 1, false);
  let guard = 0; while (A.R && !A.R.done && guard++ < 30) { A.R.res.push(true); A.R.ok++; A.R.k++; A.nextQ(); }
  out.push('escale mix : ' + (guard < 30 ? 'OK (' + guard + ' questions)' : 'BOUCLE'));
} catch (e) { out.push('escale mix : CRASH => ' + e.message); }
try {
  A.startEscale('test', 1, false);
  let guard = 0; while (A.R && !A.R.done && guard++ < 80) { A.R.res.push(true); A.R.ok++; if (A.R.test) { const T = A.R.test, id = T.list[T.at]; if (T.st === 0) T.st = 1; else { T.res[id] = 3; T.at++; T.st = 0; } } A.R.k++; A.nextQ(); }
  out.push('test du capitaine : ' + (guard < 80 ? 'OK (' + guard + ' questions)' : 'BOUCLE'));
} catch (e) { out.push('test du capitaine : CRASH => ' + e.message); }

// ---- 4. restoreFrom ----
const tryRestore = (label, codeStr) => { try { out.push(`restore ${label} : ` + (A.S, eval('false'))); } catch (e) {} };
// accès direct impossible (restoreFrom non exposé) ; on teste via le code de sauvegarde rond-trip :
// (non exposé — vérifié par lecture de code)

// ---- 5. qUsed / recent : saturation d'une petite banque ----
try {
  A.setGrade('cp');
  let rep = 0, tot = 0;
  for (let e2 = 0; e2 < 25; e2++) {
    A.startEscale('horloge', 3, false); // cpClock : 12 questions possibles
    const seen = new Set(); let guard = 0;
    while (A.R && !A.R.done && guard++ < 10) { const k = A.R.q.qk; tot++; if (seen.has(k)) rep++; seen.add(k); A.R.res.push(true); A.R.ok++; A.R.k++; A.nextQ(); }
  }
  out.push(`petite banque (cp horloge n3) : ${tot} questions, répétitions intra-escale : ${rep}`);
} catch (e) { out.push('petite banque : CRASH => ' + e.message); }

console.log(out.join('\n'));
process.exit(0);
