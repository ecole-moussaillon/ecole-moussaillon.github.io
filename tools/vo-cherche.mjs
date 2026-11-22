// Recherche dans la bibliothèque de voix partagées ElevenLabs et fabrique une
// page d'écoute locale (ecoute-voix.html, ignorée par git).
// Usage : node tools/vo-cherche.mjs            → requêtes par défaut (voix jeune garçon, FR)
//         node tools/vo-cherche.mjs "ma requête" "autre requête"
//         node tools/vo-cherche.mjs --essai    → fait dire une phrase FR aux candidates
//                                               trouvées au dernier passage (~60 crédits/voix,
//                                               ajout puis retrait immédiat de « Mes voix »)
//         node tools/vo-cherche.mjs --essai id1 id2  → seulement ces voice_id
// Clé : variable d'environnement ELEVENLABS_API_KEY (jamais dans le dépôt).
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Définis ELEVENLABS_API_KEY d’abord.'); process.exit(1); }
const H = { 'xi-api-key': KEY };
const CACHE = 'ecoute-voix.json'; // ignoré par git (ecoute-*)
const PHRASE = 'Pour additionner 27 et 15, je commence par les unités : 7 plus 5, ça fait 12. Je pose 2 et je garde 1 dans ma tête.';
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function pageEcoute(list) {
  const rows = list.map(v => `
  <div class="v">
    <h3>${esc(v.name)} <small>${esc(v.gender || '?')} · ${esc(v.age || '?')} · ${esc(v.language || '?')} · clonée ${v.cloned_by_count || 0}×</small></h3>
    <p>${esc(v.description || '')}</p>
    ${v.essai ? `<p><b>Essai en français :</b></p><audio controls preload="none" src="${esc(v.essai)}"></audio>` : ''}
    <p><small>Extrait d’origine :</small></p><audio controls preload="none" src="${esc(v.preview_url)}"></audio>
    <div><code>${v.voice_id}</code> <small>(trouvée via : ${esc(v._q)})</small></div>
  </div>`).join('\n');
  writeFileSync('ecoute-voix.html', `<!doctype html><meta charset="utf-8"><title>Voix candidates</title>
<style>body{font:15px system-ui;max-width:720px;margin:2em auto;padding:0 1em}
.v{border:1px solid #ccc;border-radius:10px;padding:.8em 1em;margin:.8em 0}
h3{margin:.1em 0}small{color:#777;font-weight:normal}code{background:#eee;padding:2px 6px;border-radius:4px}
audio{width:100%}</style>
<h1>${list.length} voix candidates pour la voix pédagogique</h1>
<p>Écoute, puis donne à Claude le <code>voice_id</code> de celle que tu retiens.</p>
${rows}`);
  console.log(`\n${list.length} voix → ecoute-voix.html`);
}

if (process.argv.includes('--essai')) {
  // Fait parler les candidates en français : ajout → TTS Turbo → retrait.
  if (!existsSync(CACHE)) { console.error('Lance d’abord la recherche (node tools/vo-cherche.mjs).'); process.exit(1); }
  const list = JSON.parse(readFileSync(CACHE, 'utf8').replace(/^﻿/, ''));
  const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const todo = only.length ? list.filter(v => only.includes(v.voice_id)) : list;
  mkdirSync('ecoute-essais', { recursive: true }); // ignoré par git (ecoute-*)
  for (const v of todo) {
    if (v.essai && existsSync(v.essai)) { console.log(`=   ${v.name} : essai déjà fait`); continue; }
    // 1. Ajouter la voix partagée à « Mes voix »
    const add = await fetch(`https://api.elevenlabs.io/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: `Essai Moussaillon (${v.name})` }),
    });
    if (!add.ok) { console.error(`ÉCHEC ajout ${v.name} : ${(await add.text()).slice(0, 160)}`); continue; }
    const myId = (await add.json()).voice_id || v.voice_id;
    // 2. Générer la phrase d'essai (Turbo, débit léger)
    const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${myId}?output_format=mp3_22050_32`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: PHRASE, model_id: 'eleven_turbo_v2_5', language_code: 'fr' }),
    });
    if (tts.ok) {
      const f = `ecoute-essais/${v.voice_id}.mp3`;
      writeFileSync(f, Buffer.from(await tts.arrayBuffer()));
      v.essai = f;
      console.log(`OK  ${v.name} → ${f}`);
    } else console.error(`ÉCHEC TTS ${v.name} : ${(await tts.text()).slice(0, 160)}`);
    // 3. Retirer la voix pour libérer l'emplacement
    const del = await fetch(`https://api.elevenlabs.io/v1/voices/${myId}`, { method: 'DELETE', headers: H });
    if (!del.ok) console.error(`  (retrait de ${v.name} à faire à la main : ${(await del.text()).slice(0, 120)})`);
  }
  writeFileSync(CACHE, JSON.stringify(list, null, 2));
  pageEcoute(list);
  process.exit(0);
}

const custom = process.argv.slice(2).filter(a => !a.startsWith('--'));
// Chaque entrée : [étiquette, paramètres de requête]
const SEARCHES = custom.length
  ? custom.map(q => [q, { search: q, language: 'fr' }])
  : [
      ['garçon FR (jeune, masculin)', { language: 'fr', gender: 'male', age: 'young', page_size: '12' }],
      ['boy (texte libre, FR)', { search: 'boy', language: 'fr', page_size: '12' }],
      ['enfant (texte libre, FR)', { search: 'enfant', language: 'fr', page_size: '12' }],
      ['kid voice (toutes langues)', { search: 'kid boy', page_size: '12' }],
    ];

const seen = new Map();
for (const [label, params] of SEARCHES) {
  const qs = new URLSearchParams({ page_size: '12', ...params });
  const r = await fetch(`https://api.elevenlabs.io/v1/shared-voices?${qs}`, { headers: H });
  if (!r.ok) { console.error(`ÉCHEC « ${label} » : HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); continue; }
  const voices = (await r.json()).voices || [];
  console.log(`« ${label} » : ${voices.length} voix`);
  for (const v of voices) {
    if (!v.preview_url || seen.has(v.voice_id)) continue;
    seen.set(v.voice_id, {
      voice_id: v.voice_id, public_owner_id: v.public_owner_id, name: v.name,
      gender: v.labels?.gender || v.gender, age: v.labels?.age || v.age, language: v.language,
      cloned_by_count: v.cloned_by_count || 0, description: v.description, preview_url: v.preview_url, _q: label,
    });
  }
}

const list = [...seen.values()].sort((a, b) => b.cloned_by_count - a.cloned_by_count);
if (!list.length) { console.error('Aucune voix trouvée.'); process.exit(1); }
writeFileSync(CACHE, JSON.stringify(list, null, 2));
pageEcoute(list);
console.log('Pour les entendre en français : node tools/vo-cherche.mjs --essai');
