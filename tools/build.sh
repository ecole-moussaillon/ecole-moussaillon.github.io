#!/bin/sh
# Assemble la page complète du dépôt à partir du fragment publié en Artifact.
SRC="${1:-src/app.html}"; OUT="${2:-index.html}"
{
cat <<'HEAD'
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>/* Tablette (iPad) : le jeu, pensé en portrait pour téléphone, est agrandi d'un bloc avec une mise en page de 560 px de large, celle du jeu */
(function(){try{if(Math.min(screen.width,screen.height)>=700)document.querySelector('meta[name=viewport]').setAttribute('content','width=560, viewport-fit=cover')}catch(e){}})()</script>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Moussaillon">
<meta name="theme-color" content="#0B2230">
<meta name="description" content="Réviser du CP au CM2 en jouant aux pirates : maths, français, anglais, géométrie et culture générale. Gratuit, sans publicité, sans achat, aucune donnée collectée.">
<!-- Aperçu des liens partagés (WhatsApp, Messenger, Facebook, SMS…) -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Moussaillon">
<meta property="og:title" content="Moussaillon : l’école pirate">
<meta property="og:description" content="Réviser du CP au CM2 en jouant aux pirates. Gratuit, sans pub, sans achat.">
<meta property="og:url" content="https://ecole-moussaillon.github.io/">
<meta property="og:image" content="https://ecole-moussaillon.github.io/apercu.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Le navire de Moussaillon toutes voiles dehors au coucher du soleil">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>
HEAD
cat "$SRC"
printf '\n</html>\n'
} > "$OUT"
