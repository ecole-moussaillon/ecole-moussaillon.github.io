// Génération des voix de boss (lot B) avec ElevenLabs v4.
// Usage :  node tools/vo-boss.mjs [--design] [--cast] [--sample] [--only vo-b-canons-in-1] [--force]
//   --design : crée les voix sur mesure (Voice Design : géant, pieuvre, chouette, ara) et les distribue.
//   --cast   : choisit dans la bibliothèque partagée ElevenLabs une voix typée par famille de boss,
//              l'ajoute au compte, et écrit la distribution dans tools/vo-cast.json (à lancer une fois).
//   --sample : seulement la réplique d'entrée de chaque boss (15 fichiers), pour écouter avant de tout générer.
// La clé API est lue dans ELEVENLABS_API_KEY (jamais écrite ici ni dans le dépôt).
// Voix unique « pirate » pour tous les boss, différenciée par les balises v4 de chaque réplique.
// Sortie : assets/audio/vo-b-<île>-<in|mid|out>-1.mp3 (exclus du cache initial, chargés comme la saga).
'use strict';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const VOICE = 'xFHsB7ym6VZKZNoONpeq'; // le pirate : voix de secours si une famille n'a pas trouvé la sienne
// Familles de voix : [clé, requête bibliothèque, îles servies]. 9 voix pour 15 boss, les balises font le reste.
const CAST = [
  ['monstre', ['deep demon monster voice'], ['canons']],
  ['profonde', ['deep female', 'mature female warm', 'female narrator deep'], ['vocab']], // la Baleine : féminine, grave, placide
  ['nasillard', ['goblin', 'gremlin', 'nasal cartoon'], ['stade']],
  ['fourbe', ['sneaky', 'sly villain', 'creepy whisper'], ['jungle', 'marche']],
  ['sage', ['wise ancient wizard storyteller'], ['culture']],
  ['melodieuse', ['enchantress', 'witch female', 'mysterious female seductive'], ['lecture', 'gram']],
  ['bourru', ['gruff old sea captain'], ['conjug']],
];
// Voix créées sur mesure (Voice Design) : retours de Pierre du 21/11 — géants plus graves et effrayants,
// pieuvre monstrueuse, chouette aiguë et tordue pour l'horloge, perroquet nasillard pour l'anglais.
const DESIGN = [
  ['geant', 'A colossal ancient stone giant. Extremely deep, cavernous, rumbling male monster voice, slow heavy delivery, gravelly texture, intimidating yet fit for a children game villain, French speaker.',
    'Mille… dix mille… cent mille… Personne ne compte plus loin que moi. MOI, Troll du Pont ! Toi pas passer sans accorder tes mots ! Carré, triangle, losange… montre-moi si ton œil est aussi droit que mes angles !',
    ['mine', 'formes', 'accords']],
  ['pieuvre', 'A monstrous octopus sea-creature chef. Deep guttural monster voice with a wet, bubbly, gurgling texture, booming and theatrical, comedic menace for a children game, French speaker.',
    'Dans MA cuisine ?! Voyons si tu sais partager une tarte sans te faire pincer ! Par ma toque, tes parts sont toujours parfaites ! Le service est fini… c’est toi le chef, moi je retourne à la plonge.',
    ['cuisine']],
  ['chouette', 'A twisted old owl clock-keeper. High-pitched, screechy, warbling creature voice, precise and slightly unhinged, with a ticking rhythm, playfully creepy for a children game, French speaker.',
    'Tic… tac… chaque seconde compte, moussaillon. Sauras-tu lire l’heure de ta défaite ? Déjà ?! Tu lis l’heure plus vite que mon aiguille ! Il est l’heure de m’incliner, ta victoire est à l’heure pile.',
    ['horloge']],
  ['ara', 'A flamboyant parrot captain. Very nasal, high-pitched, squawky bird voice with a posh British accent, quick and expressive, comedic, speaks French with English interjections.',
    'Well, well, well… bienvenue, sailor ! Voyons si tu parles la langue des mers ! Good heavens, tu réponds juste à every question ! You win, moussaillon, mon chapeau est à toi. Goodbye !',
    ['anglais']],
];
const CASTF = 'tools/vo-cast.json';
const readJson = f => JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, '')); // tolère un BOM
const voiceFor = isle => { try { const c = readJson(CASTF); return (c[isle] && c[isle].voice_id) || VOICE; } catch (e) { return VOICE; } };
const MODEL = 'eleven_v4';
const SETTINGS = { stability: 0.35, similarity_boost: 0.85 }; // bas-milieu : expressif, suit les balises

