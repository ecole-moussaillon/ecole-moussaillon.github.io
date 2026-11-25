# Moussaillon : l'école pirate — fiche de passation

## Règles de travail
- Toujours répondre en **français**. Vérifier les faits avant de les affirmer, citer les sources, dire « Je ne peux pas vérifier cette information » si besoin, et terminer les réponses issues d'une recherche par un niveau de confiance (élevé / moyen / faible).
- **Aucun secret** dans le dépôt ni dans la conversation : clés Apple, keystore Android et mots de passe vivent uniquement dans les secrets GitHub Actions.
- Contact public : pierrerouby@gmail.com (App Store), ecolemoussaillon@gmail.com (Google Play : fiche et IARC) ; jamais l'adresse Studi. Ne jamais demander d'identifiants Apple.
- Ne rien soumettre à Apple ou Google, et ne rien publier sur `main`, sans l'accord de l'utilisateur.

## Le produit
Jeu éducatif pirate, du CP au CM2. 15 îles : 8 de maths (canons, stade, mine, formes, jungle, marché, cuisine, horloge) et 7 de français, anglais et culture (lecture, conjug, anglais, culture, gram, accords, vocab). Chaque île a 10 niveaux : coffre au niveau 5, boss au niveau 10. Il y a aussi des doublons, des pierres précieuses, un navire, un port à bâtir, un équipage, une saga, des quêtes, plusieurs profils d'enfants et un espace parents derrière une question parentale. Gratuit, sans pub, sans achat, aucune donnée collectée, fonctionne hors ligne.

