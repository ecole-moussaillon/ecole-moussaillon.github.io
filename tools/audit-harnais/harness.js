// Harnais d'audit : exécute le JS de src/app.html dans Node avec des stubs DOM,
// puis appelle chaque générateur de questions des milliers de fois et vérifie les invariants.
'use strict';
const fs = require('fs');
const path = process.argv[2];
const html = fs.readFileSync(path, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('script introuvable'); process.exit(1); }
const code = m[1];

// ---------- Stubs ----------
function el(tag) {
  const e = {
    tag, style: new Proxy({}, { get: (t, k) => k === 'setProperty' || k === 'removeProperty' ? () => {} : t[k], set: (t, k, v) => { t[k] = v; return true; } }),
    children: [], dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    appendChild(c) { this.children.push(c); return c; }, prepend() {}, after() {}, remove() {},
    addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
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
const appEl = el('div'); appEl.id = 'app';
const storage = () => { let m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear() }; };
global.window = global;
global.document = {
  querySelector: s => s === '#app' ? appEl : null, querySelectorAll: () => [],
  createElement: t => el(t), body: el('body'), documentElement: el('html'),
  addEventListener() {}, hidden: false,
};
global.localStorage = storage(); global.sessionStorage = storage();
global.location = { hash: '', search: '', pathname: '/', protocol: 'https:', reload() {} };
global.history = { replaceState() {} };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'node', storage: null }, configurable: true });
global.innerWidth = 375; global.innerHeight = 700;
global.addEventListener = () => {}; global.removeEventListener = () => {};
global.matchMedia = () => ({ matches: false });
global.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {};
global.Image = class { set src(v) { this._s = v; } get src() { return this._s; } };
global.fetch = () => Promise.reject(new Error('no net'));
global.XMLHttpRequest = class { open() {} send() { this.onerror && this.onerror(); } };

// ---------- Charger ----------
try { eval(code); } catch (e) { console.error('ÉCHEC CHARGEMENT :', e && e.stack); process.exit(1); }
const A = window.__arch;
if (!A) { console.error('__arch absent'); process.exit(1); }