const LINES = [
  ['vo-b-canons-in-1', '[Low, booming, theatrical menace] QUI ose réciter ses tables dans MES eaux ? [chuckles] Approche, moussaillon…'],
  ['vo-b-canons-mid-1', '[annoyed, grumbling] Grrr… tu calcules plus vite que mes HUIT bras !'],
  ['vo-b-canons-out-1', '[frustrated sigh] Vaincu… par une table de multiplication. [sulking, slower] Je retourne me coucher au fond de l’eau.'],
  ['vo-b-stade-in-1', '[Quick, clipped, bossy] Pas si vite ! Ici, c’est MOI qui donne le tempo, petit mousse !'],
  ['vo-b-stade-mid-1', '[surprised, flustered] Pince alors… tu comptes plus vite que mes pinces !'],
  ['vo-b-stade-out-1', '[grumbling, deflated] D’accord, d’accord, tu as gagné… [quietly] Je file me cacher sous mon rocher.'],
  ['vo-b-mine-in-1', '[Very slow, deep, rumbling] Mille… dix mille… cent mille… Personne ne compte plus loin que moi.'],
  ['vo-b-mine-mid-1', '[slow, startled] Hein ?!… Tu empiles les nombres… plus vite que mes blocs…'],
  ['vo-b-mine-out-1', '[yawning, slow] Je retourne à la sieste… Réveille-moi dans… cent mille ans.'],
  ['vo-b-formes-in-1', '[Grand, resonant, solemn] Carré, triangle, losange… Montre-moi si ton œil est aussi droit que mes angles !'],
  ['vo-b-formes-mid-1', '[impressed, resonant] Par tous les polygones… rien ne t’échappe !'],
  ['vo-b-formes-out-1', '[slow, dignified defeat] Mes angles s’effondrent… Tu es le vrai maître des formes.'],
  ['vo-b-jungle-in-1', '[Hissing, sly, slow] Sssalut, moussaillon… Sauras-tu te repérer sssur ma longue droite graduée ?'],
  ['vo-b-jungle-mid-1', '[hissing, vexed] Ssssapristi… tu vises juste à CHAQUE graduation !'],
  ['vo-b-jungle-out-1', '[hissing, resigned, softer] Je m’enroule et je m’en vais… Tu mesures mieux que moi, sssans rancune.'],
  ['vo-b-marche-in-1', '[Raspy, scheming whisper] Hé hé… tes doublons contre ma camelote ! Sauras-tu compter ta monnaie ?'],
  ['vo-b-marche-mid-1', '[raspy, annoyed] Petit malin… impossible de te rouler sur les prix !'],
  ['vo-b-marche-out-1', '[wailing, comedic despair] Ruiné ! Me voilà ruiné… [sighs] Garde ta monnaie, tu comptes trop bien.'],
  ['vo-b-cuisine-in-1', '[Dramatic, indignant chef] Dans MA cuisine ?! Voyons si tu sais partager une tarte… sans te faire pincer !'],
  ['vo-b-cuisine-mid-1', '[astonished, dramatic] Par ma toque !… Tes parts sont toujours PARFAITES !'],
  ['vo-b-cuisine-out-1', '[exhales, gracious defeat] Le service est fini… C’est toi le chef. [quietly] Moi, je retourne à la plonge.'],
  ['vo-b-horloge-in-1', '[Measured, ticking rhythm] Tic… tac… Chaque seconde compte, moussaillon. Sauras-tu lire l’heure de ta défaite ?'],
  ['vo-b-horloge-mid-1', '[startled, precise] Déjà ?! Tu lis l’heure plus vite que mon aiguille !'],
  ['vo-b-horloge-out-1', '[measured, gracious] Il est l’heure… de m’incliner. Ta victoire est à l’heure pile.'],
  ['vo-b-lecture-in-1', '[Melodic, teasing, slow] Approche, lecteur… Mes histoires cachent des pièges… entre les lignes…'],
  ['vo-b-lecture-mid-1', '[melodic, surprised] Tu lis entre les lignes… même mes sirènes n’y arrivent pas !'],
  ['vo-b-lecture-out-1', '[soft, admiring, melodic] Quelle belle histoire… celle de ta victoire. [gentle] Je la chanterai ce soir.'],
  ['vo-b-conjug-in-1', '[Gruff, hearty, loud] Présent, futur, imparfait ! Je forge les verbes… et je vais te marteler de questions !'],
  ['vo-b-conjug-mid-1', '[gruff, impressed] Par mon enclume… tu conjugues sans UNE étincelle de travers !'],
  ['vo-b-conjug-out-1', '[gruff, warm, slower] Ma forge s’éteint… Tu manies les temps mieux que mon marteau.'],
  ['vo-b-anglais-in-1', '[Posh, strong British accent] Well, well, well… Bienvenue, sailor ! Voyons si tu parles la langue des mers !'],
  ['vo-b-anglais-mid-1', '[posh, astonished] Good heavens !… Tu réponds juste à EVERY question !'],
  ['vo-b-anglais-out-1', '[posh, gracious] You win, moussaillon… Mon chapeau est à toi. [cheerful] Goodbye !'],
  ['vo-b-culture-in-1', '[Calm, ancient, mysterious] Halte… Nul ne passe sans répondre à mes énigmes. [short pause] Pas même toi.'],
  ['vo-b-culture-mid-1', '[quietly intrigued] Étrange… aucune énigme ne te résiste…'],
  ['vo-b-culture-out-1', '[calm, warm, solemn] Tu as percé tous mes secrets… Passe, sage moussaillon.'],
  ['vo-b-gram-in-1', '[Haughty, refined, snippy] Sujet, verbe, complément… Une phrase de travers… et je mords !'],
  ['vo-b-gram-mid-1', '[scandalized, refined] Scandale… tes phrases sont PARFAITEMENT construites !'],
  ['vo-b-gram-out-1', '[refined, conceding] Je rends les armes… et le complément. Ta grammaire est sans défaut.'],
  ['vo-b-accords-in-1', '[Huge, slow, dim but proud] MOI, Troll du Pont ! Toi pas passer… sans accorder tes mots !'],
  ['vo-b-accords-mid-1', '[confused, slow] Gné ?!… Toi JAMAIS te tromper sur les accords ?!'],
  ['vo-b-accords-out-1', '[slow, humble, warm] Troll battu… Toi passer. [small sniff] Toi très fort avec les mots.'],
  ['vo-b-vocab-in-1', '[Very deep, placid, scholarly] Hmmm… Un nouveau mot entre dans mon dictionnaire : « moussaillon téméraire ».'],
  ['vo-b-vocab-mid-1', '[deep, genuinely fascinated] Fascinant… tu connais des mots que j’avais oubliés.'],
  ['vo-b-vocab-out-1', '[deep, warm, slow] Je t’offre la dernière page de mon dictionnaire : « victoire »… C’est la tienne.'],
  // Menaces de revanche (jouées après la réplique de défaite) : le boss promet de revenir, chacun à sa manière
  ['vo-b-canons-rev-1', '[booming, vengeful, theatrical] Profite de ta victoire, moussaillon… Les tentacules reviennent TOUJOURS !'],
  ['vo-b-stade-rev-1', '[quick, indignant, snippy] Tu ne perds rien pour attendre ! Je reviendrai… et je pincerai deux fois plus vite !'],
  ['vo-b-mine-rev-1', '[very slow, rumbling, sleepy menace] Je reviendrai… dans très… très… longtemps. [yawns] Mais je reviendrai.'],
  ['vo-b-formes-rev-1', '[grand, resonant, defiant] Les statues ne tombent jamais longtemps… Je me redresserai, et mes angles aussi !'],
  ['vo-b-jungle-rev-1', '[hissing, sly, lingering] Ce n’est qu’un au revoir, moussssaillon… je ramperai jusqu’à toi !'],
  ['vo-b-marche-rev-1', '[raspy, scheming chuckle] Hé hé… on se retrouvera au prochain marché, petit malin !'],
  ['vo-b-cuisine-rev-1', '[dramatic, wounded pride] Je reviendrai… avec un menu encore plus corsé ! Gare à la revanche du chef !'],
  ['vo-b-horloge-rev-1', '[measured, ticking, ominous-playful] Tic… tac… l’heure de ma revanche approche déjà, moussaillon.'],
  ['vo-b-lecture-rev-1', '[melodic, teasing, soft] Reviens vite, lecteur… la suite de mon histoire n’est pas encore écrite…'],
  ['vo-b-conjug-rev-1', '[gruff, hearty, determined] Je retourne à la forge… marteler ma revanche ! À bientôt, matelot !'],
  ['vo-b-anglais-rev-1', '[posh, mischievous] See you soon, moussaillon… la revanche sera TRÈS british !'],
  ['vo-b-culture-rev-1', '[calm, enigmatic, knowing] Toute énigme a une suite… Nous nous reverrons, sage moussaillon.'],
  ['vo-b-gram-rev-1', '[refined, vexed, sharp] Je reviendrai… avec des phrases PLUS retorses encore !'],
  ['vo-b-accords-rev-1', '[huge, slow, stubborn] Toi pas perdre rien pour attendre ! Troll revenir ! Troll TOUJOURS revenir !'],
  ['vo-b-vocab-rev-1', '[deep, placid, amused] Note bien ce mot, moussaillon : « revanche »… Nous le relirons ensemble.'],
];

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY absente de l’environnement. Dans ce terminal : $env:ELEVENLABS_API_KEY = \'…\' puis relancer.'); process.exit(1); }
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const sample = process.argv.includes('--sample');
const force = process.argv.includes('--force');
mkdirSync('assets/audio', { recursive: true });

