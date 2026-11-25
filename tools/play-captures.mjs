// Images de la fiche Google Play, rendues par Chrome sans fenêtre (protocole DevTools, aucune dépendance npm).
// Prérequis : le serveur local du jeu sur http://127.0.0.1:8765 (python -m http.server 8765).
// Sortie : design/play-store/*.png (ignorés par git).
//   node tools/play-captures.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8765';
const OUT = 'design/play-store';
const PORT = 9333;
const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), 'moussaillon-play-captures-' + Date.now())}`, // profil neuf : ni cache HTTP ni service worker d'une exécution précédente
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });

let ver;
for (let t = 0; t < 50 && !ver; t++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
if (!ver) { chrome.kill(); throw new Error('Chrome ne répond pas'); }
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const wait = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { const { res, rej } = wait.get(m.id); wait.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const cdp = (method, params = {}) => new Promise((res, rej) => { const i = ++id; wait.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
const size = (width, height, deviceScaleFactor, mobile) => cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile });
const go = async (url, ms = 3000) => { await cdp('Page.navigate', { url }); await sleep(ms); };
const shot = async name => { const { data } = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, name), Buffer.from(data, 'base64')); console.log('écrit', join(OUT, name)); };

await cdp('Page.enable'); await cdp('Runtime.enable');

// 1. Image de présentation 1024 × 500
await size(1024, 500, 1, false);
await go(`${BASE}/design/play-store/feature.html`, 1500);
await shot('feature-1024x500.png');

// 2. Six écrans par format, tous en 9:16 portrait (le jeu est en portrait) :
//    téléphone 1080 × 1920 ; tablette 7 pouces 1080 × 1920 en mise en page tablette ; tablette 10 pouces 1620 × 2880.
//    Au-delà de 700 points de large, le jeu passe en mise en page tablette (agrandie, comme sur iPad).
await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
const FORMATS = [['phone', 360, 640, 3], ['tab7', 720, 1280, 1.5], ['tab10', 810, 1440, 2]];
let n = 0;
for (const [prefix, w, h, dpr] of FORMATS) {
await size(w, h, dpr, true);
await go(`${BASE}/index.html?heure=jour&f=${++n}`, 3500);
await shot(`${prefix}-1-titre.png`);

// Profil de démonstration : CE2, quelques îles avancées, tutoriels déjà vus, puis sauvegarde (le jeu sauvegarde au pagehide)
await js(`(() => { const A = window.__arch, S = A.S;
  Object.assign(S, { name: 'Léo', grade: 'ce2', intro: true, avatar: 'a', gold: 245, gems: 2, sound: false, music: false, voice: false });
  ['choices','mine','keypad','line','money','type','pizza','words','clock','tap','listen','read','gem1','star1'].forEach(k => S.tuto[k] = 1);
  A.setGrade && A.setGrade('ce2');
  const p = (id, node, stars) => { const s = A.IS(id); s.node = node; stars.forEach((v, k) => { s.stars[k + 1] = v; }); };
  p('canons', 7, [3, 3, 2, 3, 3, 2]); p('stade', 5, [3, 2, 3, 3]); p('mine', 3, [2, 3]);
  dispatchEvent(new Event('pagehide')); return true; })()`);
await go(`${BASE}/index.html?heure=jour&carte=${n}#direct`, 4000); // autre adresse : un simple changement d'ancre ne recharge pas la page
await js(`document.querySelectorAll('.toast,.coach,.modal').forEach(x => x.remove()); true`); // dont la proposition du test du capitaine
await sleep(1800); // le navire glisse jusqu'à sa place sur la route (transition de 1,2 s)
await shot(`${prefix}-2-carte.png`);

await js(`window.__arch.renderIsle('canons'); true`); await sleep(2500);
await shot(`${prefix}-3-ile.png`);

await js(`(() => { document.querySelectorAll('.modal').forEach(x => x.remove()); window.__arch.startEscale('canons', 7); return true; })()`); await sleep(2500);
await js(`document.querySelectorAll('.coach,.toast').forEach(x => x.remove()); true`);
await shot(`${prefix}-4-canons.png`);

// Mauvaise réponse tapée au pavé : la fiche d'explication de Pi
await js(`(async () => { const q = window.__arch.R.q, w = String((+q.answer || 0) + 1);
  for (const c of w) { const k = document.querySelector('[data-a="key"][data-k="' + c + '"]'); k && k.click(); await new Promise(r => setTimeout(r, 120)); }
  const ok = document.querySelector('[data-a="key"][data-k="ok"]'); ok && ok.click(); return q.kind; })()`);
await sleep(2200);
await shot(`${prefix}-5-explication.png`);

await js(`(() => { document.querySelectorAll('.sheet-err').forEach(x => x.remove()); window.__arch.startEscale('anglais', 2); return true; })()`); await sleep(2500);
await js(`document.querySelectorAll('.coach,.toast').forEach(x => x.remove()); true`);
await shot(`${prefix}-6-anglais.png`);
}

try { await cdp('Browser.close'); } catch {}
chrome.kill();
