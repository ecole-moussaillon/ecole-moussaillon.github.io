// Voix de Pi le perroquet (lot B, suite) : création de la voix par Voice Design, puis génération
// des 29 variantes de Pi et des 15 consignes d'îles avec ElevenLabs v4.
// Usage :  node tools/vo-pi.mjs --design          (crée la voix « Moussaillon · Pi », une fois)
//          node tools/vo-pi.mjs --sample          (6 répliques représentatives, pour écouter d'abord)
//          node tools/vo-pi.mjs                   (tout le reste ; saute les fichiers déjà présents)
//          [--only vo-jour-1] [--force]
// La clé API est lue dans ELEVENLABS_API_KEY (jamais écrite ici ni dans le dépôt).
'use strict';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const PIF = 'tools/vo-pi.json'; // { voice_id, name } une fois la voix créée
const MODEL = 'eleven_v4';
const SETTINGS = { stability: 0.4, similarity_boost: 0.85 };
const DESC = 'A friendly, cheerful parrot companion for a children game. Bright, light, warm voice with a subtle playful bird-like quality, slightly quick and bouncy, encouraging and kind, never annoying, French speaker.';
const DESIGN_TEXT = 'Ohé, moussaillon ! Bienvenue à bord ! Par mes plumes… quelle belle journée pour hisser les voiles ! Choisis ton île, je te suis — et si tu te trompes, pas de panique : on apprend, et on recommence. En avant, capitaine !';

const SAMPLE = ['vo-parents-2', 'vo-cap-canons-1', 'vo-cap-lecture-1'];
// Répartition arrêtée le 22/11/2026 : Pi n'intervient qu'en pédagogie (consignes d'îles,
// espace parents, leçons). Les variantes de carte/journal/navire/etc. et les bonjours
// jour/retour, un temps dits par Pi, ont été retirés : le capitaine reprend ces écrans.
// Leurs textes restent dans design/vo-lot-b.html et l'historique git, régénérables avec
// la voix du capitaine (xFHsB7ym6VZKZNoONpeq) si on veut un jour rendre la voix aux bonjours.
const LINES = [
  ['vo-parents-2', '[Calm, adult, reassuring] Bienvenue dans l’espace parents : tout le suivi de votre enfant est ici.'],
  // Consignes d'îles (à l'arrivée)
  ['vo-cap-canons-1', '[energetic, rallying] À l’abordage de l’Île des Canons ! Charge tes multiplications… et vise juste !'],
  ['vo-cap-stade-1', '[quick, sporty] Bienvenue au Stade des Vagues ! Calcule vite, le tempo est lancé !'],
  ['vo-cap-mine-1', '[hushed, adventurous] Descends dans la Mine aux Blocs : dizaines, centaines, milliers… tout se compte !'],
  ['vo-cap-formes-1', '[curious, inviting] Cap sur l’Île des Formes : ouvre l’œil, les figures se cachent partout !'],
  ['vo-cap-jungle-1', '[adventurous] Entre dans la Jungle des Créatures… et trouve ta place sur la droite graduée !'],
  ['vo-cap-marche-1', '[lively, market energy] Au Marché du Port, chaque pièce compte : prépare ta monnaie !'],
  ['vo-cap-cuisine-1', '[warm, appetizing] En cuisine, moussaillon ! Les fractions se partagent… comme les tartes.'],
  ['vo-cap-horloge-1', '[measured, playful] Sur l’Île de l’Horloge, chaque minute compte : lis bien les aiguilles !'],
  ['vo-cap-lecture-1', '[soft, storytelling] Bienvenue dans la Grotte aux Histoires : lis bien, la réponse est dans le texte !'],
  ['vo-cap-conjug-1', '[hearty] À la Forge des Verbes, on martèle le présent, le futur… et le passé !'],
  ['vo-cap-anglais-1', '[playful, bilingual flair] Welcome sur l’Île des Perroquets ! Ouvre grand les oreilles…'],
  ['vo-cap-culture-1', '[wondering, inviting] L’Île des Curiosités t’ouvre ses secrets : histoire, sciences et merveilles !'],
  ['vo-cap-gram-1', '[playful warning] Prudence sur le Récif des Phrases : sujet, verbe… et pas de naufrage !'],
  ['vo-cap-accords-1', '[encouraging] Pour traverser le Pont des Accords, accorde chaque mot comme il faut !'],
  ['vo-cap-vocab-1', '[warm, treasure-hunt tone] Jette l’ancre dans la Baie des Mots : ton vocabulaire, c’est ton trésor !'],
  ['vo-cap-enigmes-1', '[curious, encouraging] Bienvenue dans la Baie des Défis : lis bien, réfléchis… et résous le problème !'],
];