// --design : création de voix sur mesure (Voice Design), puis distribution dans vo-cast.json
if (process.argv.includes('--design')) {
  const cast = existsSync(CASTF) ? readJson(CASTF) : {};
  for (const [fam, desc, text, isles] of DESIGN) {
    if (!force && isles.every(i => cast[i] && cast[i].fam === fam)) { console.log(`=   ${fam} : déjà créée (${cast[isles[0]].name})`); continue; }
    const prev = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-previews', {
      method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice_description: desc, text }),
    });
    if (!prev.ok) { console.error(`ÉCHEC aperçus ${fam} : HTTP ${prev.status} ${(await prev.text()).slice(0, 200)}`); continue; }
    const p = (await prev.json()).previews || [];
    if (!p.length) { console.error(`ÉCHEC ${fam} : aucun aperçu généré.`); continue; }
    const save = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-voice-from-preview', {
      method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice_name: `Moussaillon boss · ${fam}`, voice_description: desc, generated_voice_id: p[0].generated_voice_id }),
    });
    if (!save.ok) { console.error(`ÉCHEC enregistrement ${fam} : HTTP ${save.status} ${(await save.text()).slice(0, 200)}`); continue; }
    const v = await save.json();
    isles.forEach(i => { cast[i] = { voice_id: v.voice_id, name: `Moussaillon boss · ${fam}`, fam }; });
    console.log(`ok  ${fam} → voix créée (${isles.join(', ')})`);
    await new Promise(res => setTimeout(res, 500));
  }
  writeFileSync(CASTF, JSON.stringify(cast, null, 2));
  console.log(`\nDistribution mise à jour dans ${CASTF}. Relancer avec --sample --force pour régénérer les extraits.`);
  process.exit(0);
}

