export function createApiClient({ apiBase = '', pageOrigin, storage, fetchImpl = fetch }) {
  const base = new URL(apiBase || pageOrigin);
  if (base.origin !== pageOrigin && base.protocol !== 'https:') {
    throw new Error('A conexão com a nuvem exige HTTPS.');
  }
  const remote = base.origin !== pageOrigin;
  const storageKey = `vida-em-folha:session:${base.origin}`;
  let token = '';
  if (remote) {
    try {
      token = storage?.getItem(storageKey) || '';
    } catch {
      /* Sessão em memória. */
    }
  }
  function setToken(value) {
    token = value;
    try {
      if (value) storage?.setItem(storageKey, value);
      else storage?.removeItem(storageKey);
    } catch {
      /* Continua funcionando enquanto a página estiver aberta. */
    }
  }
  return async function request(path, body, method) {
    if (!['register', 'login', 'logout', 'state'].includes(path)) {
      throw new Error('Operação desconhecida.');
    }
    const headers = body ? { 'Content-Type': 'application/json' } : {};
    if (remote && token && !['register', 'login'].includes(path)) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetchImpl(new URL('/api/' + path, base).href, {
      method: method || (body ? 'POST' : 'GET'),
      credentials: remote ? 'omit' : 'same-origin',
      cache: 'no-store',
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Não foi possível acessar a nuvem. Tente novamente em instantes.');
    }
    if (!response.ok) {
      if (remote && response.status === 401) setToken('');
      const error = new Error(data.error || 'Não foi possível conectar.');
      error.status = response.status;
      throw error;
    }
    if (remote && ['register', 'login'].includes(path)) {
      if (!/^[a-f0-9]{64}$/.test(data.accessToken || '')) {
        throw new Error('O servidor ainda não está pronto para o GitHub Pages.');
      }
      setToken(data.accessToken);
      delete data.accessToken;
    }
    if (remote && path === 'logout') setToken('');
    return data;
  };
}