// Leçons « Pi t'explique » (lot D) : 40 phrases, voix de Pi, posées et claires (registre pédagogique).
// Fichiers vo-l-<île>-<étape>.mp3, chargés à l'ouverture de la leçon (hors cache initial).
const LECONS = {
  canons: ['Trois rangées de quatre boulets… Combien de boulets en tout ?', 'Une rangée, c’est 4 boulets. Et il y a 3 rangées pareilles.', 'On peut additionner : 4 plus 4 plus 4, ça fait 12.', 'Multiplier, c’est plus rapide : 3 fois 4 égale 12 !'],
  stade: ['Pour calculer vite, cherche toujours ce qui manque pour faire 10.', '7 billes… il en manque 3 pour en avoir 10 : 7 plus 3 égale 10.', 'Pour 8 plus 5 : je prends 2 pour aller à 10, et il reste 3.', 'Dix plus 3, c’est facile : 13 ! Passe toujours par le 10.'],
  mine: ['Un nombre se lit par paquets : centaines, dizaines, unités.', 'Dans 235 : 2 centaines, 3 dizaines et 5 unités.', 'Dix unités font une dizaine. Et dix dizaines font une centaine !', 'La place d’un chiffre fait sa valeur : un 3 suivi de deux chiffres vaut 300.'],
  cuisine: ['Une fraction, c’est un partage en parts égales.', 'La tarte est coupée en 4 parts égales : chaque part est un quart.', 'Trois parts sur quatre : ça s’écrit 3 sur 4, trois quarts.', 'Quatre parts sur quatre, c’est la tarte entière !'],
  horloge: ['La petite aiguille montre les heures : ici, elle est sur le 3.', 'La grande aiguille, sur le 12, dit que c’est l’heure pile : 3 heures.', 'Quand la grande aiguille est sur le 6, c’est la demie : 3 heures et demie.', 'Pour la grande aiguille, chaque chiffre vaut 5 minutes : sur le 3, c’est 15.'],
  jungle: ['Une droite graduée, c’est une règle : les nombres sont rangés dans l’ordre.', 'On part toujours de zéro, tout à gauche.', 'Pour lire la flèche, compte les sauts depuis zéro : un, deux, trois… sept !', 'Chaque petit trait vaut 1. La flèche est sur le 7.'],
  marche: ['Pour payer, on assemble des billets et des pièces.', 'Commence par les grosses pièces, puis complète avec les petites.', 'Je paie 5 euros, ça coûte 3 : on me rend 2 euros de monnaie.', 'Un euro, c’est 100 centimes. Un euro cinquante, c’est 150 centimes !'],
  formes: ['Un angle droit, c’est le coin d’un carré, comme le coin d’une feuille.', 'Plus fermé qu’un angle droit ? C’est un angle aigu.', 'Plus ouvert qu’un angle droit ? C’est un angle obtus.', 'Pour vérifier, pose le coin d’une équerre ou d’une feuille dessus !'],
  accords: ['Au pluriel, le nom prend presque toujours un s.', 'L’adjectif s’accorde aussi : il prend la marque du pluriel.', 'Avec ils ou elles, le verbe prend E-N-T. On ne l’entend pas, mais il s’écrit !', 'Repère les petits mots : les, des, mes… ils annoncent le pluriel.'],
  conjug: ['Au présent, la terminaison change avec la personne.', 'Je chante, tu chantes, il chante : e, e-s, e.', 'Nous chantons, vous chantez : faciles à reconnaître !', 'Ils chantent : E-N-T ne s’entend pas, mais ne l’oublie jamais à l’écrit.'],
};
for (const [id, steps] of Object.entries(LECONS)) steps.forEach((t, k) => LINES.push([`vo-l-${id}-${k + 1}`, `[Warm, clear, unhurried, teaching tone] ${t}`]));

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY absente de l’environnement. Dans ce terminal : $env:ELEVENLABS_API_KEY = \'…\' puis relancer.'); process.exit(1); }
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const sample = process.argv.includes('--sample');
const force = process.argv.includes('--force');
const readJson = f => JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, ''));
mkdirSync('assets/audio', { recursive: true });

if (process.argv.includes('--design')) {
  if (existsSync(PIF) && !force) { console.log(`=   la voix de Pi existe déjà (${readJson(PIF).name}) ; --design --force pour la refaire.`); process.exit(0); }
  const prev = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-previews', {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_description: DESC, text: DESIGN_TEXT }),
  });
  if (!prev.ok) { console.error(`ÉCHEC aperçus : HTTP ${prev.status} ${(await prev.text()).slice(0, 200)}`); process.exit(1); }
  const p = (await prev.json()).previews || [];
  if (!p.length) { console.error('Aucun aperçu généré.'); process.exit(1); }
  const save = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-voice-from-preview', {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_name: 'Moussaillon · Pi', voice_description: DESC, generated_voice_id: p[0].generated_voice_id }),
  });
  if (!save.ok) { console.error(`ÉCHEC enregistrement : HTTP ${save.status} ${(await save.text()).slice(0, 200)}`); process.exit(1); }
  const v = await save.json();
  writeFileSync(PIF, JSON.stringify({ voice_id: v.voice_id, name: 'Moussaillon · Pi' }, null, 2));
  console.log('ok  voix de Pi créée et enregistrée dans', PIF, '— enchaîner avec --sample.');
  process.exit(0);
}

if (!existsSync(PIF)) { console.error('Pas encore de voix de Pi : lancer d’abord  node tools/vo-pi.mjs --design'); process.exit(1); }
const VOICE = readJson(PIF).voice_id;

let done = 0, skipped = 0, failed = 0;
for (const [name, text] of LINES) {
  if (only && name !== only) continue;
  if (sample && !SAMPLE.includes(name)) continue;
  const out = `assets/audio/${name}.mp3`;
  if (existsSync(out) && !force) { skipped++; continue; }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
  });
  if (!r.ok) { failed++; console.error(`ÉCHEC ${name} : HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); if (r.status === 401 || r.status === 429) break; continue; }
  writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  done++; console.log(`ok  ${name} (${Math.round((await import('fs')).statSync(out).size / 1024)} Ko)`);
  await new Promise(res => setTimeout(res, 400));
}
console.log(`\n${done} générés, ${skipped} déjà présents (--force pour refaire), ${failed} échecs.`);
