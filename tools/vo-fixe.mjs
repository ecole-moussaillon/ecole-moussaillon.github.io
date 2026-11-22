// Génération des voix fixes (corpus pédagogique) avec ElevenLabs.
// Corpus : tools/vo-corpus.json (produit par tools/vo-corpus.html via node tools/serve-corpus.mjs).
// Fichiers : assets/audio/fixe/vf-<empreinte>.mp3 + index assets/audio/fixe/idx.json (lu par le jeu).
//
// Usage :
//   node tools/vo-fixe.mjs --etat                       → coûts et avancement, ne génère rien
//   node tools/vo-fixe.mjs --champ ask,hint,chx         → génère le cœur (consignes, indices, choix)
//   node tools/vo-fixe.mjs --champ exp --classe cp      → tranche : explications du CP
//   node tools/vo-fixe.mjs --ile canons,stade           → tranche : ces îles seulement
//   node tools/vo-fixe.mjs --limite 20000               → s'arrête après ~20 000 crédits dépensés
//   node tools/vo-fixe.mjs --index                      → reconstruit seulement idx.json
// Les fichiers déjà présents sont sautés : relancer coûte seulement ce qui manque.
// Clé : variable d'environnement ELEVENLABS_API_KEY (jamais dans le dépôt).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';

const VOICE = 'O31r762Gb3WFygrEOGh0';   // voix pédagogique choisie le 22/11/2026
const MODEL = 'eleven_v4';              // le turbo v2.5 produit des artefacts en français
const FORMAT = 'mp3_22050_32';          // débit léger : inaudible vs 64 kbps sur tablette, poids moitié
const PRIX = 0.0003;                    // $ HT par crédit en dépassement (facture du 20/11/2026)
const DIR = 'assets/audio/fixe';
const CORPUS = 'tools/vo-corpus.json';

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf('--' + n); return i >= 0 ? (argv[i + 1] || '') : ''; };
const champs = opt('champ') ? opt('champ').split(',') : null;
const classes = opt('classe') ? opt('classe').split(',') : null;
const iles = opt('ile') ? opt('ile').split(',') : null;
const limite = +opt('limite') || Infinity;

if (!existsSync(CORPUS)) { console.error('Corpus absent. Lance node tools/serve-corpus.mjs puis ouvre http://localhost:8766/tools/vo-corpus.html'); process.exit(1); }
const { textes, date } = JSON.parse(readFileSync(CORPUS, 'utf8').replace(/^﻿/, ''));
const retenu = textes.filter(x =>
  (!champs || x.f.some(f => champs.includes(f))) &&
  (!classes || x.cls.some(c => classes.includes(c))) &&
  (!iles || x.iles.some(i => iles.includes(i))));

const fichier = h => `${DIR}/vf-${h}.mp3`;
const manque = retenu.filter(x => !existsSync(fichier(x.h)));
const chars = a => a.reduce((s, x) => s + x.t.length, 0);
const cout = n => `${(n * PRIX).toFixed(2)} $ HT (${(n * PRIX * 1.2).toFixed(2)} $ TTC)`;

function ecrireIndex() {
  if (!existsSync(DIR)) return;
  const hs = readdirSync(DIR).filter(f => /^vf-[a-z0-9]+\.mp3$/.test(f)).map(f => f.slice(3, -4));
  writeFileSync(`${DIR}/idx.json`, JSON.stringify(hs));
  console.log(`idx.json : ${hs.length} clips`);
}

if (argv.includes('--index')) { ecrireIndex(); process.exit(0); }

// État : coûts par champ, avancement, coût de ce qui manque dans la sélection
{
  const byF = {};
  for (const x of textes) for (const f of x.f) { byF[f] = byF[f] || { n: 0, c: 0, fait: 0 }; byF[f].n++; byF[f].c += x.t.length; if (existsSync(fichier(x.h))) byF[f].fait++; }
  console.log(`Corpus du ${date} : ${textes.length} textes, ${chars(textes).toLocaleString('fr')} caractères (${cout(chars(textes))} en tout)`);
  for (const [f, v] of Object.entries(byF)) console.log(`  ${f.padEnd(4)} : ${String(v.n).padStart(4)} textes, ${String(v.c.toLocaleString('fr')).padStart(8)} car. → ${cout(v.c)}  (générés : ${v.fait}/${v.n})`);
  console.log(`Sélection : ${retenu.length} textes ; manquants : ${manque.length} (${chars(manque).toLocaleString('fr')} car. → ${cout(chars(manque))})`);
}
if (argv.includes('--etat')) process.exit(0);
if (!manque.length) { console.log('Rien à générer.'); ecrireIndex(); process.exit(0); }

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Définis ELEVENLABS_API_KEY d’abord.'); process.exit(1); }
mkdirSync(DIR, { recursive: true });

// Les textes les plus entendus d'abord (n décroissant) : si on s'arrête, le plus utile est déjà fait
manque.sort((a, b) => b.n - a.n);
let depense = 0, ok = 0, rate = 0;
for (const x of manque) {
  if (depense + x.t.length > limite) { console.log(`Limite de ${limite} crédits atteinte (${depense} dépensés).`); break; }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=${FORMAT}`, {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: x.t, model_id: MODEL, language_code: 'fr' }),
  });
  if (!r.ok) { rate++; console.error(`ÉCHEC « ${x.t.slice(0, 50)}… » : HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); if (rate >= 5) { console.error('Trop d’échecs d’affilée possibles : arrêt.'); break; } continue; }
  writeFileSync(fichier(x.h), Buffer.from(await r.arrayBuffer()));
  depense += x.t.length; ok++;
  if (ok % 25 === 0) console.log(`  ${ok}/${manque.length} (~${depense.toLocaleString('fr')} crédits)`);
}
console.log(`${ok} clips générés, ${rate} échec(s), ~${depense.toLocaleString('fr')} crédits (${cout(depense)}).`);
ecrireIndex();
