// Test des voix pédagogiques candidates : 3 textes du jeu × débits × modèles × voix,
// page d'écoute comparative ecoute-test/index.html (ignorée par git).
// Usage : node tools/vo-test.mjs                        → modèle turbo, voix de la liste VOICES
//         node tools/vo-test.mjs --modele v4 <voice_id> → autre modèle (turbo | v4 | multi)
// Les fichiers déjà générés sont gardés (pas de re-facturation) et la page
// montre tout ce qui existe dans ecoute-test/.
// Clé : variable d'environnement ELEVENLABS_API_KEY (jamais dans le dépôt).
import { writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Définis ELEVENLABS_API_KEY d’abord.'); process.exit(1); }

const VOICES = ['JvD1a0L9rABccms2q9zH', 'O31r762Gb3WFygrEOGh0'];
const MODELS = { turbo: 'eleven_turbo_v2_5', v4: 'eleven_v4', multi: 'eleven_multilingual_v2' };
const TEXTS = [
  ['consigne', 'Charge les canons, moussaillon ! Compte bien les boulets avant de tirer.'],
  ['indice', 'Pour additionner 27 et 15, je commence par les unités : 7 plus 5, ça fait 12. Je pose 2 et je garde 1 dans ma tête.'],
  ['encouragement', 'Presque ! Regarde bien l’horloge : la petite aiguille montre les heures, la grande montre les minutes. Essaie encore !'],
];
const FORMATS = [['leger', 'mp3_22050_32'], ['confort', 'mp3_44100_64']];

const argv = process.argv.slice(2);
const mi = argv.indexOf('--modele');
const mKey = mi >= 0 ? argv[mi + 1] : 'turbo';
const MODEL = MODELS[mKey];
if (!MODEL) { console.error(`Modèle inconnu « ${mKey} » (choix : ${Object.keys(MODELS).join(', ')}).`); process.exit(1); }
const asked = argv.filter((a, i) => !a.startsWith('--') && i !== mi + 1);
const voices = asked.length ? asked : VOICES;
mkdirSync('ecoute-test', { recursive: true });

for (const voice of voices) {
  for (const [tn, text] of TEXTS) {
    for (const [fn, fmt] of FORMATS) {
      const f = `ecoute-test/${voice}-${tn}-${fn}-${mKey}.mp3`;
      if (existsSync(f)) { console.log(`=   ${voice.slice(0, 6)}… ${tn} ${fn} ${mKey} : déjà là`); continue; }
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${fmt}`, {
        method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: MODEL, language_code: 'fr' }),
      });
      if (!r.ok) { console.error(`ÉCHEC ${voice.slice(0, 6)}… ${tn}/${fn}/${mKey} : HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      writeFileSync(f, buf);
      console.log(`OK  ${voice.slice(0, 6)}… ${tn} ${fn} ${mKey} : ${(buf.length / 1024).toFixed(0)} Ko`);
    }
  }
}

// Page comparative : une carte par texte, une colonne par voix, les modèles/débits existants dedans.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const files = readdirSync('ecoute-test').filter(f => f.endsWith('.mp3'));
const allVoices = [...new Set(files.map(f => f.split('-')[0]))];
const cards = TEXTS.map(([tn, text]) => {
  const blocks = allVoices.map(voice => {
    const rows = Object.keys(MODELS).flatMap(mk => FORMATS.map(([fn, fmt]) => {
      const f = `${voice}-${tn}-${fn}-${mk}.mp3`;
      if (!files.includes(f)) return '';
      const ko = (statSync('ecoute-test/' + f).size / 1024).toFixed(0);
      return `<p><b>${mk} · ${fn}</b> <small>(${ko} Ko)</small></p><audio controls preload="none" src="${f}"></audio>`;
    })).join('\n');
    return rows.trim() ? `<div class="w"><h4><code>${voice}</code></h4>${rows}</div>` : '';
  }).join('\n');
  return `<div class="v"><h3>${esc(tn)}</h3><p>«&nbsp;${esc(text)}&nbsp;»</p><div class="cols">${blocks}</div></div>`;
}).join('\n');

writeFileSync('ecoute-test/index.html', `<!doctype html><meta charset="utf-8"><title>Test voix pédagogique</title>
<style>body{font:15px system-ui;max-width:980px;margin:2em auto;padding:0 1em}
.v{border:1px solid #ccc;border-radius:10px;padding:.8em 1em;margin:.8em 0}
.cols{display:flex;gap:1em;flex-wrap:wrap}.w{flex:1;min-width:300px;background:#f6f6f6;border-radius:8px;padding:.5em .8em}
h3{margin:.1em 0}h4{margin:.2em 0}small{color:#777}audio{width:100%}code{font-size:12px}</style>
<h1>Voix candidates · modèles : turbo = eleven_turbo_v2_5 · v4 = eleven_v4 · multi = eleven_multilingual_v2</h1>
${cards}`);
console.log('\nPage d’écoute : ecoute-test/index.html');
