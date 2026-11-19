// Harnais 2 : escales simulées + vérification de check() (la bonne réponse est-elle acceptée ?)
'use strict';
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
function el(tag) {
  const e = {
    tag, style: new Proxy({}, { get: (t, k) => k === 'setProperty' || k === 'removeProperty' ? () => {} : t[k], set: (t, k, v) => { t[k] = v; return true; } }),
    children: [], dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null,
    appendChild(c) { this.children.push(c); return c; }, prepend() {}, after() {}, remove() {},
    addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 375, bottom: 700, width: 375, height: 700 }),
    get firstElementChild() { return null; },
    clientWidth: 375, clientHeight: 700, offsetTop: 0, offsetHeight: 0, scrollTop: 0, scrollHeight: 0,
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
    set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; },
    focus() {}, click() {}, animate: () => ({}),
  };
  if (tag === 'canvas') { e.width = 0; e.height = 0; e.getContext = () => new Proxy({}, { get: (t, k) => k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} }); }
  return e;
}
const appEl = el('div');
const storage = () => { let m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
global.window = global;
global.document = { querySelector: s => s === '#app' ? appEl : null, querySelectorAll: () => [], createElement: t => el(t), body: el('body'), documentElement: el('html'), addEventListener() {}, hidden: false };
global.localStorage = storage(); global.sessionStorage = storage();
global.location = { hash: '', search: '', pathname: '/', protocol: 'https:', reload() {} };
global.history = { replaceState() {} };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });
global.innerWidth = 375; global.innerHeight = 700;
global.addEventListener = () => {}; global.matchMedia = () => ({ matches: false });
global.requestAnimationFrame = () => 0;
global.Image = class { set src(v) {} };
global.fetch = () => Promise.reject(new Error('x'));
global.XMLHttpRequest = class { open() {} send() { this.onerror && this.onerror(); } };
// Neutraliser les setTimeout du jeu pendant la simulation (advance/voix), on pilote à la main
const realST = global.setTimeout;
let mute = false;
global.setTimeout = (fn, ms) => mute ? 0 : realST(fn, ms);

eval(code);
const A = window.__arch;
const problems = new Map();
const flag = (k, ex) => { const p = problems.get(k) || { n: 0, ex }; p.n++; problems.set(k, p); };
mute = true;

function fmtDigits(n) { return [Math.floor(n / 1000), Math.floor(n % 1000 / 100), Math.floor(n % 100 / 10), n % 10]; }
function paySet(target, denoms) { // glouton puis correction simple avec 1 et 2
  const tray = []; let c = target;
  for (const d of [...denoms].sort((a, b) => b - a)) while (c >= d) { tray.push(d); c -= d; }
  return c === 0 ? tray : null;
}
function testCheck(q) {
  const R = A.R; if (!R || !q) return;
  const tag = `check/${q.kind}`;
  try {
    let res;
    switch (q.kind) {
      case 'keypad': case 'mineRead': R.input = String(q.answer); res = A.check(); break;
      case 'type': R.input = q.answer; res = A.check(); break;
      case 'mine': { const [m, c, d, u] = fmtDigits(q.target); R.counts = [m, c, d, u]; res = A.check(); break; }
      case 'line': R.pick = q.k; res = A.check(); break;
      case 'money': { const t = paySet(q.target, q.denoms); if (!t) { flag('money: glouton impayable', q.log); return; } R.tray = t; res = A.check(); break; }
      case 'pizza': { const need = q.n * q.parts / q.d; R.sel = new Set(Array.from({ length: need }, (_, i) => i)); res = A.check(); break; }
      case 'words': R.wsel = new Set(q.ans); res = A.check(); break;
      default: { const good = q.choices.find(c => c.v === q.answer); if (!good) { flag(`${tag}: pas de bon choix`, q.log); return; } res = A.check(good); break; }
    }
    if (!res || res[0] !== true) flag(`${tag}: BONNE RÉPONSE REFUSÉE`, `${q.log} => answer=${JSON.stringify(q.answer)} res=${JSON.stringify(res)}`);
    // réponses fausses acceptées ? (choix seulement)
    if (q.choices) for (const c of q.choices) {
      if (c.v === q.answer) continue;
      const r2 = A.check(c);
      if (r2[0]) flag(`${tag}: MAUVAISE RÉPONSE ACCEPTÉE`, `${q.log} => v=${JSON.stringify(c.v)} answer=${JSON.stringify(q.answer)}`);
    }
  } catch (e) { flag(`${tag}: EXCEPTION check`, `${q.log} => ${e.message}`); }
}

let escales = 0, questions = 0, dupInEscale = 0;
for (const g of ['cp', 'ce1', 'ce2', 'cm1', 'cm2']) {
  A.setGrade(g);
  for (const isle of A.ISLES) {
    if (isle.soon) continue;
    for (const node of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (let rep = 0; rep < 3; rep++) {
        try {
          A.startEscale(isle.id, node, false);
          escales++;
          const seen = new Set();
          let guard = 0;
          while (A.R && !A.R.done && guard++ < 40) {
            const q = A.R.q;
            questions++;
            const k = q.qk || '(nokey)';
            if (k !== '(nokey)' && seen.has(k) && !q.retry && !q.rev) dupInEscale++;
            seen.add(k);
            testCheck(q);
            // avance : bonne réponse comptée à la main (sans answer() et ses timers)
            A.R.res.push(true); A.R.ok++; A.R.k++;
            A.nextQ();
          }
          if (guard >= 40) flag('escale: boucle > 40 questions', `${g}/${isle.id}/n${node}`);
        } catch (e) { flag('escale: EXCEPTION', `${g}/${isle.id}/n${node} => ${e.message}\n${(e.stack || '').split('\n')[1] || ''}`); }
      }
    }
  }
}
console.log(`Escales simulées : ${escales}, questions : ${questions}, doublons intra-escale : ${dupInEscale}`);
const sorted = [...problems.entries()].sort((a, b) => b[1].n - a[1].n);
for (const [k, p] of sorted.slice(0, 40)) console.log(`\n[${p.n}×] ${k}\n    ex : ${p.ex}`);
if (!sorted.length) console.log('Aucun problème détecté.');
process.exit(0);
