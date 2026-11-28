import { readFile, mkdir, writeFile } from 'node:fs/promises';
const files = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/app.js': 'app.js',
  '/domain.js': 'domain.js',
  '/style.css': 'style.css',
  '/scene.svg': 'scene.svg',
  '/cover-autumn.png': 'cover-autumn.png',
  '/icon.svg': 'icon.svg',
  '/manifest.webmanifest': 'manifest.webmanifest',
  '/sw.js': 'sw.js',
};
const types = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  png: 'image/png',
  svg: 'image/svg+xml',
  webmanifest: 'application/manifest+json',
};
const assets = {};
for (const [url, file] of Object.entries(files)) {
  const binary = file.endsWith('.png');
  const source = file === 'index.html' ? 'index.html' : 'public/' + file;
  assets[url] = {
    body: binary ? (await readFile(source)).toString('base64') : await readFile(source, 'utf8'),
    binary,
    type: types[file.split('.').pop()],
  };
}
let domain = (await readFile('public/domain.js', 'utf8')).replaceAll('export ', '');
let api = (await readFile('worker/api.js', 'utf8'))
  .replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];\s*/, '')
  .replace('export async function api', 'async function api');
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await writeFile(
  'dist/server/index.js',
  domain +
    '\n' +
    api +
    '\nconst assets=' +
    JSON.stringify(assets) +
    ';\nexport default {async fetch(request,env){const path=new URL(request.url).pathname;if(path.startsWith("/api/"))return api(request,env);const file=assets[path];if(!file)return new Response("Não encontrado",{status:404});return new Response(file.binary?Uint8Array.from(atob(file.body),c=>c.charCodeAt(0)):file.body,{headers:{"Content-Type":file.type,"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff","Referrer-Policy":"same-origin","Content-Security-Policy":"default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'self\'"}})}};',
);
await writeFile('dist/.openai/hosting.json', await readFile('.openai/hosting.json'));
console.log('Build concluído: Worker, interface e PWA.');
