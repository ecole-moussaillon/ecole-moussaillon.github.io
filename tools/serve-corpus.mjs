// Petit serveur local pour l'extraction du corpus de voix fixes.
// Usage : node tools/serve-corpus.mjs   puis ouvrir http://localhost:8766/tools/vo-corpus.html
// Il sert le dépôt (comme python -m http.server) et accepte en plus l'écriture
// de tools/vo-corpus.json par la page d'extraction (PUT). Rien d'autre n'est inscriptible.
import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROOT = process.cwd();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method === 'PUT' && path === '/tools/vo-corpus.json') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try { JSON.parse(body); } catch (e) { res.writeHead(400); res.end('JSON invalide'); return; }
      await writeFile(join(ROOT, 'tools', 'vo-corpus.json'), body);
      console.log(`vo-corpus.json écrit (${(body.length / 1024).toFixed(0)} Ko)`);
      res.writeHead(200); res.end('OK');
    });
    return;
  }
  const rel = normalize(path === '/' ? '/index.html' : path).replace(/^([/\\])+/, '');
  if (rel.startsWith('..')) { res.writeHead(403); res.end(); return; }
  try {
    const buf = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'Content-Type': TYPES[extname(rel)] || 'application/octet-stream' });
    res.end(buf);
  } catch (e) { res.writeHead(404); res.end('introuvable'); }
}).listen(8766, '127.0.0.1', () => console.log('http://localhost:8766/tools/vo-corpus.html'));