## Code
- **Une seule source : `src/app.html`** (environ 6 400 lignes : CSS, puis JS, puis générateurs de questions).
- `sh tools/build.sh` produit `index.html` (l'en-tête `<head>` est dans build.sh). `python3 tools/mk_sw.py 2.5 .` produit `sw.js` (cache hors ligne).
- Test local : `python3 -m http.server 8765`. Playwright est utilisable ; `window.__arch` expose les fonctions de test : `startEscale`, `endEscale`, `IS`, `renderIsle`, `openParents`, `check`, `gens`, `R`, `S`…
- Sauvegarde dans localStorage : profils dans `moussaillon-profils`, profil 1 dans `archipel-nombres-v2`. Progression par classe dans `S.g[classe].isl[île]` = `{node, rank, stars, ok, tot, ms}`.
- Rangs d'île (2.5) : `rank` 0 bronze au départ, 1 argent après le boss, 2 or (île maîtrisée).
- Questions sans répétition : `qKey` / `qUsed` / `pickQ`, `RECENT = 80`.
- Tablette et grand écran : sur iPad, `build.sh` fixe la largeur de mise en page à 560 px (balise viewport). Sur ordinateur, `fitTablet()` agrandit l'appli avec `transform: scale(UIZ)`. Les unités vw/vh passent par `--vw`/`--vh` ; une position mesurée à l'écran se divise par `UIZ`.
- Appli native détectée par `nativeApp` (Capacitor) et `iosApp`. Mode administrateur `?admin` : web seulement, jamais dans les applis (Apple l'a refusé au titre de la règle 2.2).
- Sons dans `assets/audio` : voix `vo-*`, musiques `mus-*`, bruitages `sfx-*`, avec variantes jouées à tour de rôle.

## Publication
- **Web** : GitHub Pages, branche `main`, https://ecole-moussaillon.github.io/
- **iOS** : Capacitor (`ios-app/`), qui embarque les fichiers du jeu. Bundle `io.github.pierreroubydroid.chiffres`, Apple ID de l'appli 6825742947. Workflows à lancer à la main :
  - `ios-app-store.yml` : compilation, le numéro de build est le numéro d'exécution. Menu « machine » au lancement : `macos-26-intel` par défaut depuis le 25/11/2026 (les Mac arm64 de GitHub restaient en file d'attente, annotation « capacity constraints »), `macos-26` (arm64) en option, même image et même Xcode. Xcode 27 n'existe que sur arm64 : y revenir pour le SDK iOS 27 ;
  - `ios-soumission.yml` : fiche et soumission (fastlane deliver, sous Linux, `reject_if_possible`) ;
  - `ios-etat.yml` : lecture seule (versions, prix, pays, avis écrits).
  - Métadonnées dans `fastlane/metadata/fr-FR`. Publication manuelle après la validation d'Apple.
- **Android** : TWA Bubblewrap (`android/`), paquet `io.github.pierrerouby_droid.chiffres`. L'appli affiche le site web en ligne. Workflow `android-play.yml` (paquet .aab signé, versionName 2.5).
- **État au 22/11/2026** :
  - iOS 2.6 (build 24) soumise à l'examen d'Apple le 22/11 (fiche 2.6 : Baie des Défis, « Pi t'explique », boss parlants, flotte, carte vivante, et les nouvelles URLs ecole-moussaillon.github.io). Publication manuelle après accord.
  - iOS 2.5 (build 23) en ligne, disponible dans 175 pays, statut de commerçant UE validé.
  - Avertissement Apple informatif (build 24) : à partir d'avril 2027, compiler avec le SDK iOS 27 (passer le workflow ios-app-store.yml sur l'image macOS à Xcode 27 le moment venu). Vision Pro non pris en charge pour la catégorie Enfants : normal, aucune action.
  - **0 note et 0 avis publiés**, alors que des amis disent avoir noté : probablement retenus par la modération ou le filtre anti-fraude d'Apple (avis groupés le même jour, au même endroit).
  - Google Play : test fermé obligatoire de 12 testeurs pendant 14 jours (compte personnel), pas encore lancé.

## Chantiers en cours
1. **Migration vers le compte GitHub `ecole-moussaillon`** : faite au 19/11/2026. Le dépôt est transféré et renommé (`ecole-moussaillon/ecole-moussaillon.github.io`), la branche de migration est fusionnée dans `main`, et le site https://ecole-moussaillon.github.io/ sert le jeu, `.well-known/assetlinks.json` (une empreinte SHA-256 en place) et l'import des sauvegardes `#import=…`. Les URLs fastlane (marketing, confidentialité, support) pointent vers la nouvelle adresse.
   - Redirection de l'ancienne adresse : en ligne depuis le 19/11/2026. Dépôt `pierrerouby-droid/Chiffres-l-abordage` (GitHub Pages, branche `main`) avec `index.html`, `404.html` et trois copies (`aide.html`, `support.html`, `confidentialite.html`) pour que les URLs exactes de l'ancienne fiche App Store répondent en 200. Tout redirige vers https://ecole-moussaillon.github.io/ en emportant les sauvegardes (`#import=…`).
   - URLs de la fiche App Store : les métadonnées fastlane sont prêtes, mais la 2.5 est approuvée (`READY_FOR_DISTRIBUTION`, publication manuelle) donc sa fiche est verrouillée ; les nouvelles URLs partiront avec la prochaine version (2.5.1 ou 2.6 : nouveau build `ios-app-store.yml` puis `ios-soumission.yml`). En attendant, la redirection ci-dessus répare les liens de la fiche en ligne.
   - Reste à faire : régénérer et téléverser le paquet Android (.aab) pointant vers la nouvelle adresse ; vérifier que l'installation de l'application GitHub de Claude sur le compte est faite.
   - Vérifier que l'empreinte dans `assetlinks.json` est bien celle de la clé de signature Google Play (et pas seulement la clé d'upload) ; sinon l'ajouter.
2. **Communication** (`design/com`, `design/video-reseaux.md`, `design/seedance-refs`) : vidéo d'aperçu App Store, visuels, invites Seedance des 4 plans et voix off. Le montage de la vidéo des réseaux attend les plans Seedance.
3. **Monétisation envisagée plus tard** : gratuit, puis achat unique à 4,99 € (étude de marché dans un document Claude).

## Audit global demandé
Passer en revue toute l'application :
- bugs JS et cas limites des générateurs de questions ;
- justesse pédagogique par classe ;
- accessibilité ;
- performances (poids des images et des sons, cache hors ligne) ;
- cohérence des textes ;
- conformité Apple (règles 1.3 catégorie Enfants, 2.2, 3.1.1) et Google (Familles) ;
- sécurité et vie privée.

Rapporter les constats classés par gravité avant de corriger.
