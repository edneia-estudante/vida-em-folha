import { initialData, isISODate, validRepeatUntil } from '../public/domain.js';
const enc = new TextEncoder();
const hex = (b) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const hash = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return hex(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
      key,
      256,
    ),
  );
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
const cookie = (token, secure, clear = false) =>
  `vf_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 2592000}${secure ? '; Secure' : ''}`;
export async function api(request, env) {
  const url = new URL(request.url),
    path = url.pathname,
    db = env.DB;
  try {
    if (!db)
      return json(
        { error: 'O armazenamento está indisponível. Tente novamente em instantes.' },
        503,
      );
    if (!['GET', 'HEAD'].includes(request.method)) {
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) return json({ error: 'Origem não autorizada.' }, 403);
    }
    let body = {};
    if (['POST', 'PUT'].includes(request.method)) {
      const text = await request.text();
      if (text.length > 1500000) return json({ error: 'Limite de armazenamento atingido.' }, 413);
      try {
        body = JSON.parse(text);
      } catch {
        return json({ error: 'Dados inválidos.' }, 400);
      }
    }
    const secure = url.protocol === 'https:';
    if (path === '/api/register' || path === '/api/login') {
      if (request.method !== 'POST') return json({ error: 'Método inválido.' }, 405);
      const email = String(body.email || '')
          .trim()
          .toLowerCase(),
        password = String(body.password || '');
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 ||
        password.length < 8 ||
        password.length > 128
      )
        return json(
          { error: 'Informe um e-mail válido e uma senha entre 8 e 128 caracteres.' },
          400,
        );
      const now = Date.now(),
        key = await hash(email + ':' + (request.headers.get('CF-Connecting-IP') || 'local'));
      await db
        .prepare(
          'INSERT INTO auth_attempts (key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<? THEN 1 ELSE attempts+1 END, reset_at=CASE WHEN reset_at<? THEN ? ELSE reset_at END',
        )
        .bind(key, now + 900000, now, now, now + 900000)
        .run();
      const attempt = await db
        .prepare('SELECT attempts FROM auth_attempts WHERE key=?')
        .bind(key)
        .first();
      if (attempt.attempts > 15)
        return json({ error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }, 429);
      let user = await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
      if (path === '/api/register') {
        const name = String(body.name || '').trim();
        if (!name || name.length > 60)
          return json({ error: 'Informe seu nome, com até 60 caracteres.' }, 400);
        if (user)
          return json(
            { error: 'Não foi possível cadastrar este e-mail. Se já possui conta, entre.' },
            409,
          );
        const salt = random();
        user = {
          id: crypto.randomUUID(),
          email,
          name,
          salt,
          password: await passwordHash(password, salt),
        };
        await db.batch([
          db
            .prepare(
              'INSERT INTO users (id,email,name,salt,password,created_at) VALUES (?,?,?,?,?,?)',
            )
            .bind(user.id, email, name, salt, user.password, now),
          db
            .prepare('INSERT INTO user_data (user_id,data,version) VALUES (?,?,0)')
            .bind(user.id, JSON.stringify(initialData())),
        ]);
      } else {
        const calculated = await passwordHash(password, user?.salt || 'unregistered');
        if (!user || !equal(calculated, user.password))
          return json({ error: 'E-mail ou senha incorretos.' }, 401);
      }
      await db.prepare('DELETE FROM auth_attempts WHERE key=?').bind(key).run();
      const token = random();
      await db
        .prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)')
        .bind(await hash(token), user.id, now + 2592000000)
        .run();
      await db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now).run();
      return json({ user: { name: user.name, email: user.email } }, 200, {
        'Set-Cookie': cookie(token, secure),
      });
    }
    const token =
      request.headers.get('Cookie')?.match(/(?:^|;\s*)vf_session=([a-f0-9]+)/)?.[1] || '';
    const tokenHash = await hash(token);
    const user = await db
      .prepare(
        'SELECT users.id,users.name,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires_at>?',
      )
      .bind(tokenHash, Date.now())
      .first();
    if (!user) return json({ error: 'Entre na sua conta para continuar.' }, 401);
    if (path === '/api/logout' && request.method === 'POST') {
      await db.prepare('DELETE FROM sessions WHERE token=?').bind(tokenHash).run();
      return json({ ok: true }, 200, { 'Set-Cookie': cookie('', secure, true) });
    }
    if (path === '/api/state' && request.method === 'GET') {
      const row = await db
        .prepare('SELECT data,version FROM user_data WHERE user_id=?')
        .bind(user.id)
        .first();
      return json({
        user: { name: user.name, email: user.email },
        data: JSON.parse(row.data),
        version: row.version,
      });
    }
    if (path === '/api/state' && request.method === 'PUT') {
      const d = body.data;
      if (
        !d ||
        !['activities', 'goals', 'logs', 'notes', 'categories'].every(
          (k) => Array.isArray(d[k]) && d[k].length <= 3000,
        ) ||
        !Number.isInteger(body.version)
      )
        return json({ error: 'Formato de dados inválido.' }, 400);
      if (
        !d.activities.every(
          (a) =>
            typeof a.id === 'string' &&
            typeof a.title === 'string' &&
            a.title.length <= 200 &&
            isISODate(a.date) &&
            ['none', 'daily', 'weekly', 'monthly'].includes(a.repeat) &&
            validRepeatUntil(a) &&
            Number.isSafeInteger(a.amount || 0) &&
            (a.amount || 0) >= 0,
        )
      )
        return json({ error: 'Atividade inválida. Confira as datas e o prazo de repetição.' }, 400);
      if (
        d.budgetOpeningBalances !== undefined &&
        (d.budgetOpeningBalances === null ||
          Array.isArray(d.budgetOpeningBalances) ||
          typeof d.budgetOpeningBalances !== 'object' ||
          Object.keys(d.budgetOpeningBalances).length > 1200 ||
          !Object.entries(d.budgetOpeningBalances).every(
            ([month, value]) =>
              isISODate(month + '-01') &&
              Number.isSafeInteger(value) &&
              Math.abs(value) <= 99999999900,
          ))
      )
        return json({ error: 'Saldo anterior inválido.' }, 400);
      const result = await db
        .prepare('UPDATE user_data SET data=?,version=version+1 WHERE user_id=? AND version=?')
        .bind(JSON.stringify(d), user.id, body.version)
        .run();
      if (!result.meta.changes)
        return json(
          {
            error:
              'Sua conta foi atualizada em outro dispositivo. Atualizamos a tela; tente novamente.',
          },
          409,
        );
      return json({ version: body.version + 1 });
    }
    return json({ error: 'Rota não encontrada.' }, 404);
  } catch (error) {
    console.error('API failure', error.message);
    return json({ error: 'Não foi possível concluir. Tente novamente.' }, 500);
  }
}
