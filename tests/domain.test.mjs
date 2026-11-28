import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialData,
  occurrences,
  budget,
  goalProgress,
  validRepeatUntil,
} from '../public/domain.js';
const activity = (extra) => ({
  id: 'a',
  title: 'Teste',
  date: '2026-01-31',
  repeat: 'none',
  type: 'task',
  completed: {},
  postponed: {},
  ...extra,
});
test('repetição mensal preserva fim de mês e funciona em fevereiro', () => {
  const a = activity({ repeat: 'monthly' });
  assert.deepEqual(
    occurrences(a, '2026-01-01', '2026-03-31').map((o) => o.day),
    ['2026-01-31', '2026-02-28', '2026-03-31'],
  );
});
test('repetição semanal respeita início e dia da semana', () => {
  const a = activity({ repeat: 'weekly' });
  assert.deepEqual(
    occurrences(a, '2026-01-01', '2026-02-15').map((o) => o.day),
    ['2026-01-31', '2026-02-07', '2026-02-14'],
  );
});
test('adiar altera apenas a ocorrência e mantém sua identidade ao concluir', () => {
  const a = activity({
    repeat: 'daily',
    postponed: { '2026-01-31': '2026-02-02' },
    completed: { '2026-01-31': true },
  });
  const o = occurrences(a, '2026-01-31', '2026-02-02');
  assert.equal(o.length, 3);
  assert.equal(o.filter((r) => r.day === '2026-01-31').length, 0);
  assert.equal(o.find((r) => r.origin === '2026-01-31').done, true);
  assert.equal(o.filter((r) => r.day === '2026-02-02').length, 2);
});
test('reserva considera somente pagamentos guardados confirmados', () => {
  const d = initialData();
  d.activities = [
    activity({
      type: 'payment',
      category: 'b9',
      amount: 10000,
      repeat: 'monthly',
      completed: { '2026-01-31': true, '2026-02-28': false },
    }),
    activity({
      id: 'b',
      type: 'payment',
      category: 'b0',
      amount: 5000,
      completed: { '2026-01-31': true },
    }),
    activity({ id: 'c', type: 'income', amount: 50000 }),
  ];
  const b = budget(d, '2026-01');
  assert.equal(b.reserve, 10000);
  assert.equal(b.expense, 15000);
  assert.equal(b.income, 50000);
  assert.equal(b.paid, 15000);
  d.activities[0].completed['2026-01-31'] = false;
  assert.equal(budget(d, '2026-01').reserve, 0);
});
test('desempenho de meta distingue conclusão e adiamento', () => {
  const d = initialData();
  d.activities = [
    activity({ goalId: 'g', completed: { '2026-01-31': true } }),
    activity({ id: 'b', goalId: 'g', postponed: { '2026-01-31': '2026-02-01' } }),
  ];
  const p = goalProgress(d, 'g');
  assert.equal(p.total, 2);
  assert.equal(p.done, 1);
  assert.equal(p.postponed, 1);
});

test('mensalidade termina na data inclusiva escolhida, também no orçamento', () => {
  const a = activity({
    title: 'Faculdade metropolitana',
    type: 'payment',
    amount: 50000,
    date: '2026-12-10',
    repeat: 'monthly',
    repeatUntil: '2027-10-10',
  });
  const dates = occurrences(a, '2026-12-01', '2027-12-31').map((o) => o.day);
  assert.equal(dates.length, 11);
  assert.equal(dates[0], '2026-12-10');
  assert.equal(dates.at(-1), '2027-10-10');
  const d = initialData();
  d.activities = [a];
  assert.equal(budget(d, '2027-10').expense, 50000);
  assert.equal(budget(d, '2027-11').expense, 0);
});

