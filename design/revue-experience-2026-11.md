# Revue expérience & contenu — Moussaillon 2.5 (20/11/2026)

Revue d'optimisation demandée après l'audit correctif : graphisme, voix, mini-leçons, lisibilité des systèmes pour l'enfant, nouvelles îles. Fondée sur l'inventaire réel du dépôt (157 images webp, 139 fichiers audio dont 106 répliques `vo-*`), la lecture du code (carte, fanions, pavillons, voix, tutos) et des captures en navigateur avec une sauvegarde aux trois rangs.

**Contraintes qui cadrent tout** : jeu 100 % hors ligne (cache initial 29,4 Mo — chaque ajout se paie), aucun réseau ni collecte, catégorie Enfants Apple (rien d'effrayant, pas de liens sortants), vieil iPad = cible de performance (animations en transform/opacity seulement, `prefers-reduced-motion` respecté partout depuis l'audit).

---

## 1. Revue graphique

### Constats
- **La règle qui explique tout** : ce qui est peint (webp) est magnifique et cohérent — îles, lagons, boss, héros, port, saga, navire, équipage. Ce qui est dessiné en SVG dans le code décroche : fanions de rang (`penSVG` : hampe + fanion en dégradé + étoile, rendu « plat »), pavillons du navire (`flagSym` : symboles blancs à plat sur `flag-blank`), et quelques ornements. C'est exactement le décalage ressenti sur les fanions argent/or.
- **La carte vit peu** : océan texturé + reflets (`glints`), brume, nuages d'orage avec éclairs sur les îles verrouillées, route en pointillés, navire-pion. Mais aucun élément vivant : pas d'oiseaux, pas d'écume autour des lagons, pas de sillage derrière le navire, port côtier immobile.
- **Les événements marquants sont des modales** : passage de rang = parchemin + fanion SVG ; boss vaincu = écran de résultat ; nouveau navire = ligne de récompense. Rien ne « se joue » sous les yeux de l'enfant.