// ---------- Vérifications ----------
const problems = new Map(); // clé -> {count, exemple}
function flag(key, detail) {
  const p = problems.get(key) || { n: 0, ex: detail };
  p.n++; if (!p.ex) p.ex = detail;
  problems.set(key, p);
}
const KBDCHARS = new Set([...'azertyuiopqsdfghjklmwxcvbn’-éèêàçùâîô '.toLowerCase()]);
function canPay(target, denoms) {
  if (target <= 0) return false;
  // DP bitset simple
  const ok = new Uint8Array(target + 1); ok[0] = 1;
  for (const d of denoms) for (let v = d; v <= target; v++) if (ok[v - d]) ok[v] = 1;
  return !!ok[target];
}
function checkQ(name, grade, l, q) {
  if (!q || typeof q !== 'object' || !q.kind) { flag(`${name}/${grade}: question invalide`, JSON.stringify(q).slice(0, 120)); return; }
  const tag = `${name}/${grade}/l${l}/${q.kind}`;
  if (q.choices) {
    const vals = q.choices.map(c => String(c.v));
    if (new Set(vals).size !== vals.length) flag(`${tag}: choix en double`, `${q.log} => [${vals.join(' | ')}]`);
    const hit = q.choices.filter(c => c.v === q.answer).length;
    if (hit !== 1) flag(`${tag}: bonne réponse absente ou multiple (${hit})`, `${q.log} answer=${JSON.stringify(q.answer)} choix=[${vals.join(' | ')}]`);
    if (q.choices.length < 2) flag(`${tag}: moins de 2 choix`, q.log);
  }
  if (['keypad', 'mineRead'].includes(q.kind)) {
    if (!Number.isInteger(q.answer) || q.answer < 0) flag(`${tag}: réponse clavier non entière/négative`, `${q.log} => ${q.answer}`);
    else if (!q.big && String(q.answer).length > 6) flag(`${tag}: réponse > 6 chiffres sans big`, `${q.log} => ${q.answer}`);
    else if (String(q.answer).length > 9) flag(`${tag}: réponse > 9 chiffres`, `${q.log} => ${q.answer}`);
  }
  if (q.kind === 'money') {
    if (!Number.isInteger(q.target) || q.target <= 0) flag(`${tag}: cible monnaie invalide`, `${q.log} => ${q.target}`);
    else if (!canPay(q.target, q.denoms)) flag(`${tag}: cible impayable avec les pièces`, `${q.log} target=${q.target} denoms=${q.denoms}`);
  }
  if (q.kind === 'pizza') {
    const need = q.n * q.parts / q.d;
    if (!Number.isInteger(need) || need <= 0 || need > q.parts) flag(`${tag}: parts à colorier impossibles`, `${q.log} need=${need}/${q.parts}`);
  }
  if (q.kind === 'line' || q.kind === 'lineRead') {
    if (!(q.k >= 0 && q.k <= 10)) flag(`${tag}: graduation hors ligne`, `${q.log} k=${q.k}`);
    if (q.kind === 'lineRead') {
      for (const c of q.choices) { const kk = (c.v - q.start) / q.step; if (!(kk >= 0 && kk <= 10 && Math.abs(kk - Math.round(kk)) < 1e-9)) flag(`${tag}: choix hors graduations`, `${q.log} v=${c.v} start=${q.start} step=${q.step}`); }
    }
  }
  if (q.kind === 'words') {
    if (!Array.isArray(q.ans) || !q.ans.length) flag(`${tag}: aucune bonne réponse (words)`, q.log);
    else if (q.ans.some(k => k < 0 || k >= q.chips.length)) flag(`${tag}: index hors chips`, q.log);
  }
  if (q.kind === 'compare') {
    const [[a, b], [c, d]] = q.fr; const x = a / b, y = c / d;
    const sym = Math.abs(x - y) < 1e-9 ? '=' : x < y ? '<' : '>';
    if (q.answer !== sym) flag(`${tag}: signe de comparaison faux`, `${q.log} attendu ${sym}, donné ${q.answer}`);
  }
  if (q.typeable && q.typeable.ans != null) {
    const bad = [...String(q.typeable.ans).toLowerCase()].filter(ch => !KBDCHARS.has(ch) && ch !== "'");
    if (bad.length) flag(`${tag}: réponse à taper avec caractères hors clavier`, `${q.log} => "${q.typeable.ans}" (${bad.join(',')})`);
  }
  for (const k of ['ask', 'explain']) if (typeof q[k] === 'string' && /NaN|undefined/.test(q[k])) flag(`${tag}: NaN/undefined dans ${k}`, `${q.log} => ${q[k].slice(0, 160)}`);
  if (typeof q.answerText === 'string' && /NaN|undefined/.test(q.answerText)) flag(`${tag}: NaN/undefined dans answerText`, `${q.log} => ${q.answerText}`);
}

const N = parseInt(process.argv[3] || '400', 10);
const grades = ['cp', 'ce1', 'ce2', 'cm1', 'cm2'];
let total = 0, errors = 0;
for (const g of grades) {
  A.setGrade(g);
  const gens = Object.entries(A.gens);
  for (const [name, gen] of gens) {
    // île jouable dans cette classe ?
    const isle = A.ISLES.find(i => i.gen === gen);
    if (isle && isle.only && !isle.only.includes(g)) continue;
    for (let l = 1; l <= 5; l++) {
      for (let t = 0; t < N; t++) {
        total++;
        try { checkQ(name, g, l, gen(l)); }
        catch (e) { errors++; flag(`${name}/${g}/l${l}: EXCEPTION`, String(e && e.message).slice(0, 200)); }
      }
    }
  }
}
console.log(`Questions générées : ${total}, exceptions : ${errors}`);
const sorted = [...problems.entries()].sort((a, b) => b[1].n - a[1].n);
for (const [k, p] of sorted) console.log(`\n[${p.n}×] ${k}\n    ex : ${p.ex}`);
if (!sorted.length) console.log('Aucun problème détecté par le harnais.');
process.exit(0); // le setInterval du jeu garderait Node en vie
