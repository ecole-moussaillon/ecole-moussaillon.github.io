// Harnais 4 : mix sur sauvegarde saine, injection via lampOn/gear, fins d'escale et montées de rang
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
global.window = global;
global.document = { querySelector: s => s === '#app' ? appEl : null, querySelectorAll: () => [], createElement: t => el(t), body: el('body'), documentElement: el('html'), addEventListener() {}, hidden: false };
global.localStorage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
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
global.location = { hash: '', search: '', pathname: '/', protocol: 'https:', reload() {} };
global.setTimeout = () => 0;

eval(code);
const A = window.__arch;
const out = [];

// ---- 1. mix sur sauvegarde saine ----
try {
  A.setGrade('ce2');
  for (let r = 0; r < 10; r++) {
    A.startEscale('mix', 1, false);
    let guard = 0; while (A.R && !A.R.done && guard++ < 20) { A.R.res.push(true); A.R.ok++; A.R.k++; A.nextQ(); }
    if (guard >= 20) { out.push('mix sain : BOUCLE'); break; }
  }
  out.push('mix sain ×10 : OK');
} catch (e) { out.push('mix sain : CRASH => ' + e.message); }

// ---- 2. injection via lampOn / gear (sauvegarde hostile restaurée) ----
try {
  const PAYLOAD = '"><u id=pwn>injected</u>';
  A.S.gear.push(PAYLOAD); A.S.lampOn = PAYLOAD;
  // renderCrew passe par shipArt
  const renderCrew = null;
  // renderMap inclut la classe du ship-token : simulons par renderIsle? Non — passons par l'écran Équipage via show
  // show() non exposé ; mais startEscale('canons') => sceneHTML contient shipArt
  A.startEscale('canons', 1, false);
  const htmlOut = appEl._html || '';
  out.push('injection lampOn dans le HTML généré ? ' + (htmlOut.includes('<u id=pwn>') ? 'OUI — XSS CONFIRMÉE' : 'non trouvée'));
  A.S.gear.pop(); A.S.lampOn = '';
} catch (e) { out.push('injection : CRASH => ' + e.message); }

// ---- 3. montée de rang : gagner le boss du rang bronze puis argent ----
try {
  A.setGrade('cm1');
  const s = A.IS('stade');
  s.node = 10; s.rank = 0; s.stars = { 1: 3 }; s.ok = 0; s.tot = 0; s.ms = 0; s.fails = 0;
  A.startEscale('stade', 10, false);
  // gagner 8/8
  while (A.R && !A.R.done) { A.R.res.push(true); A.R.ok++; A.R.k++; A.nextQ(); }
  out.push(`boss bronze gagné : rank=${s.rank} node=${s.node} ps=${s.ps} gems=${A.S.gems}`);
  // route argent jusqu'au boss
  s.node = 10;
  A.startEscale('stade', 10, false);
  while (A.R && !A.R.done) { A.R.res.push(true); A.R.ok++; A.R.k++; A.nextQ(); }
  out.push(`boss argent gagné : rank=${s.rank} node=${s.node} (attendu rank=2)`);
  // rejouer le boss au rang or
  A.startEscale('stade', 10, false);
  while (A.R && !A.R.done) { A.R.res.push(true); A.R.ok++; A.R.k++; A.nextQ(); }
  out.push(`boss or rejoué : rank=${s.rank} node=${s.node} (doit rester 2)`);
} catch (e) { out.push('rangs : CRASH => ' + e.message); }

// ---- 4. escale perdue : fails, revanches ----
try {
  A.setGrade('ce2');
  const s = A.IS('mine'); s.node = 3;
  A.startEscale('mine', 3, false);
  let logs = [];
  while (A.R && !A.R.done) { logs.push(A.R.q.log); A.R.res.push(false); A.R.k++; A.nextQ(); }
  out.push(`escale perdue : fails=${s.fails} (attendu 1)`);
} catch (e) { out.push('escale perdue : CRASH => ' + e.message); }

console.log(out.join('\n'));
process.exit(0);
