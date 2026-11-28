export const TYPES = {
  appointment: ['Compromisso', 'calendar', '#b8664e'],
  task: ['Tarefa', 'check', '#758263'],
  study: ['Estudo', 'book', '#bd963f'],
  payment: ['Pagamento', 'wallet', '#c77b62'],
  income: ['Recebimento', 'wallet', '#4d8a79'],
  shopping: ['Compras', 'bag', '#b28c65'],
  health: ['Saúde', 'heart', '#ac7885'],
  wellness: ['Bem-estar', 'sun', '#899a65'],
};
export const uid = () => crypto.randomUUID();
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dateObj = (s) => new Date(s + 'T12:00:00');
export const addDays = (s, n) => {
  const d = dateObj(s);
  d.setDate(d.getDate() + n);
  return localDate(d);
};
export const money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((v || 0) / 100);
export function initialData() {
  return {
    activities: [],
    goals: [],
    logs: [],
    notes: [],
    profile: { avatar: '' },
    categories: [
      ...['Trabalho', 'Estudos', 'Saúde e bem-estar', 'Guardar dinheiro'].map((name, i) => ({
        id: 'g' + i,
        name,
        kind: 'goal',
        savings: i === 3,
      })),
      ...[
        'Moradia',
        'Alimentação',
        'Saúde',
        'Transporte',
        'Educação',
        'Materiais de limpeza e uso doméstico',
        'Equipamentos',
        'Assinaturas',
        'Lazer',
        'Dinheiro guardado',
      ].map((name, i) => ({ id: 'b' + i, name, kind: 'budget', savings: i === 9 })),
    ],
  };
}
export const isISODate = (value) =>
  typeof value === 'string' &&
  /^[1-9]\d{3}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(dateObj(value).getTime()) &&
  localDate(dateObj(value)) === value;
export const validRepeatUntil = (a) =>
  a.repeatUntil == null ||
  a.repeatUntil === '' ||
  (a.repeat !== 'none' && isISODate(a.repeatUntil) && a.repeatUntil >= a.date);
export function repeatsOn(a, date) {
  if (date < a.date || (a.repeat !== 'none' && a.repeatUntil && date > a.repeatUntil)) return false;
  if (a.repeat === 'daily') return true;
  if (a.repeat === 'weekly')
    return Math.round((dateObj(date) - dateObj(a.date)) / 86400000) % 7 === 0;
  if (a.repeat === 'monthly') {
    const d = dateObj(date),
      base = dateObj(a.date);
    return (
      d.getDate() ===
      Math.min(base.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
    );
  }
  return date === a.date;
}
export function occurrences(a, from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (repeatsOn(a, d) && !a.postponed?.[d])
      out.push({ ...a, origin: d, day: d, done: !!a.completed?.[d] });
  }
  for (const [origin, day] of Object.entries(a.postponed || {})) {
    if (repeatsOn(a, origin) && day >= from && day <= to)
      out.push({ ...a, origin, day, done: !!a.completed?.[origin] });
  }
  return out;
}
export const between = (data, from, to) =>
  data.activities
    .flatMap((a) => occurrences(a, from, to))
    .sort(
      (a, b) => a.day.localeCompare(b.day) || (a.time || '23:59').localeCompare(b.time || '23:59'),
    );
export const forDay = (data, date) => between(data, date, date);
export function monthBounds(month) {
  const [y, m] = month.split('-').map(Number);
  return [month + '-01', localDate(new Date(y, m, 0))];
}
export function openingBalance(data, month) {
  const overrides = data.budgetOpeningBalances || {};
  const anchor = Object.keys(overrides)
    .filter((m) => m <= month && isISODate(m + '-01') && Number.isSafeInteger(overrides[m]))
    .sort()
    .at(-1);
  let value = anchor ? overrides[anchor] : 0;
  const from = anchor ? anchor + '-01' : '',
    to = month + '-01';
  for (const a of data.activities) {
    if (!['payment', 'income'].includes(a.type)) continue;
    for (const [origin, done] of Object.entries(a.completed || {})) {
      const day = a.postponed?.[origin] || origin;
      if (done && repeatsOn(a, origin) && day >= from && day < to)
        value += (a.type === 'income' ? 1 : -1) * (a.amount || 0);
    }
  }
  return value;
}
export function budgetCategories(data, rows) {
  const groups = data.categories
    .filter((c) => c.kind === 'budget')
    .map((c) => ({ ...c, amount: 0 }));
  let uncategorized = 0;
  for (const a of rows.filter((a) => a.type === 'payment')) {
    const category = groups.find((c) => c.id === a.category);
    if (category) category.amount += a.amount || 0;
    else uncategorized += a.amount || 0;
  }
  if (uncategorized)
    groups.push({ id: '', name: 'Sem categoria', kind: 'budget', amount: uncategorized });
  return groups;
}
export function budget(data, month) {
  const rows = between(data, ...monthBounds(month)).filter((a) =>
    ['payment', 'income'].includes(a.type),
  );
  const sum = (type, done) =>
    rows
      .filter((a) => a.type === type && (done === undefined || a.done === done))
      .reduce((n, a) => n + (a.amount || 0), 0);
  const reserve = data.activities
    .filter(
      (a) => a.type === 'payment' && data.categories.find((c) => c.id === a.category)?.savings,
    )
    .reduce(
      (n, a) => n + Object.values(a.completed || {}).filter(Boolean).length * (a.amount || 0),
      0,
    );
  const opening = openingBalance(data, month),
    income = sum('income'),
    expense = sum('payment'),
    paid = sum('payment', true),
    received = sum('income', true);
  return {
    rows,
    income,
    expense,
    paid,
    received,
    reserve,
    opening,
    balance: opening + received - paid,
    projected: opening + income - expense,
    categories: budgetCategories(data, rows),
  };
}
export function goalProgress(data, id) {
  const steps = data.activities
    .filter((a) => a.goalId === id)
    .sort(
      (a, b) =>
        (a.postponed?.[a.date] || a.date).localeCompare(b.postponed?.[b.date] || b.date) ||
        (a.time || '23:59').localeCompare(b.time || '23:59'),
    );
  return {
    steps,
    total: steps.length,
    done: steps.filter((a) => Object.values(a.completed || {}).some(Boolean)).length,
    postponed: steps.filter((a) => Object.keys(a.postponed || {}).length).length,
  };
}