test('prazo limita repetições diárias, semanais e no fim do mês', () => {
  for (const [repeat, repeatUntil, expected] of [
    ['daily', '2026-02-02', ['2026-01-31', '2026-02-01', '2026-02-02']],
    ['weekly', '2026-02-07', ['2026-01-31', '2026-02-07']],
    ['monthly', '2026-02-28', ['2026-01-31', '2026-02-28']],
    ['daily', '2026-01-31', ['2026-01-31']],
  ])
    assert.deepEqual(
      occurrences(activity({ repeat, repeatUntil }), '2026-01-01', '2026-03-31').map((o) => o.day),
      expected,
    );
  assert.equal(validRepeatUntil(activity({ repeat: 'monthly', repeatUntil: '2026-01-30' })), false);
  assert.equal(validRepeatUntil(activity({ repeat: 'monthly', repeatUntil: '2026-02-30' })), false);
  assert.equal(validRepeatUntil(activity({ repeatUntil: '2026-02-01' })), false);
  assert.equal(validRepeatUntil(activity({ repeat: 'daily' })), true);
});

test('adiamento após o prazo mantém só ocorrências originalmente válidas', () => {
  const a = activity({
    repeat: 'monthly',
    repeatUntil: '2026-02-28',
    postponed: { '2026-02-28': '2026-03-05', '2026-03-31': '2026-03-06' },
  });
  assert.deepEqual(
    occurrences(a, '2026-03-01', '2026-03-31').map((o) => [o.origin, o.day]),
    [['2026-02-28', '2026-03-05']],
  );
});

test('saldo anterior acumula apenas valores confirmados e atravessa meses vazios', () => {
  const d = initialData();
  d.activities = [
    activity({ id: 'income', type: 'income', amount: 200000, completed: { '2026-01-31': true } }),
    activity({ type: 'payment', amount: 70000, completed: { '2026-01-31': true } }),
    activity({ id: 'unpaid', type: 'payment', amount: 900000 }),
    activity({
      id: 'current',
      type: 'payment',
      date: '2026-02-10',
      amount: 20000,
      completed: { '2026-02-10': true },
    }),
  ];
  const b = budget(d, '2026-02');
  assert.equal(b.opening, 130000);
  assert.equal(b.balance, 110000);
  assert.equal(b.projected, 110000);
  assert.equal(budget(d, '2026-04').opening, 110000);
  d.budgetOpeningBalances = { '2026-02': -10000 };
  assert.equal(budget(d, '2026-02').opening, -10000);
  assert.equal(budget(d, '2026-03').opening, -30000);
  d.budgetOpeningBalances['2026-03'] = 5000;
  assert.equal(budget(d, '2026-04').opening, 5000);
  delete d.budgetOpeningBalances['2026-03'];
  assert.equal(budget(d, '2026-04').opening, -30000);
});

test('saldo contabiliza pagamento adiado uma única vez no mês de destino', () => {
  const d = initialData();
  d.activities = [
    activity({
      type: 'payment',
      amount: 10000,
      repeat: 'monthly',
      repeatUntil: '2026-02-28',
      completed: { '2026-01-31': true, '2026-02-28': true },
      postponed: { '2026-01-31': '2026-02-02' },
    }),
  ];
  assert.equal(budget(d, '2026-02').opening, 0);
  assert.equal(budget(d, '2026-02').paid, 20000);
  assert.equal(budget(d, '2026-03').opening, -20000);
});

test('distribuição inclui categorias criadas, vazias, renomeadas e pagamentos sem categoria', () => {
  const d = initialData();
  d.categories.push({ id: 'custom', name: 'Faculdade', kind: 'budget' });
  assert.equal(budget(d, '2026-01').categories.find((c) => c.id === 'custom').amount, 0);
  d.activities = [
    activity({ type: 'payment', category: 'custom', amount: 50000 }),
    activity({ id: 'other', type: 'payment', category: 'removed', amount: 10000 }),
  ];
  assert.equal(budget(d, '2026-01').categories.find((c) => c.id === 'custom').amount, 50000);
  d.categories.find((c) => c.id === 'custom').name = 'Mensalidades';
  assert.equal(budget(d, '2026-01').categories.find((c) => c.id === 'custom').name, 'Mensalidades');
  assert.equal(budget(d, '2026-01').categories.find((c) => c.id === '').amount, 10000);
  d.categories = d.categories.filter((c) => c.id !== 'custom');
  assert.equal(
    budget(d, '2026-01').categories.some((c) => c.id === 'custom'),
    false,
  );
  assert.equal(budget(d, '2026-01').categories.find((c) => c.id === '').amount, 60000);
});