// --cast : distribution des voix depuis la bibliothèque partagée
if (process.argv.includes('--cast')) {
  const cast = existsSync(CASTF) ? readJson(CASTF) : {};
  for (const [fam, queries, isles] of CAST) {
    if (isles.every(i => cast[i] && cast[i].voice_id)) { console.log(`=   ${fam} : déjà distribué (${cast[isles[0]].name})`); continue; }
    let found = [];
    for (const query of queries) {
      const r = await fetch(`https://api.elevenlabs.io/v1/shared-voices?page_size=8&search=${encodeURIComponent(query)}`, { headers: { 'xi-api-key': KEY } });
      if (!r.ok) { console.error(`ÉCHEC recherche « ${query} » : HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); continue; }
      found = ((await r.json()).voices || []).sort((a, b) => (b.cloned_by_count || 0) - (a.cloned_by_count || 0));
      if (found.length) break;
      console.log(`  « ${query} » : rien, j’élargis…`);
    }
    let added = null;
    for (const v of found) {
      const add = await fetch(`https://api.elevenlabs.io/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, {
        method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: `Moussaillon boss · ${fam} (${v.name})` }),
      });
      if (add.ok) { added = { voice_id: (await add.json()).voice_id || v.voice_id, name: v.name }; break; }
      const msg = (await add.text()).slice(0, 160);
      if (/voice_limit|maximum|slots/i.test(msg)) { console.error(`Plus de place dans Mes voix (${fam}) : ${msg}`); break; }
      console.error(`  ajout refusé pour ${v.name}, j’essaie la suivante… (${msg})`);
    }
    if (!added) { console.error(`ÉCHEC famille ${fam} : aucune voix ajoutée, le pirate servira de secours.`); continue; }
    isles.forEach(i => { cast[i] = { voice_id: added.voice_id, name: added.name, fam }; });
    console.log(`ok  ${fam} → ${added.name} (${isles.join(', ')})`);
    await new Promise(res => setTimeout(res, 400));
  }
  writeFileSync(CASTF, JSON.stringify(cast, null, 2));
  console.log(`\nDistribution écrite dans ${CASTF}. Relancer avec --sample --force pour régénérer les extraits.`);
  process.exit(0);
}

let done = 0, skipped = 0, failed = 0;
for (const [name, text] of LINES) {
  if (only && name !== only) continue;
  if (sample && !/-in-1$/.test(name)) continue;
  if (process.argv.includes('--rev') && !/-rev-1$/.test(name)) continue; // seulement les menaces de revanche
  const out = `assets/audio/${name}.mp3`;
  if (existsSync(out) && !force) { skipped++; continue; }
  const isle = name.split('-')[2];
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceFor(isle)}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
  });
  if (!r.ok) { failed++; console.error(`ÉCHEC ${name} : HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); if (r.status === 401 || r.status === 429) break; continue; }
  writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  done++; console.log(`ok  ${name} (${Math.round((await import('fs')).statSync(out).size / 1024)} Ko)`);
  await new Promise(res => setTimeout(res, 400)); // politesse API
}
console.log(`\n${done} générés, ${skipped} déjà présents (utiliser --force pour refaire), ${failed} échecs.`);
