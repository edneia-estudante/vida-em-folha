import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { api } from './worker/api.js';
mkdirSync('.data', { recursive: true });
const db = new DatabaseSync('.data/vida.sqlite');
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
if (!db.prepare("SELECT name FROM sqlite_master WHERE name='users'").get())
  db.exec(readFileSync('drizzle/0000_autumn.sql', 'utf8'));
function prepared(sql, args = []) {
  return {
    bind(...a) {
      return prepared(sql, a);
    },
    async first() {
      return db.prepare(sql).get(...args) || null;
    },
    async run() {
      const r = db.prepare(sql).run(...args);
      return { meta: { changes: r.changes } };
    },
  };
}
const env = {
  DB: {
    prepare: prepared,
    async batch(stmts) {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of stmts) out.push(await s.run());
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  },
};
const mime = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  png: 'image/png',
  svg: 'image/svg+xml',
  webmanifest: 'application/manifest+json',
};
const port = Number(process.env.PORT || 4173);
http
  .createServer(async (req, res) => {
    try {
      const origin = `http://${req.headers.host}`,
        url = new URL(req.url, origin);
      let result;
      if (url.pathname.startsWith('/api/')) {
        const chunks = [];
        let size = 0;
        for await (const c of req) {
          size += c.length;
          if (size > 1500000) {
            res.writeHead(413);
            res.end();
            return;
          }
          chunks.push(c);
        }
        const body = Buffer.concat(chunks);
        result = await api(
          new Request(url, {
            method: req.method,
            headers: req.headers,
            ...(body.length ? { body } : {}),
          }),
          env,
        );
      } else {
        const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const file = path === 'index.html' ? 'index.html' : 'public/' + path;
        if (!/^[a-zA-Z0-9.\-]+$/.test(path) || !existsSync(file)) {
          res.writeHead(404);
          res.end();
          return;
        }
        result = new Response(readFileSync(file), {
          headers: {
            'Content-Type': mime[path.split('.').pop()] || 'text/plain',
            'Cache-Control': 'no-cache',
          },
        });
      }
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end('Erro interno');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
