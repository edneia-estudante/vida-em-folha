import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { api } from '../worker/api.js';
function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON;');
  db.exec(readFileSync(new URL('../drizzle/0000_autumn.sql', import.meta.url), 'utf8'));
  function statement(sql, args = []) {
    return {
      bind(...values) {
        return statement(sql, values);
      },
      async first() {
        return db.prepare(sql).get(...args) || null;
      },
      async run() {
        const result = db.prepare(sql).run(...args);
        return { meta: { changes: result.changes } };
      },
    };
  }
  return {
    db,
    env: {
      DB: {
        prepare: statement,
        async batch(stmts) {
          db.exec('BEGIN');
          try {
            const r = [];
            for (const stmt of stmts) r.push(await stmt.run());
            db.exec('COMMIT');
            return r;
          } catch (e) {
            db.exec('ROLLBACK');
            throw e;
          }
        },
      },
    },
  };
}
async function req(env, path, body, cookie = '', method) {
  return api(
    new Request('https://example.test/api/' + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    env,
  );
}
test('cadastro, autenticação, isolamento, conflito entre dispositivos e logout', async () => {
  const { env, db } = setup();
  try {
    let r = await req(env, 'state');
    assert.equal(r.status, 401);
    r = await req(env, 'register', {
      name: 'Ana',
      email: 'ana@example.test',
      password: 'strong-test-123',
    });
    assert.equal(r.status, 200);
    const cookie = r.headers.get('Set-Cookie');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Strict/);
    const stored = db.prepare('SELECT password,salt FROM users').get();
    assert.notEqual(stored.password, 'strong-test-123');
    assert.equal(stored.password.length, 64);
    let data = await (await req(env, 'state', null, cookie)).json();
    data.data.notes.push({
      id: 'private',
      title: 'Somente Ana',
      text: 'Privado',
      date: '2026-11-24',
    });
    r = await req(env, 'state', { data: data.data, version: 0 }, cookie, 'PUT');
    assert.equal(r.status, 200);
    r = await req(env, 'state', { data: data.data, version: 0 }, cookie, 'PUT');
    assert.equal(r.status, 409);
    r = await req(env, 'login', { email: 'ana@example.test', password: 'incorrect-password' });
    assert.equal(r.status, 401);
    r = await req(env, 'login', { email: 'ana@example.test', password: 'strong-test-123' });
    assert.equal(r.status, 200);
    const secondDevice = r.headers.get('Set-Cookie');
    data = await (await req(env, 'state', null, secondDevice)).json();
    assert.equal(data.data.notes[0].title, 'Somente Ana');
    r = await req(env, 'register', {
      name: 'Bia',
      email: 'bia@example.test',
      password: 'strong-test-456',
    });
    const otherCookie = r.headers.get('Set-Cookie');
    data = await (await req(env, 'state', null, otherCookie)).json();
    assert.equal(data.data.notes.length, 0);
    r = await req(env, 'logout', {}, cookie);
    assert.equal(r.status, 200);
    assert.equal((await req(env, 'state', null, cookie)).status, 401);
    assert.equal((await req(env, 'state', null, secondDevice)).status, 200);
  } finally {
    db.close();
  }
});
test('rejeita origem externa, formato inválido e tentativas excessivas', async () => {
  const { env, db } = setup();
  try {
    const r = await api(
      new Request('https://example.test/api/register', {
        method: 'POST',
        headers: { Origin: 'https://malicious.test' },
        body: '{}',
      }),
      env,
    );
    assert.equal(r.status, 403);
    assert.equal(
      (await req(env, 'register', { name: 'A', email: 'invalid', password: '123' })).status,
      400,
    );
    for (let i = 0; i < 15; i++)
      await req(env, 'login', { email: 'none@example.test', password: 'incorrect-password' });
    assert.equal(
      (await req(env, 'login', { email: 'none@example.test', password: 'incorrect-password' }))
        .status,
      429,
    );
  } finally {
    db.close();
  }
});

test('sincroniza saldo anterior e prazo de repetição e rejeita valores inválidos', async () => {
  const { env, db } = setup();
  try {
    const registered = await req(env, 'register', {
      name: 'Teste orçamento',
      email: 'budget@example.test',
      password: 'strong-test-789',
    });
    const cookie = registered.headers.get('Set-Cookie');
    const { data } = await (await req(env, 'state', null, cookie)).json();
    data.budgetOpeningBalances = { '2026-12': -125050 };
    data.activities.push({
      id: 'college',
      title: 'Faculdade metropolitana',
      date: '2026-12-10',
      repeat: 'monthly',
      repeatUntil: '2027-10-10',
      type: 'payment',
      amount: 50000,
      completed: {},
      postponed: {},
    });
    assert.equal((await req(env, 'state', { data, version: 0 }, cookie, 'PUT')).status, 200);
    const saved = await (await req(env, 'state', null, cookie)).json();
    assert.equal(saved.data.budgetOpeningBalances['2026-12'], -125050);
    assert.equal(saved.data.activities[0].repeatUntil, '2027-10-10');
    for (const repeatUntil of ['2026-12-09', '2027-02-30', '10/10/2027', 123]) {
      const invalid = structuredClone(data);
      invalid.activities[0].repeatUntil = repeatUntil;
      assert.equal(
        (await req(env, 'state', { data: invalid, version: 1 }, cookie, 'PUT')).status,
        400,
      );
    }
    for (const balances of [
      { '2026-13': 100 },
      { '2026-12': 1.5 },
      { '2026-12': 100000000000 },
      [],
      null,
    ]) {
      const invalid = structuredClone(data);
      invalid.budgetOpeningBalances = balances;
      assert.equal(
        (await req(env, 'state', { data: invalid, version: 1 }, cookie, 'PUT')).status,
        400,
      );
    }
    delete data.activities[0].repeatUntil;
    delete data.budgetOpeningBalances;
    assert.equal((await req(env, 'state', { data, version: 1 }, cookie, 'PUT')).status, 200);
  } finally {
    db.close();
  }
});