### Recommandations (dans l'ordre coût/effet)
1. **Fanions de rang en peint** *(quick win, ~30 Ko)* : 3 webp (bronze, argent, or) dans le style des îles, ~96 px, remplaçant `penSVG` sur la carte, la fiche d'île et la modale de rang (le SVG reste en secours). C'est LE décrochage le plus visible.
2. **Carte vivante** *(quick win, 0 Ko d'assets ou presque)* :
   - 2-3 mouettes en vol lent (sprite webp 2 poses ou SVG, trajectoire CSS), jamais plus de 2 visibles ;
   - sillage en V derrière le navire-pion (2 traits CSS qui s'estompent) ;
   - écume périodique sur 2-3 lagons (pseudo-élément animé) ;
   - fumée de cheminée au port (3 ronds qui montent).
   Tout en transform/opacity, coupé par `prefers-reduced-motion` et quand l'onglet est caché.
3. **Cinématiques d'événements** *(moyen, 0 Ko — pas de vidéo : trop lourd pour le cache et inutile)* : des séquences de 2-4 s animées avec les assets existants, à 4 moments :
   - **rang gagné** : le fanion se hisse sur l'île en vue carte (mât + fanion qui monte + éclat) ;
   - **boss vaincu** : le navire du boss coule (`ship-requin-hit` existe déjà) ou le boss plonge, avant l'écran de butin ;
   - **nouveau navire** (brigantin/galion) : l'ancien sort du cadre, le nouveau entre au port toutes voiles dehors ;
   - **fin d'histoire** : les 12 morceaux de carte s'assemblent (`tmap-full` existe).
4. **Pavillons du navire** *(moyen)* : plutôt que 22 images peintes (~350 Ko), une passe « tissu » sur l'existant : texture d'étoffe + pli + ombrage ajoutés en SVG au-dessus du symbole. Gain net pour un poids nul ; les pavillons d'îles (récompense du rang or) méritent eux un vrai lot peint, à faire île par île.
5. **La flotte du chantier naval** *(demandé par Pierre, vérifié dans le code)* : les 7 « voiles » achetables (`PAINTS`) sont **une seule et même image** passée dans un filtre CSS (`hue-rotate`, `sepia`…) — on achète littéralement une teinte. Proposition :
   - un **navire peint distinct par achat**, renommé sans référence aux couleurs, du plus humble au plus spectaculaire — et le navire de départ devient volontairement modeste pour que la progression se sente :
     | id (gardé) | Nom proposé | Idée visuelle |
     |---|---|---|
     | origine | **Le Rafiot** (offert) | barque à 1 petit mât, voile rapiécée et déchirée |
     | emeraude | **La Goélette du Mousse** | 2 mâts fins, coque claire, gréement simple |
     | royal | **Le Hardi** | brick trapu, proue renforcée, voiles pleines |
     | corail | **La Sirène des Vents** | coque élancée, sculptures marines, voiles échancrées |
     | or | **Le Trésor Flottant** | boiseries sculptées, dorures, lanternes |
     | fantome | **Le Vaisseau Fantôme** | voiles translucides, lueur spectrale (reste rigolo, pas effrayant) |
     | nuit | **L'Étoile des Mers** | grand galion, voiles constellées, fanaux |
   - garder les **ids existants** (les sauvegardes qui possèdent `royal` ou `or` retrouvent leur navire renommé, rien ne casse) ;
   - **à trancher avant de dessiner** : l'articulation avec la taille du navire gagnée aux étoiles (`hull` 0-2 : chaloupe → brigantin → galion, images `ship-player-1/2/3`). Deux options : (a) les navires achetés sont des modèles à part entière, indépendants de la taille — 7 images de profil + la ligne gratuite qui garde ses 3 tailles ; (b) chaque modèle en 3 tailles = 21 images, à exclure (poids). Recommandation : option (a) ;
   - le **pion de la carte** (`ship-player-top`, vue de dessus) est aujourd'hui filtré de la même façon : soit une vue de dessus par modèle (+7 petites images), soit un pion commun non teinté — à trancher ;
   - budget : 7 profils (+7 dessus éventuels) ≈ **0,8-1,2 Mo**, le plus gros poste graphique de cette revue, mais c'est la boutique principale du jeu : c'est là que les doublons prennent leur valeur.
6. **Intégration des îles** *(fin de liste)* : ombre portée/halo de sable commun sous chaque lagon, 2-3 échelles d'îles différentes pour casser la régularité. À juger après la carte vivante.

---

## 2. Voix

### Constats
- **106 répliques enregistrées existent déjà** (Pi/capitaine) avec tirage aléatoire et anti-répétition de 3 s : accueil, départ, bravo, combo, presque, victoire, coffre, boss, tutos… mais souvent **1 à 2 variantes seulement** par événement (`ile: 2`, `journal: 1`, `pirate: 1`, `libre: 1`) : la répétition s'entend vite.
- **La synthèse vocale ne sert qu'au contenu dynamique** : lecture des questions, choix et explications. C'est irremplaçable par de l'enregistré (texte infini) — le « remplacement des voix de synthèse » doit viser les phrases fixes, pas la lecture des questions.
- **Les boss sont muets** : un nom, une image, des exclamations écrites (« BOUM ! », « TOUCHÉ ! »), deux répliques de Pi à leur sujet. Aucune incarnation sonore.

### Recommandations
1. **Faire parler les boss** *(le meilleur rapport incarnation/coût)* : 3 répliques par boss — entrée (« Qui ose troubler le Kraken des Tables ?! »), mi-combat (réaction à 3 bonnes réponses), défaite (comique, jamais amer). 15 boss × 3 ≈ 45 fichiers ; en mono ~48 kbps, 2-4 s ≈ **1,5 Mo au total**. Ton : grosse voix rigolote, menace de pacotille (catégorie Enfants). Les textes doivent exister en écrit à l'écran (accessibilité sourds, cohérent avec le réglage « Écoute + texte » ajouté à l'audit).
2. **Étoffer Pi** *(anti-répétition)* : passer les événements à 1-2 variantes à 3-4, et ajouter 3 familles contextuelles : premier lancement du jour (« Bien dormi, moussaillon ? »), retour après plusieurs jours, série de bonnes réponses en français vs maths. ~35 fichiers ≈ 1 Mo.
3. **Consignes d'îles enregistrées** *(remplace la synthèse là où ça compte)* : chaque île a une consigne fixe entendue des centaines de fois (« Charge le canon avec la bonne réponse ! »). 15 consignes enregistrées = 15 fichiers, la synthèse ne garde que la question elle-même au bouton haut-parleur. Éviter l'hybride enregistré+synthèse dans une même phrase (rupture audible).
4. **Production** : même voix et même chaîne que les `vo-*` actuels (pipeline ElevenLabs v4 existant), normalisation au niveau des fichiers en place, variantes nommées `-1/-2/-3` (le système `VO` les prend tel quel). **Budget poids global voix : +3,5 Mo max** (cache à surveiller, musiques/saga restent en différé).

---

## 3. Mini-leçons avant l'exercice

### Constats
- La vidéo est la mauvaise brique ici : 15 îles × 5 niveaux × 30 s ≈ des dizaines de Mo, incompatible avec le hors-ligne ; et une vidéo ne s'adapte ni aux nombres ni à la classe.
- Le jeu **sait déjà tout dessiner** : blocs de numération, pizza de fractions, droite graduée, horloge, monnaie, figures. Les tutos vocaux (`vo-tuto-*`, 24 fichiers) expliquent déjà *l'interface*, pas *la méthode*.

### Recommandation : des scénettes animées dans le moteur (« Pi explique »)
- Un petit moteur de scénettes scriptées (séquence d'étapes : afficher, surligner, déplacer, dire) rejouant les visuels existants : ex. « 23 + 45 » posé en blocs qui se regroupent, « 3/4 » colorié part par part sur la pizza, la grande aiguille qui avance de 5 en 5.
- 15-30 s, voix off enregistrée courte + texte affiché, bouton « Passer » toujours visible, rejouable.
- **Déclencheurs** : à l'arrivée sur un niveau jamais joué (proposé, pas imposé), depuis la fiche d'erreur (« Revoir comment on fait »), depuis le Journal (compétences « à revoir »).
- **Par où commencer** : les 10 compétences les plus ratées (les données `errors`/`fails` par île existent déjà dans la sauvegarde) — probablement retenues, fractions, heures, conversions.
- De vraies vidéos restent possibles **en ligne seulement** (page du site, jamais dans le cache ni dans les applis) — mais la scénette intégrée est meilleure pédagogiquement (mêmes visuels que l'exercice qui suit).

---

## 4. Lisibilité des systèmes pour l'enfant

### Constats
- Beaucoup de monnaies et de jauges : doublons, pierres précieuses, étoiles, rangs, coque du navire, parcelles du port, équipiers, quêtes, marée, revanches. Un adulte s'y retrouve avec aide.html ; l'enfant n'a que des miettes : un toast unique (« Cadeau de bienvenue… »), une réplique vocale à la première visite d'un onglet (`seenTab`), les textes de quêtes.
- Le compteur de pierres (vert) n'est pas nommé à l'écran ; le lien étoiles → navire et pierres → port n'est jamais montré, seulement écrit dans aide.html (que l'enfant ne lit pas).

### Recommandations
1. **« Le Code du Pirate »** dans le Journal : 5 cartes illustrées d'une phrase chacune, lues à voix haute au toucher —
   - doublons → « décorent ton navire et ton capitaine » ;
   - étoiles → « font grandir ton navire » ;
   - pierres précieuses → « construisent ton port » ;
   - fanions → « bronze, argent, or : bats le boss pour monter » ;
   - marée → « 3 escales par jour, choisies pour toi ».
   Une soirée de travail, zéro asset nouveau (les images existent toutes).
2. **Première rencontre expliquée** : généraliser le `pop(…, once)` des escales à la carte — première pierre gagnée (« Une pierre précieuse ! Touche le port pour l'utiliser »), premier fanion argent, première revanche. Un pop de 3 s à chaque première fois, jamais répété (flags dans `S.tuto`).
3. **Révélation progressive** : n'afficher le compteur de pierres qu'à partir de la première pierre, et la pastille port qu'une fois le port visité — à vérifier écran par écran, le code est prêt pour (`S.tuto`).
4. **Nommer au contact** : appui court sur un compteur du bandeau = pop d'une phrase (« 1 234 doublons : ton trésor à dépenser au navire »). L'audit a déjà mis ces infos dans les aria-labels ; les montrer aussi aux voyants.

---

## 5. Idées de nouvelles îles

Le programme couvert laisse trois vrais manques, dans l'ordre d'intérêt pédagogique :

1. **Baie des Énigmes — résolution de problèmes** *(le manque n° 1)* : les programmes 2024-2026 mettent la résolution de problèmes au centre ; le jeu n'a pas d'île dédiée aux énoncés à étapes. Générateurs : problèmes à 1 puis 2 étapes (CP : réunion/complément ; CE : multiplication/partage ; CM : multi-étapes, proportionnalité simple), avec **schéma en barres** affiché à l'explication (le moteur SVG sait le faire). Boss : « Le Sphinx des Sables ».
2. **Lagune de la Dictée — orthographe lexicale** *(le différenciateur audio)* : écrire un mot entendu (voix enregistrée ou synthèse + bouton réécouter) : CP syllabes simples, CE1 sons complexes, CE2+ mots invariables (liste officielle), CM accords dictés courts. Utilise le clavier existant ; île de la mer des Lettres. Boss : « La Pieuvre à l'Encre ».
3. **Cale aux Tonneaux — masses et contenances** : le jeu mesure des longueurs mais ni grammes ni litres (au programme dès le CE1). Pesées à équilibrer (balance SVG), tonneaux à remplir, conversions g/kg, L/cL au CM. Boss : « Le Rat de Cale ».

Autres pistes notées sans priorité : repérage/plans en île à part (gCarreaux/gDepl existent déjà dans Formes — plutôt enrichir Formes), poésie/mémorisation (difficile hors ligne), sciences (déjà couvert par Curiosités). La carte a déjà la zone « Mers inexplorées » et le mécanisme `soon` pour teaser une île avant sa sortie.

---

## Ordre de chantier proposé

| Lot | Contenu | Coût | Poids |
|---|---|---|---|
| A — quick wins | fanions peints, carte vivante, Code du Pirate, pops « première fois » | quelques jours | ~40 Ko |
| B — son | 45 répliques de boss, ~35 variantes de Pi, 15 consignes d'îles | écriture + studio ElevenLabs | ~3,5 Mo |
| C — cinématiques | rang, boss coulé, nouveau navire, carte assemblée | quelques jours | 0 Ko |
| D — mini-leçons | moteur de scénettes + 10 premières compétences | le gros chantier de fond | ~0,5 Mo (voix) |
| E — nouvelle île | Baie des Énigmes (problèmes) | générateurs + 4 images (île, lagon, héros, boss) + saga | ~400 Ko |
| F — la flotte | 7 navires distincts (noms sans couleur, du Rafiot à l'Étoile des Mers) | génération des 7 profils (+ pions éventuels), renommage, code quasi inchangé | ~1 Mo |

Chaque lot est livrable seul ; A et C ne touchent pas au cache de façon sensible ; B et E se budgettent dans `mk_sw.py`. Rien ici ne touche à la conformité (pas de réseau, pas de collecte, pas de contenu effrayant) ; la 2.5.1 iOS peut partir avant, pendant ou après.

**Réalisé le 21/11/2026 — lot B, volet boss** : les 15 boss parlent — 3 répliques chacun (entrée, inquiétude à 3 bonnes réponses, défaite comique), 45 MP3 (2,6 Mo) générés par ElevenLabs v4 via `tools/vo-boss.mjs` (clé API en variable d'environnement, jamais dans le dépôt). Distribution de 10 voix : 6 de la bibliothèque (Jerry B., Hijiri, Minerva, Toby, Grimble, Eldrin, vieux capitaine) et 4 créées sur mesure par Voice Design après les retours de Pierre (géant de pierre pour Golem/Colosse/Troll, pieuvre gargouillante, chouette aiguë et tordue, perroquet nasillard anglais) — `tools/vo-cast.json`. En jeu : bulle + voix à l'entrée du combat, bulle mi-combat, citation de défaite sur l'écran de victoire (le texte s'affiche toujours : enfants sourds, son coupé) ; fichiers hors chargement initial et hors cache initial (`vo-b-` exclu dans mk_sw.py), chargés à l'entrée du combat comme la saga. **Lot B terminé le 21/11/2026** avec le volet Pi : voix « Moussaillon · Pi » créée par Voice Design (perroquet chaleureux ; l'ancienne voix des vo-* devient canoniquement celle du capitaine Barbe-Grise), 44 MP3 (2,1 Mo, dans le cache initial via manifest.json et sw.js) : salutation du premier lancement du jour (`vo-jour`) et du retour après 3 jours (`vo-retour`) choisie à l'écran titre, consigne d'île dite à l'arrivée (une fois par île et par session, après la voix en cours), 24 variantes en rotation (carte, journal, navire, île, revanche…), espace parents au vouvoiement. Génération rejouable : tools/vo-pi.mjs (--design, --sample, --only, --force).

**Réalisé le 20/11/2026 — lots A et F** : carte vivante (mouettes, ronds d'eau, écume, fumée du port), Code du Pirate dans le Journal, pops « première fois », fanions peints (pennant-0/1/2, secours SVG conservé), et la flotte complète : images générées en deux passes (v2 après retour de Pierre : hiérarchie de taille 45 % → 98 %, nouveautés par palier, fantômes autour du Vaisseau Fantôme), le Rafiot devient le navire de départ gratuit (remplace ship-player-1, puis brigantin/galion aux étoiles), les 6 navires achetés sont des modèles à part entière avec leur vue de dessus comme pion de carte (ids conservés : les sauvegardes gardent leurs achats sous leur nouveau nom). Poids ajouté au cache : ~1,7 Mo (cache ≈ 31 Mo). Reste à régler à l'usage : les ancrages fins des ornements (figure de proue, canon, lanternes) sur chaque modèle, via `data-skin`.
