import {
  TYPES,
  uid,
  localDate,
  dateObj,
  addDays,
  money,
  initialData,
  repeatsOn,
  occurrences,
  between,
  forDay,
  monthBounds,
  budget,
  goalProgress,
  validRepeatUntil,
} from './domain.js';

const paths = {
  leaf: 'M20 4c-9 0-16 3-16 11a5 5 0 0 0 5 5c8 0 11-7 11-16ZM4 21 16 9m-7 7V11m4 1h5',
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  calendar:
    'M8 3v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM7 14h2m3 0h2m3 0h1M7 17h2m3 0h2',
  target: 'M21 12a9 9 0 1 1-9-9m5 9a5 5 0 1 1-5-5m0 5 9-9m-5 0h5v5',
  wallet: 'M3 6h17v14H3V6Zm0 0V4h14v2m-1 6h5v4h-5v-4Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  chevron: 'm9 5 7 7-7 7',
  left: 'm15 5-7 7 7 7',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  logout: 'M9 4H4v16h5m5-12 4 4-4 4m-6-4h13',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6',
  book: 'M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1m0-16c3-2 7-2 10-1v16c-3-1-7-1-10 1V5Z',
  bag: 'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  smile: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8 14c1 4 7 4 8 0M8 9h.01M16 9h.01',
  close: 'm6 6 12 12M6 18 18 6',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 4v3',
  download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10',
  cloud: 'M7 18a5 5 0 1 1 1-10 6 6 0 0 1 11 2 4 4 0 0 1-1 8H7Z',
  refresh: 'M20 7V3m0 4h-4M4 17v4m0-4h4M5 8a8 8 0 0 1 15-1M4 17a8 8 0 0 0 15-1',
};
const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.leaf}"/></svg>`;
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const $ = (s) => document.querySelector(s),
  app = $('#app'),
  modal = $('#modal');
const brand = () => `<img src="/icon.svg" alt=""> <span>vida em folha</span>`;
const navs = [
  ['home', 'Início', 'home'],
  ['today', 'Hoje', 'sun'],
  ['calendar', 'Agenda', 'calendar'],
  ['goals', 'Metas', 'target'],
  ['budget', 'Orçamento', 'wallet'],
  ['health', 'Saúde', 'heart'],
];
const moods = ['Triste', 'Ansioso(a)', 'Tranquilo(a)', 'Alegre', 'Muito alegre'],
  faces = ['😔', '😟', '😌', '🙂', '😄'];
const sleeps = ['Péssimo', 'Ruim', 'Regular', 'Reparador', 'Excelente'];
let state = null,
  user = null,
  version = 0,
  demo = false,
  route = 'home',
  selectedDate = localDate(),
  calendarMonth = localDate().slice(0, 7),
  budgetMonth = calendarMonth,
  wellnessMonth = calendarMonth,
  search = '',
  budgetFilter = 'all',
  busy = false,
  installPrompt = null,
  authMode = 'register',
  stepCounter = 0;
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
async function request(path, body, method) {
  const response = await fetch('/api/' + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: body ? { 'Content-Type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    const e = new Error(data.error || 'Não foi possível conectar.');
    e.status = response.status;
    throw e;
  }
  return data;
}
async function sync() {
  if (demo || !user || busy || modal.open) return;
  try {
    const r = await request('state');
    if (r.version !== version) {
      state = r.data;
      version = r.version;
      render();
    }
  } catch (e) {
    if (e.status === 401) {
      user = null;
      state = null;
      renderAuth();
    } else $('.sync')?.classList.add('offline');
  }
}
async function commit(fn, message = 'Salvo com carinho.') {
  if (busy) return false;
  busy = true;
  const next = structuredClone(state);
  fn(next);
  try {
    if (!demo) {
      const r = await request('state', { data: next, version }, 'PUT');
      version = r.version;
    }
    state = next;
    render();
    if (message) toast(demo ? message + ' (demonstração)' : message);
    return true;
  } catch (e) {
    if (e.status === 409) {
      const r = await request('state');
      state = r.data;
      version = r.version;
      render();
    }
    toast(e.message || 'Sem conexão. Seus dados não foram alterados.');
    return false;
  } finally {
    busy = false;
  }
}
function dateLabel(d, year = false) {
  return dateObj(d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(year ? { year: 'numeric' } : {}),
  });
}
function shortDate(d) {
  return dateObj(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
function monthLabel(m) {
  return dateObj(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
const btn = (label, action, ic = 'plus', cls = '') =>
  `<button class="btn ${cls}" data-action="${action}">${ic ? icon(ic) : ''}${label}</button>`;
const option = (value, label, current) =>
  `<option value="${esc(value)}" ${String(value) === String(current) ? 'selected' : ''}>${esc(label)}</option>`;
const options = (list, current) => list.map((s, i) => option(i + 1, s, current)).join('');
function empty(title, text, action, label, ic = 'leaf') {
  return `<div class="empty">${icon(ic)}<h3>${title}</h3><p>${text}</p>${action ? btn(label, action) : ''}</div>`;
}
function pendingRows() {
  const today = localDate();
  const earliest = state.activities.reduce((m, a) => (a.date < m ? a.date : m), today);
  const from = earliest < addDays(today, -365) ? addDays(today, -365) : earliest;
  return between(state, from, addDays(today, -1)).filter((a) => !a.done);
}
function activityRow(a, showDate = false) {
  const type = TYPES[a.type] || TYPES.task;
  return `<div class="activity ${a.done ? 'done' : ''}"><button class="check ${a.done ? 'done' : ''}" data-action="toggle" data-id="${a.id}" data-origin="${a.origin}" aria-label="${a.done ? 'Desmarcar' : 'Concluir'} ${esc(a.title)}">${a.done ? icon('check') : ''}</button><div class="activity-text"><div class="activity-title">${esc(a.title)}</div><div class="activity-meta"><span class="dot" style="background:${type[2]}"></span>${type[0]}${a.time ? ' · ' + esc(a.time) : ''}${showDate ? ' · ' + shortDate(a.day) : ''}${a.repeat !== 'none' ? ' · ' + { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal' }[a.repeat] : ''}${a.repeat !== 'none' && a.repeatUntil ? ' · Até ' + dateObj(a.repeatUntil).toLocaleDateString('pt-BR') : ''}${a.postponed?.[a.origin] ? ' · Adiado' : ''}</div></div>${a.amount ? `<span class="amount">${money(a.amount)}</span>` : ''}<div class="activity-actions"><button class="icon-btn" title="Adiar" aria-label="Adiar ${esc(a.title)}" data-action="postpone" data-id="${a.id}" data-origin="${a.origin}" data-day="${a.day}">${icon('clock')}</button><button class="icon-btn" title="Editar" aria-label="Editar ${esc(a.title)}" data-action="edit-activity" data-id="${a.id}">${icon('edit')}</button><button class="icon-btn" title="Excluir" aria-label="Excluir ${esc(a.title)}" data-action="delete-activity" data-id="${a.id}">${icon('trash')}</button></div></div>`;
}
function render() {
  if (!user) return renderAuth();
  route = location.hash.slice(1) || route;
  if (route === 'wellness') {
    route = 'health';
    history.replaceState(null, '', '#health');
  }
  if (!navs.some((n) => n[0] === route)) route = 'home';
  const active = navs.find((n) => n[0] === route);
  const notifications = notificationEnabled();
  app.innerHTML = `<aside class="sidebar"><div class="brand">${brand()}</div><div class="nav-label">SEU ESPAÇO</div><nav class="nav" aria-label="Navegação principal">${navs.map(([id, label, ic]) => `<button data-nav="${id}" class="${route === id ? 'active' : ''}" ${route === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></button>`).join('')}</nav><div class="sidebar-bottom"><div class="branch">${icon('leaf')}</div><p>Pequenos passos.<br>Uma vida mais leve.</p><p class="small">Cresça no seu tempo.</p><button class="btn ghost" data-action="install">${icon('download')}Instalar aplicativo</button></div></aside><div class="workspace">${demo ? '<div class="demo-banner">Você está explorando uma demonstração. Os dados são exemplos e não serão salvos.<button data-action="exit-demo">Criar minha conta</button></div>' : ''}<header class="topbar"><div class="breadcrumb">Seu espaço <span>/</span> ${active[1]}</div><div class="brand mobile-brand">${brand()}</div><div class="account"><span class="sync">${demo ? 'Modo demonstração' : icon('cloud') + ' Sincronizado'}</span><button class="icon-btn notification" data-action="notifications" aria-label="Notificações ${notifications ? 'ativadas' : 'desativadas'}">${icon('bell')}<span class="badge ${notifications ? '' : 'off'}">${notifications ? '' : '×'}</span></button><button class="row" data-action="profile" aria-label="Editar foto do perfil">${state.profile?.avatar ? `<img class="avatar" src="${esc(state.profile.avatar)}" alt="Foto de perfil">` : `<span class="avatar">${esc(user.name[0].toUpperCase())}</span>`}<span class="account-name">${esc(user.name.split(' ')[0])}</span></button><button class="icon-btn" data-action="logout" aria-label="Sair">${icon('logout')}</button></div></header><main class="main">${{ home: homePage, today: todayPage, calendar: calendarPage, goals: goalsPage, budget: budgetPage, health: carePage }[route]()}</main></div>`;
}
function homePage() {
  const today = localDate(),
    log = state.logs.find((l) => l.date === today),
    pending = pendingRows().length;
  return `<section class="hero" aria-label="Uma pausa para cuidar da sua vida"><img src="/cover-autumn.png" alt="Café fumegante, livros e uma planta junto à janela, com folhas em tons de laranja e vermelho"><div class="hero-text"><div class="eyebrow">ORGANIZE. CUIDE. FLORESÇA.</div><h1>Sua vida, com<br> mais leveza.</h1><p>Um espaço para cultivar o que<br>realmente importa.</p></div></section><section class="greeting"><div><div class="date-label">${dateLabel(today)}</div><h2>Olá, ${esc(user.name.split(' ')[0])}!</h2></div><button class="add-btn" data-action="add-activity" aria-label="Inserir atividade">${icon('plus')}</button></section><section class="stats"><button class="stat-card" data-action="pending"><span class="tile-icon">${icon('clock')}</span><div><div class="value">${pending} ${pending === 1 ? 'pendência' : 'pendências'}</div><p>${pending ? 'Um passo de cada vez.' : 'Tudo em dia por aqui.'}</p></div><span class="chev">${icon('chevron')}</span></button><button class="stat-card" data-action="daily-log"><span class="tile-icon green">${icon('smile')}</span><div><div class="value">${log ? moods[log.mood - 1] : 'Como você está?'}</div><p>${log ? 'Seu registro de hoje.' : 'Reserve um momento para você.'}</p></div><span class="chev">${icon('chevron')}</span></button></section><div class="section-title"><h2>Organize seu dia</h2><p>Tudo o que importa, no seu ritmo.</p></div><section class="modules">${[
    ['today', 'Hoje', 'Compromissos e rotinas', 'sun', '#fbe6cc', '#bd742d'],
    ['calendar', 'Agenda', 'Seu mês, com clareza', 'calendar', '#f2e9d5', '#8b8045'],
    ['goals', 'Metas', 'Um passo de cada vez', 'target', '#f4ded4', '#ad4e36'],
    ['budget', 'Orçamento', 'Equilíbrio para suas finanças', 'wallet', '#fae8d6', '#bd783d'],
    [
      'health',
      'Saúde e bem-estar',
      'Cuidados, sentimentos e qualidade de vida',
      'heart',
      '#f6dfd9',
      '#ab4d3e',
    ],
  ]
    .map(
      ([id, title, desc, ic, bg, color]) =>
        `<button class="module" data-nav="${id}"><span class="tile-icon" style="background:${bg};color:${color}">${icon(ic)}</span><span class="module-corner">${icon('chevron')}</span><h3>${title}</h3><p>${desc}</p></button>`,
    )
    .join(
      '',
    )}</section><div class="footer-note">${icon('leaf')} Não precisa fazer tudo hoje. Só o que faz sentido para você.</div>`;
}
function pageHead(title, subtitle, action, label) {
  return `<div class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div>${action ? btn(label, action) : ''}</div>`;
}
function todayPage() {
  const rows = forDay(state, selectedDate);
  return `${pageHead(`${esc(user.name.split(' ')[0])}, vamos dar o próximo passo?`, 'Seu dia merece espaço para o que importa.', 'add-activity', 'Atividade')}<div class="row between wrap" style="margin-bottom:20px"><label class="row"><span class="muted small">Seu dia</span><input type="date" id="today-date" value="${selectedDate}" style="width:170px"></label><span class="activity-count">${rows.filter((a) => a.done).length} de ${rows.length} concluídas</span></div><section class="panel"><div class="section-title"><h2>${dateLabel(selectedDate)}</h2></div>${rows.length ? rows.map((a) => activityRow(a)).join('') : empty('Espaço para um novo começo', 'Adicione uma atividade, um compromisso ou um pequeno cuidado com você.', 'add-activity', 'Planejar meu dia', 'sun')}</section>`;
}
function calendarPage() {
  const first = dateObj(calendarMonth + '-01'),
    start = addDays(calendarMonth + '-01', -first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i),
      rows = forDay(state, d);
    return `<button class="calendar-day ${d.slice(0, 7) !== calendarMonth ? 'outside' : ''} ${d === selectedDate ? 'selected' : ''} ${d === localDate() ? 'today' : ''}" data-date="${d}" aria-label="${dateLabel(d)}: ${rows.length} atividades" aria-pressed="${d === selectedDate}"><span class="day-number">${dateObj(d).getDate()}</span><span class="calendar-dots">${[...new Set(rows.map((a) => a.type))].map((t) => `<i class="dot" style="background:${TYPES[t]?.[2] || '#888'}"></i>`).join('')}</span></button>`;
  }).join('');
  const matches = state.activities.filter((a) =>
    a.title.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
  );
  const rows = forDay(state, selectedDate);
  return `${pageHead('Agenda', 'Abra espaço para seus planos.', 'add-activity', 'Atividade')}<div class="search-wrap">${icon('search')}<input id="calendar-search" placeholder="Buscar uma atividade, mesmo sem lembrar a data…" aria-label="Buscar atividade" value="${esc(search)}"></div><div id="search-results">${search ? `<section class="panel"><h3>Resultados da busca</h3>${matches.length ? matches.map((a) => activityRow({ ...a, origin: a.date, day: a.postponed?.[a.date] || a.date, done: !!a.completed?.[a.date] }, true)).join('') : '<p class="empty">Nenhuma atividade encontrada.</p>'}</section>` : ''}</div><section class="panel"><div class="calendar-top"><h2 class="month-label">${monthLabel(calendarMonth)}</h2><div class="row"><button class="chip" data-action="calendar-today">Hoje</button><button class="icon-btn" data-month="-1" aria-label="Mês anterior">${icon('left')}</button><button class="icon-btn" data-month="1" aria-label="Próximo mês">${icon('chevron')}</button></div></div><div class="calendar-grid">${['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d) => `<div class="weekday">${d}</div>`).join('')}${cells}</div><div class="legend">${Object.values(
    TYPES,
  )
    .map((t) => `<span><i class="dot" style="background:${t[2]}"></i>${t[0]}</span>`)
    .join(
      '',
    )}</div></section><section class="panel calendar-detail"><div class="section-title"><h2>${dateLabel(selectedDate)}</h2><span class="small muted">${rows.length} atividades</span></div>${rows.length ? rows.map((a) => activityRow(a)).join('') : empty('Um dia com espaço livre', 'O que você gostaria de cultivar nesta data?', 'add-activity', 'Adicionar atividade', 'calendar')}</section>`;
}
function goalsPage() {
  return `${pageHead('Metas que florescem', 'Grandes conquistas começam com pequenos passos.', 'add-goal', 'Nova meta')}<div class="row between" style="margin-bottom:22px"><span class="small muted">${state.goals.length} metas no seu caminho</span><button class="btn ghost" data-action="goal-categories">${icon('settings')}Categorias</button></div>${
    state.goals.length
      ? `<div class="goals-grid">${state.goals
          .map((g) => {
            const p = goalProgress(state, g.id),
              cat = state.categories.find((c) => c.id === g.category);
            return `<article class="panel goal-card"><div class="row between"><span class="pill">${esc(cat?.name || 'Sem categoria')}</span><div class="row"><button class="icon-btn" data-action="edit-goal" data-id="${g.id}" aria-label="Editar meta">${icon('edit')}</button><button class="icon-btn" data-action="delete-goal" data-id="${g.id}" aria-label="Excluir meta">${icon('trash')}</button></div></div><h3>${esc(g.title)}</h3><p class="small muted">${g.description ? esc(g.description) : 'Um passo de cada vez, no seu ritmo.'}</p><div class="bar"><span style="width:${p.total ? (p.done / p.total) * 100 : 0}%"></span></div><div class="goal-meta"><span>${p.done} de ${p.total} etapas concluídas</span><span>${p.total ? Math.round((p.done / p.total) * 100) : 0}%</span></div><p class="hint" style="margin-top:10px">${p.postponed} ${p.postponed === 1 ? 'etapa adiada' : 'etapas adiadas'} · ${g.horizon === 'long' ? 'Longo prazo' : 'Médio prazo'}</p><details><summary>Ver e cuidar das etapas</summary>${p.steps.map((a) => activityRow({ ...a, origin: a.date, day: a.postponed?.[a.date] || a.date, done: !!a.completed?.[a.date] }, true)).join('')}<button class="btn ghost" data-action="add-step" data-id="${g.id}">${icon('plus')}Adicionar etapa</button></details></article>`;
          })
          .join('')}</div>`
      : `<section class="panel">${empty('O que você quer ver crescer?', 'Transforme uma ideia em uma meta e divida o caminho em etapas que entram na sua agenda.', 'add-goal', 'Criar minha primeira meta', 'target')}</section>`
  }`;
}
function budgetPage() {
  const b = budget(state, budgetMonth),
    rows = b.rows.filter((a) => budgetFilter === 'all' || a.type === budgetFilter);
  const manual = Object.hasOwn(state.budgetOpeningBalances || {}, budgetMonth);
  return `${pageHead('Orçamento', 'Cuide do presente. Prepare seus próximos sonhos.', 'add-payment', 'Lançamento')}
 <div class="row between wrap" style="margin-bottom:22px"><input class="month-input" type="month" id="budget-month" value="${budgetMonth}" aria-label="Mês do orçamento"><button class="btn ghost" data-action="budget-categories">${icon('settings')}Categorias</button></div>
 <div class="summary-grid budget-summary">
 <div class="summary-card opening-card"><div class="row between"><div class="label">${icon('wallet')}Saldo do mês anterior</div><button class="icon-btn" data-action="opening-balance" aria-label="Editar saldo do mês anterior">${icon('edit')}</button></div><div class="number">${money(b.opening)}</div><div class="hint">${manual ? 'Valor informado para este mês.' : 'Calculado a partir dos valores confirmados e do último saldo informado.'}</div></div>
 <div class="summary-card"><div class="label">${icon('wallet')}Recebimentos previstos</div><div class="number">${money(b.income)}</div><div class="hint">${money(b.received)} recebidos</div></div>
 <div class="summary-card"><div class="label">${icon('calendar')}Gastos previstos</div><div class="number">${money(b.expense)}</div><div class="hint">${money(b.paid)} pagos</div></div>
 <div class="summary-card reserve"><div class="label">${icon('leaf')}Reserva financeira</div><div class="number">${money(b.reserve)}</div><div class="hint">Somente valores guardados e confirmados.</div></div></div>
 <section class="budget-balance" aria-label="Saldos do mês"><div><span>Saldo atual do mês</span><strong>${money(b.balance)}</strong><p>Saldo anterior + recebidos − pagos</p></div><div><span>Saldo previsto no fim do mês</span><strong>${money(b.projected)}</strong><p>Saldo anterior + recebimentos previstos − gastos previstos</p></div></section>
 <div class="budget-layout"><section class="panel"><div class="section-title"><h2>Movimentações do mês</h2></div><div class="chips">${[
   ['all', 'Tudo'],
   ['payment', 'Pagamentos'],
   ['income', 'Recebimentos'],
 ]
   .map(
     ([id, label]) =>
       `<button class="chip ${budgetFilter === id ? 'active' : ''}" data-budget-filter="${id}">${label}</button>`,
   )
   .join(
     '',
   )}</div>${rows.length ? rows.map((a) => activityRow(a, true)).join('') : empty('Cada valor tem seu lugar', 'Registre pagamentos e recebimentos para acompanhar seu mês.', 'add-payment', 'Adicionar lançamento', 'wallet')}</section>
 <section class="panel" style="margin-top:0"><h2>Para onde vai</h2><p class="hint" style="margin-top:6px">Gastos previstos por categoria, incluindo as suas.</p>${b.categories.map((c) => `<div class="category-line"><div class="row between"><span>${esc(c.name)}</span><span>${money(c.amount)}</span></div><div class="bar"><span style="width:${b.expense ? (c.amount / b.expense) * 100 : 0}%"></span></div></div>`).join('') || '<p class="empty small">Crie suas categorias para organizar os pagamentos.</p>'}</section></div>`;
}
function healthPage() {
  const today = localDate(),
    rows = between(state, today, addDays(today, 30)).filter((a) => a.type === 'health');
  return `<div class="section-title care-section-title"><h2>Consultas e cuidados</h2>${btn('Novo lembrete', 'add-health')}</div><div class="health-columns"><section class="panel"><div class="section-title"><h2>Consultas e remédios</h2></div><p class="hint">Próximos 30 dias · também disponíveis na agenda.</p>${rows.length ? rows.map((a) => activityRow(a, true)).join('') : empty('Cuidado no seu ritmo', 'Adicione consultas ou lembretes de remédios com repetição diária ou semanal.', 'add-health', 'Adicionar lembrete', 'heart')}</section><section class="panel" style="margin-top:0"><div class="section-title"><h2>Minhas anotações</h2><button class="icon-btn" data-action="add-note" aria-label="Adicionar anotação">${icon('plus')}</button></div>${
    state.notes.length
      ? `<div class="notes">${[...state.notes]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(
            (n) =>
              `<article class="note"><div class="row between"><h3>${esc(n.title)}</h3><div class="row"><button class="icon-btn" data-action="edit-note" data-id="${n.id}" aria-label="Editar anotação">${icon('edit')}</button><button class="icon-btn" data-action="delete-note" data-id="${n.id}" aria-label="Excluir anotação">${icon('trash')}</button></div></div><span class="hint">${shortDate(n.date)}</span><p>${esc(n.text)}</p></article>`,
          )
          .join('')}</div>`
      : empty(
          'O que vale guardar',
          'Anote orientações e a síntese de consultas para consultar quando precisar.',
          'add-note',
          'Fazer uma anotação',
          'book',
        )
  }</section></div>`;
}
function chartMarkup() {
  const logs = state.logs
    .filter((l) => l.date.startsWith(wellnessMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!logs.length)
    return empty(
      'Seu mês começa com um registro',
      'Registre como você está e acompanhe humor e qualidade do sono ao longo do mês.',
      'daily-log',
      'Registrar meu dia',
      'smile',
    );
  const days = dateObj(monthBounds(wellnessMonth)[1]).getDate();
  const x = (d) => 32 + ((Number(d.slice(-2)) - 1) / (days - 1)) * 448,
    y = (v) => 160 - (v - 1) * 32;
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 510 195" role="img" aria-label="Gráfico mensal de humor e qualidade do sono, de 1 a 5"><title>Humor e sono em ${monthLabel(wellnessMonth)}</title>${[1, 2, 3, 4, 5].map((v) => `<line x1="32" y1="${y(v)}" x2="480" y2="${y(v)}" stroke="#e9ecdf" stroke-dasharray="3 4"/><text x="11" y="${y(v) + 4}">${v}</text>`).join('')}${[1, 5, 10, 15, 20, 25, days].map((d) => `<text x="${32 + ((d - 1) / (days - 1)) * 448}" y="184" text-anchor="middle">${d}</text>`).join('')}${[
    ['sleepQuality', '#bb9876'],
    ['mood', '#7e9564'],
  ]
    .map(
      ([key, color]) =>
        `${logs
          .slice(1)
          .map((l, i) =>
            Number(l.date.slice(-2)) - Number(logs[i].date.slice(-2)) === 1
              ? `<line x1="${x(logs[i].date)}" y1="${y(logs[i][key])}" x2="${x(l.date)}" y2="${y(l[key])}" stroke="${color}" stroke-width="2.5"/>`
              : '',
          )
          .join(
            '',
          )}${logs.map((l) => `<circle cx="${x(l.date)}" cy="${y(l[key])}" r="4" fill="${color}"><title>${shortDate(l.date)}: ${key === 'mood' ? moods[l[key] - 1] : sleeps[l[key] - 1]}</title></circle>`).join('')}`,
    )
    .join(
      '',
    )}</svg><div class="chart-legend"><span><i class="dot" style="background:#7e9564"></i> Humor</span><span><i class="dot" style="background:#bb9876"></i> Qualidade do sono</span></div><p class="hint" style="margin-top:15px">Escala de 1 a 5, na ordem das opções do diário. Dias sem registro ficam em branco.</p></div>`;
}
function wellnessPage() {
  const log = state.logs.find((l) => l.date === localDate()),
    history = state.logs
      .filter((l) => l.date.startsWith(wellnessMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="section-title care-section-title"><h2>Bem-estar no dia a dia</h2>${btn(log ? 'Editar meu dia' : 'Registrar meu dia', 'daily-log')}</div><div class="wellness-grid"><section class="panel"><div class="row between wrap"><h2>Seu mês em sentimentos</h2><input class="month-input" type="month" id="wellness-month" value="${wellnessMonth}" aria-label="Mês do gráfico"></div>${chartMarkup()}</section><section class="panel" style="margin-top:0"><div class="eyebrow">UM MOMENTO PARA VOCÊ</div><h2 style="margin-top:14px">Como você está hoje?</h2><div class="mood-options">${moods.map((m, i) => `<button class="mood-option ${log?.mood === i + 1 ? 'active' : ''}" data-mood="${i + 1}" aria-label="${m}"><span class="face">${faces[i]}</span>${m}</button>`).join('')}</div><p class="hint">Não existe resposta certa. Todos os sentimentos têm espaço aqui.</p>${log ? `<div style="margin-top:22px" class="stack"><p class="small">${icon('moon')} ${log.sleepHours} horas de sono · ${sleeps[log.sleepQuality - 1]}</p><p class="small">${icon('sun')} ${esc(log.exercise || 'Sem atividade física hoje')}</p></div>` : ''}</section></div><section class="panel" style="margin-top:22px"><h2>Seu diário</h2>${history.length ? history.map((l) => `<details class="log-history"><summary>${shortDate(l.date)} · ${moods[l.mood - 1]} · ${l.sleepHours}h de sono</summary><div class="row between"><p>Sono ${sleeps[l.sleepQuality - 1].toLowerCase()} · Energia: ${esc(l.energy)}<br>Atividade física: ${esc(l.exercise || 'Não realizada')}<br>Pensamentos: ${esc(l.speed)} · ${esc(l.content)}<br>Desconfortos: ${esc(l.pain || 'Nenhum registro')}<br>${esc(l.observations || '')}</p><div class="row"><button class="icon-btn" data-action="edit-log" data-date="${l.date}" aria-label="Editar registro">${icon('edit')}</button><button class="icon-btn" data-action="delete-log" data-date="${l.date}" aria-label="Excluir registro">${icon('trash')}</button></div></div></details>`).join('') : '<p class="empty small">Seu histórico vai aparecer aqui, um dia de cada vez.</p>'}</section>`;
}
function carePage() {
  return `${pageHead('Saúde e bem-estar', 'Um espaço para escutar, acompanhar e cuidar de você.')}<section class="care-section" aria-label="Bem-estar e diário">${wellnessPage()}</section><section class="care-section" aria-label="Consultas, remédios e anotações">${healthPage()}</section>`;
}
function renderAuth() {
  app.innerHTML = `<main class="auth"><section class="auth-art"><div class="brand">${brand()}</div><div class="intro"><div class="eyebrow" style="margin-bottom:24px">UM NOVO JEITO DE CULTIVAR SEUS DIAS</div><h1>Uma vida mais leve.<br>Uma folha<br>de cada vez.</h1><p>Seus planos, seus cuidados e seus sonhos encontram um lugar aqui.</p></div><img class="auth-scene" src="/scene.svg" alt="Uma mesa acolhedora com café fumegante, livros e uma planta"><p class="auth-caption">Organize. Cuide. Floresça no seu tempo.</p></section><section class="auth-right"><div class="auth-box"><div class="brand auth-mobile-logo">${brand()}</div><div class="eyebrow">${authMode === 'register' ? 'SEU PRÓXIMO CAPÍTULO' : 'QUE BOM TER VOCÊ POR AQUI'}</div><h2>${authMode === 'register' ? 'Vamos começar?' : 'Bem-vindo de volta.'}</h2><p>${authMode === 'register' ? 'Crie seu espaço para organizar a rotina e cuidar do que faz bem a você.' : 'Entre para continuar cultivando seus planos.'}</p><div class="auth-install"><button type="button" class="btn secondary" data-action="install">${icon('download')}Instalar aplicativo</button><p class="hint">Tenha o Vida em Folha na tela inicial do seu celular.</p></div><form id="auth-form">${authMode === 'register' ? '<label>Como você gosta de ser chamado?<input name="name" placeholder="Seu nome" autocomplete="given-name" maxlength="60" required></label>' : ''}<label>Endereço de e-mail<input name="email" type="email" placeholder="voce@exemplo.com" autocomplete="email" maxlength="254" required></label><label>Senha<input name="password" type="password" placeholder="Pelo menos 8 caracteres" autocomplete="${authMode === 'register' ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" required></label><p id="auth-error" class="error" role="alert"></p><button class="btn" type="submit">${authMode === 'register' ? 'Criar meu espaço' : 'Entrar no meu espaço'} ${icon('leaf')}</button></form><div class="auth-switch">${authMode === 'register' ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <button class="text-btn" data-action="auth-switch">${authMode === 'register' ? 'Entrar' : 'Criar conta'}</button></div><div class="auth-divider"></div><button class="demo-link" data-action="demo">${icon('sun')}Conhecer o aplicativo primeiro</button><div class="privacy-line">${icon('lock')}Seu espaço é pessoal. Seus dados também.</div></div></section></main>`;
}
function openModal(title, html) {
  modal.innerHTML = `<div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>${html}`;
  if (!modal.open) modal.showModal();
}
function formEnd(label = 'Salvar') {
  return `<p class="error" id="form-error" role="alert"></p><div class="form-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">${label}</button></div>`;
}
function activityForm(id = '', type = 'task', goalId = '') {
  const a = state.activities.find((a) => a.id === id) || {
    title: '',
    type,
    date: route === 'calendar' || route === 'today' ? selectedDate : localDate(),
    repeat: 'none',
    time: '',
    category: '',
    amount: 0,
  };
  const g = state.goals.find((g) => g.id === goalId),
    gc = state.categories.find((c) => c.id === g?.category);
  if (gc?.savings) {
    a.type = 'payment';
    a.category = state.categories.find((c) => c.kind === 'budget' && c.savings)?.id || '';
  }
  openModal(
    id ? 'Editar atividade' : goalId ? 'Nova etapa' : 'Um novo passo',
    `<p class="modal-description">${id && a.repeat !== 'none' ? 'A edição altera a série inteira. Para mudar somente uma data, use Adiar.' : 'Sua atividade também aparecerá na agenda e na programação do dia.'}</p><form id="activity-form" data-id="${id}" data-goal="${goalId || a.goalId || ''}"><div class="form-grid"><label class="full">O que você vai fazer?<input name="title" value="${esc(a.title)}" placeholder="Ex.: Caminhar no parque" maxlength="200" required></label><label>Tipo<select name="type" id="activity-type">${Object.entries(
      TYPES,
    )
      .map(([id, t]) => option(id, t[0], a.type))
      .join(
        '',
      )}</select></label><label>Data<input name="date" id="activity-date" type="date" value="${a.date}" required></label><label>Horário (opcional)<input name="time" type="time" value="${a.time || ''}"></label><label>Repetir<select name="repeat" id="activity-repeat">${[
      ['none', 'Não repetir'],
      ['daily', 'Diariamente'],
      ['weekly', 'Semanalmente'],
      ['monthly', 'Mensalmente'],
    ]
      .map(([v, l]) => option(v, l, a.repeat))
      .join(
        '',
      )}</select></label><label class="full" id="repeat-until-field">Repetir até (opcional)<input name="repeatUntil" type="date" min="${a.date}" value="${esc(a.repeatUntil || '')}"><span class="hint">Inclui a data final. Deixe em branco para repetir sem prazo.</span></label><div class="full form-grid" id="money-fields" ${['payment', 'income'].includes(a.type) ? '' : 'hidden'}><label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" max="999999999" value="${a.amount ? a.amount / 100 : ''}" placeholder="0,00"></label><label>Categoria<select name="category">${option('', 'Sem categoria', a.category)}${state.categories
      .filter((c) => c.kind === 'budget')
      .map((c) => option(c.id, c.name, a.category))
      .join(
        '',
      )}</select></label></div><label class="full">Detalhes (opcional)<textarea name="description" maxlength="4000" placeholder="Deixe um lembrete para você…">${esc(a.description || '')}</textarea></label></div>${formEnd(id ? 'Salvar alterações' : 'Adicionar atividade')}</form>`,
  );
  updateMoneyFields();
  updateRepeatFields();
}
function updateRepeatFields() {
  const repeat = $('#activity-repeat');
  if (!repeat) return;
  const field = $('#repeat-until-field'),
    input = field.querySelector('input'),
    visible = repeat.value !== 'none';
  field.hidden = !visible;
  field.style.display = visible ? 'grid' : 'none';
  input.disabled = !visible;
  input.min = $('#activity-date').value;
}
function updateMoneyFields() {
  const select = $('#activity-type');
  if (!select) return;
  const visible = ['payment', 'income'].includes(select.value);
  $('#money-fields').hidden = !visible;
  $('#money-fields').style.display = visible ? 'grid' : 'none';
  $('#money-fields input').required = visible;
}
function goalForm(id = '') {
  const g = state.goals.find((g) => g.id === id);
  stepCounter = 0;
  openModal(
    g ? 'Editar meta' : 'Plante uma nova meta',
    `<p class="modal-description">Divida seu plano em passos possíveis. Cada etapa entra na sua agenda.</p><form id="goal-form" data-id="${id}"><div class="form-grid"><label class="full">Qual é a sua meta?<input name="title" value="${esc(g?.title || '')}" maxlength="200" placeholder="Ex.: Concluir minha especialização" required></label><label>Categoria<select name="category" id="goal-category">${state.categories
      .filter((c) => c.kind === 'goal')
      .map((c) => option(c.id, c.name, g?.category || 'g0'))
      .join(
        '',
      )}</select></label><label>Prazo<select name="horizon">${option('medium', 'Médio prazo', g?.horizon || 'medium')}${option('long', 'Longo prazo', g?.horizon)}</select></label><label class="full">Por que isso é importante para você?<textarea name="description" maxlength="2000">${esc(g?.description || '')}</textarea></label></div>${!g ? `<h3 style="margin-top:24px">Pequenos passos</h3><p class="hint" id="step-hint">Cada etapa vira uma tarefa na data escolhida.</p><div id="steps"></div><button type="button" class="btn ghost" data-action="new-step">${icon('plus')}Adicionar etapa</button>` : '<p class="hint" style="margin-top:20px">As etapas existentes mantêm seus dados. Você pode editar cada uma no cartão da meta.</p>'}${formEnd(g ? 'Salvar meta' : 'Criar meta')}</form>`,
  );
  if (!g) addStepInput();
}
function addStepInput() {
  stepCounter++;
  const saving = state.categories.find((c) => c.id === $('#goal-category')?.value)?.savings;
  $('#steps').insertAdjacentHTML(
    'beforeend',
    `<div class="step-entry ${saving ? '' : 'no-money'}"><input name="stepTitle" placeholder="Descreva uma etapa" aria-label="Nome da etapa" maxlength="200" required><input name="stepDate" type="date" aria-label="Data da etapa" value="${localDate()}" required><input name="stepAmount" type="number" aria-label="Valor a guardar" min="0.01" step="0.01" placeholder="R$" ${saving ? 'required' : 'hidden'}><button type="button" class="icon-btn" data-action="remove-step" aria-label="Remover etapa">${icon('close')}</button></div>`,
  );
  updateGoalMoney();
}
function updateGoalMoney() {
  const saving = state.categories.find((c) => c.id === $('#goal-category')?.value)?.savings;
  document.querySelectorAll('.step-entry').forEach((el) => {
    el.classList.toggle('no-money', !saving);
    const input = el.querySelector('[name="stepAmount"]');
    input.hidden = !saving;
    input.required = !!saving;
  });
  if ($('#step-hint'))
    $('#step-hint').textContent = saving
      ? 'Cada etapa vira um pagamento em Dinheiro guardado. A reserva aumenta quando você confirma o pagamento.'
      : 'Cada etapa vira uma tarefa na data escolhida.';
}
function dailyLog(date = localDate(), mood) {
  const l = state.logs.find((l) => l.date === date) || {};
  openModal(
    'Um momento para você',
    `<p class="modal-description">Perceba seu corpo e seus sentimentos, sem julgamentos.</p><form id="log-form"><div class="form-grid"><label class="full">Data<input type="date" name="date" value="${date}" max="${localDate()}" required></label><label>Como você está se sentindo?<select name="mood">${options(moods, mood || l.mood || 3)}</select></label><label>Nível de energia<select name="energy">${['Muito baixa', 'Baixa', 'Normal', 'Ativa', 'Muito ativa'].map((v) => option(v, v, l.energy || 'Normal')).join('')}</select></label><label>Qualidade do sono<select name="sleepQuality">${options(sleeps, l.sleepQuality || 3)}</select></label><label>Horas de sono<select name="sleepHours">${[5, 6, 7, 8, 9, 10].map((v) => option(v, v + ' horas', l.sleepHours || 7)).join('')}</select></label><label class="full">Atividade física do dia<input name="exercise" maxlength="200" placeholder="Ex.: Caminhada, musculação, bike" value="${esc(l.exercise || '')}"><span class="hint">Pode deixar em branco se não realizou atividade física.</span></label><label class="full">Velocidade dos pensamentos<select name="speed">${['Muito lento', 'Lento', 'Um pouco mais lento', 'Normal', 'Um pouco mais acelerado', 'Acelerado'].map((v) => option(v, v, l.speed || 'Normal')).join('')}</select></label><label class="full">Conteúdo dos pensamentos<select name="content">${['Muito negativo', 'Um pouco negativo', 'Equilibrado', 'Positivo', 'Muito positivo'].map((v) => option(v, v, l.content || 'Equilibrado')).join('')}</select></label><label class="full">Desconfortos, dores ou sintomas<textarea name="pain" maxlength="4000" placeholder="O que seu corpo está dizendo hoje?">${esc(l.pain || '')}</textarea></label><label class="full">Observações<textarea name="observations" maxlength="4000" placeholder="Algo mais que você gostaria de registrar?">${esc(l.observations || '')}</textarea></label></div>${formEnd('Guardar meu registro')}</form>`,
  );
}
function noteForm(id = '') {
  const n = state.notes.find((n) => n.id === id);
  openModal(
    n ? 'Editar anotação' : 'Uma anotação de cuidado',
    `<form id="note-form" data-id="${id}"><div class="stack"><label>Título<input name="title" value="${esc(n?.title || '')}" maxlength="200" placeholder="Ex.: Consulta de acompanhamento" required></label><label>Data<input name="date" type="date" value="${n?.date || localDate()}" required></label><label>Anotação<textarea name="text" rows="6" maxlength="10000" placeholder="Orientações, perguntas para a próxima consulta…" required>${esc(n?.text || '')}</textarea></label></div>${formEnd()}</form>`,
  );
}
function categories(kind) {
  openModal(
    'Suas categorias',
    `<p class="modal-description">Organize ${kind === 'goal' ? 'suas metas' : 'seus pagamentos'} de um jeito que faça sentido para você.</p><div>${state.categories
      .filter((c) => c.kind === kind)
      .map(
        (c) =>
          `<form class="category-form settings-row" data-id="${c.id}" data-kind="${kind}"><input name="name" value="${esc(c.name)}" maxlength="70" required aria-label="Nome da categoria"><button class="icon-btn" title="Salvar nome" aria-label="Salvar categoria">${icon('check')}</button><button type="button" class="icon-btn" data-action="delete-category" data-id="${c.id}" data-kind="${kind}" aria-label="Excluir categoria">${icon('trash')}</button></form>`,
      )
      .join(
        '',
      )}</div><form id="new-category-form" data-kind="${kind}" class="row" style="margin-top:20px"><input name="name" placeholder="Nova categoria" maxlength="70" required><button class="btn" aria-label="Adicionar categoria">${icon('plus')}</button></form>`,
  );
}
function confirmAction(title, description, action) {
  openModal(
    title,
    `<p class="modal-description">${description}</p><div class="form-actions"><button class="btn secondary" data-action="close-modal">Cancelar</button><button class="btn danger" id="confirm-delete">Excluir</button></div>`,
  );
  $('#confirm-delete').onclick = async () => {
    if (await action()) modal.close();
  };
}
function notificationEnabled() {
  return (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted' &&
    localStorage.getItem('vf-notifications') === 'on'
  );
}
async function notifications() {
  if (typeof Notification === 'undefined') {
    toast('Este navegador não oferece notificações. Seus lembretes continuam na agenda.');
    return;
  }
  if (notificationEnabled()) {
    localStorage.setItem('vf-notifications', 'off');
    render();
    toast('Notificações desativadas.');
    return;
  }
  openModal(
    'Lembretes no seu ritmo',
    `<p class="modal-description">Ative os avisos de atividades no horário marcado. Nesta versão, os lembretes funcionam enquanto o aplicativo estiver aberto neste dispositivo.</p><div class="form-actions"><button class="btn secondary" data-action="close-modal">Agora não</button><button class="btn" id="enable-notifications">Ativar notificações</button></div>`,
  );
  $('#enable-notifications').onclick = async () => {
    const permission = await Notification.requestPermission();
    localStorage.setItem('vf-notifications', permission === 'granted' ? 'on' : 'off');
    modal.close();
    render();
    toast(
      permission === 'granted'
        ? 'Notificações ativadas neste dispositivo.'
        : 'Notificações não autorizadas. Você pode ajustar nas configurações do navegador.',
    );
  };
}
const notified = new Set();
async function checkReminders() {
  if (!user || !state || !notificationEnabled()) return;
  const now = new Date(),
    time = now.toTimeString().slice(0, 5),
    today = localDate();
  for (const a of forDay(state, today)) {
    const key = user.email + a.id + today + a.time;
    if (a.time === time && !a.done && !notified.has(key)) {
      notified.add(key);
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg)
          await reg.showNotification('Vida em Folha', {
            body: a.title,
            icon: '/icon.svg',
            tag: key,
          });
        else new Notification('Vida em Folha', { body: a.title, tag: key });
      } catch {
        toast('Lembrete: ' + a.title);
      }
    }
  }
}
function makeDemo() {
  demo = true;
  user = { name: 'Marina', email: 'demo@vidaemfolha.local' };
  state = initialData();
  const today = localDate();
  const create = (title, type, date, time = '', extra = {}) => ({
    id: uid(),
    title,
    type,
    date,
    time,
    repeat: 'none',
    amount: 0,
    category: '',
    completed: {},
    postponed: {},
    ...extra,
  });
  const goal = uid();
  state.goals = [
    {
      id: goal,
      title: 'Criar o hábito de ler',
      description: 'Um pouco de leitura, todos os dias.',
      category: 'g1',
      horizon: 'medium',
    },
  ];
  state.activities = [
    create('Caminhada ao ar livre', 'wellness', today, '07:30', {
      repeat: 'daily',
      completed: { [today]: true },
    }),
    create('Reunião de planejamento', 'appointment', today, '10:00'),
    create('Estudar por 30 minutos', 'study', today, '15:00'),
    create('Ler o primeiro capítulo', 'study', today, '20:00', { goalId: goal }),
    create('Organizar a mesa de trabalho', 'task', addDays(today, -1)),
    create('Separar os materiais de estudo', 'task', addDays(today, -2)),
    create('Internet', 'payment', today.slice(0, 7) + '-10', '', {
      category: 'b0',
      amount: 10990,
      completed: { [today.slice(0, 7) + '-10']: true },
      repeat: 'monthly',
    }),
    create('Meu trabalho', 'income', today.slice(0, 7) + '-05', '', {
      amount: 450000,
      completed: { [today.slice(0, 7) + '-05']: true },
      repeat: 'monthly',
    }),
    create('Reserva para meus sonhos', 'payment', today, '', {
      category: 'b9',
      amount: 40000,
      savings: true,
      completed: { [today]: true },
    }),
    create('Consulta de rotina', 'health', addDays(today, 3), '09:00'),
  ];
  for (let i = 12; i >= 0; i--) {
    const date = addDays(today, -i);
    state.logs.push({
      date,
      mood: [3, 4, 3, 2, 4, 4, 3, 5, 4, 3, 4, 5, 3][12 - i],
      sleepQuality: [3, 4, 3, 2, 3, 4, 4, 4, 3, 3, 4, 5, 4][12 - i],
      sleepHours: 7,
      energy: 'Normal',
      exercise: i % 2 ? 'Caminhada de 30 minutos' : '',
      speed: 'Normal',
      content: 'Equilibrado',
      pain: '',
      observations: '',
    });
  }
  route = 'home';
  location.hash = 'home';
  render();
  window.scrollTo(0, 0);
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('button');
  if (!el) return;
  try {
    if (el.dataset.nav) {
      route = el.dataset.nav;
      location.hash = route;
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (el.dataset.budgetFilter) {
      budgetFilter = el.dataset.budgetFilter;
      render();
      return;
    }
    if (el.dataset.month) {
      const d = dateObj(calendarMonth + '-01');
      d.setMonth(d.getMonth() + Number(el.dataset.month));
      calendarMonth = localDate(d).slice(0, 7);
      render();
      return;
    }
    if (el.classList.contains('calendar-day')) {
      selectedDate = el.dataset.date;
      render();
      return;
    }
    if (el.dataset.mood) {
      dailyLog(localDate(), Number(el.dataset.mood));
      return;
    }
    const id = el.dataset.id,
      action = el.dataset.action;
    switch (action) {
      case 'close-modal':
        modal.close();
        break;
      case 'auth-switch':
        authMode = authMode === 'register' ? 'login' : 'register';
        renderAuth();
        break;
      case 'demo':
        makeDemo();
        break;
      case 'exit-demo':
        demo = false;
        user = null;
        state = null;
        authMode = 'register';
        location.hash = '';
        renderAuth();
        break;
      case 'logout':
        if (!demo) await request('logout', {});
        demo = false;
        state = null;
        user = null;
        location.hash = '';
        renderAuth();
        break;
      case 'add-activity':
        activityForm();
        break;
      case 'add-payment':
        activityForm('', 'payment');
        break;
      case 'opening-balance': {
        const b = budget(state, budgetMonth);
        openModal(
          'Saldo do mês anterior',
          `<p class="modal-description">Informe o saldo disponível no início de ${monthLabel(budgetMonth)}. Esse valor também será considerado nos meses seguintes. Você pode inserir um saldo negativo.</p><form id="opening-balance-form" data-month="${budgetMonth}"><label>Saldo anterior (R$)<input name="amount" type="number" step="0.01" min="-999999999" max="999999999" value="${b.opening / 100}" required></label>${formEnd('Salvar saldo')}</form><button type="button" class="btn ghost" data-action="reset-opening" data-month="${budgetMonth}">Usar saldo calculado automaticamente</button>`,
        );
        break;
      }
      case 'reset-opening':
        if (
          await commit((d) => {
            if (d.budgetOpeningBalances) delete d.budgetOpeningBalances[el.dataset.month];
          }, 'Saldo automático restaurado.')
        )
          modal.close();
        break;
      case 'add-health':
        activityForm('', 'health');
        break;
      case 'edit-activity':
        activityForm(id);
        break;
      case 'toggle':
        await commit((d) => {
          const a = d.activities.find((a) => a.id === id);
          a.completed ||= {};
          a.completed[el.dataset.origin] = !a.completed[el.dataset.origin];
        }, 'Atividade atualizada.');
        break;
      case 'delete-activity': {
        const a = state.activities.find((a) => a.id === id);
        confirmAction(
          'Excluir atividade?',
          `${esc(a.title)}${a.repeat !== 'none' ? ' e todas as suas repetições serão removidas.' : ' será removida da agenda.'}`,
          () =>
            commit((d) => {
              d.activities = d.activities.filter((a) => a.id !== id);
            }, 'Atividade excluída.'),
        );
        break;
      }
      case 'postpone': {
        const a = state.activities.find((a) => a.id === id);
        openModal(
          'Um novo momento',
          `<p class="modal-description">Adiar: ${esc(a.title)}. ${a.repeat !== 'none' ? 'Somente esta ocorrência será adiada.' : ''}</p><form id="postpone-form" data-id="${id}" data-origin="${el.dataset.origin}"><label>Nova data<input name="date" type="date" min="${localDate()}" value="${addDays(el.dataset.day < localDate() ? localDate() : el.dataset.day, 1)}" required></label>${formEnd('Adiar atividade')}</form>`,
        );
        break;
      }
      case 'pending': {
        const rows = pendingRows();
        openModal(
          'Suas pendências',
          `<p class="modal-description">Atividades dos últimos 12 meses que ainda precisam de um novo passo.</p>${rows.length ? rows.map((a) => activityRow(a, true)).join('') : empty('Tudo em dia', 'Nenhuma pendência por aqui.', '', '', 'check')}`,
        );
        break;
      }
      case 'calendar-today':
        selectedDate = localDate();
        calendarMonth = selectedDate.slice(0, 7);
        render();
        break;
      case 'add-goal':
        goalForm();
        break;
      case 'edit-goal':
        goalForm(id);
        break;
      case 'new-step':
        addStepInput();
        break;
      case 'remove-step':
        el.closest('.step-entry').remove();
        break;
      case 'add-step':
        activityForm('', 'task', id);
        break;
      case 'delete-goal':
        confirmAction(
          'Excluir esta meta?',
          'A meta e as etapas vinculadas serão removidas da agenda e do orçamento.',
          () =>
            commit((d) => {
              d.goals = d.goals.filter((g) => g.id !== id);
              d.activities = d.activities.filter((a) => a.goalId !== id);
            }, 'Meta excluída.'),
        );
        break;
      case 'goal-categories':
        categories('goal');
        break;
      case 'budget-categories':
        categories('budget');
        break;
      case 'delete-category': {
        const used =
          state.activities.some((a) => a.category === id) ||
          state.goals.some((g) => g.category === id);
        if (used) {
          toast('Esta categoria está em uso. Reclassifique os registros antes de excluí-la.');
          break;
        }
        if (
          await commit((d) => {
            d.categories = d.categories.filter((c) => c.id !== id);
          }, 'Categoria excluída.')
        )
          categories(el.dataset.kind);
        break;
      }
      case 'daily-log':
        dailyLog();
        break;
      case 'edit-log':
        dailyLog(el.dataset.date);
        break;
      case 'delete-log':
        confirmAction(
          'Excluir registro?',
          'O registro deste dia será removido do seu diário e do gráfico.',
          () =>
            commit((d) => {
              d.logs = d.logs.filter((l) => l.date !== el.dataset.date);
            }, 'Registro excluído.'),
        );
        break;
      case 'add-note':
        noteForm();
        break;
      case 'edit-note':
        noteForm(id);
        break;
      case 'delete-note':
        confirmAction('Excluir anotação?', 'Esta anotação será removida.', () =>
          commit((d) => {
            d.notes = d.notes.filter((n) => n.id !== id);
          }, 'Anotação excluída.'),
        );
        break;
      case 'notifications':
        await notifications();
        break;
      case 'profile':
        openModal(
          'Seu espaço, seu rosto',
          `<p class="modal-description">${esc(user.name)} · ${esc(user.email)}</p><form id="profile-form"><label>Foto de perfil (opcional)<input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"><span class="hint">Imagem de até 500 KB. Sua inicial aparece quando não há foto.</span></label><label class="check-row" style="margin-top:15px"><input type="checkbox" name="remove">Remover foto atual</label>${formEnd()}</form><button class="btn ghost" data-action="install">${icon('download')}Instalar aplicativo</button>`,
        );
        break;
      case 'install':
        if (installPrompt) {
          await installPrompt.prompt();
          installPrompt = null;
        } else
          openModal(
            'Leve sua rotina com você',
            `<p class="modal-description">No Android, abra este site no <strong>Google Chrome</strong>. No menu <strong>⋮</strong>, escolha <strong>Instalar aplicativo</strong>, <strong>Instalar e criar atalho</strong> ou <strong>Adicionar à tela inicial</strong>, conforme a opção disponível. Confirme em <strong>Instalar</strong>. No iPhone, use <strong>Compartilhar → Adicionar à Tela de Início</strong>.</p><p class="hint">Entre com o mesmo e-mail e senha em cada dispositivo para acessar seus dados. A sincronização precisa de conexão com a internet.</p>`,
          );
        break;
    }
  } catch (error) {
    toast(error.message || 'Não foi possível concluir esta ação.');
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'activity-type') updateMoneyFields();
  if (['activity-repeat', 'activity-date'].includes(e.target.id)) updateRepeatFields();
  if (e.target.id === 'goal-category') updateGoalMoney();
  if (e.target.id === 'today-date' && e.target.value) {
    selectedDate = e.target.value;
    render();
  }
  if (e.target.id === 'budget-month' && e.target.value) {
    budgetMonth = e.target.value;
    render();
  }
  if (e.target.id === 'wellness-month' && e.target.value) {
    wellnessMonth = e.target.value;
    render();
  }
});
let searchTimer;
document.addEventListener('input', (e) => {
  if (e.target.id === 'calendar-search') {
    search = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const pos = e.target.selectionStart;
      render();
      $('#calendar-search')?.focus();
      $('#calendar-search')?.setSelectionRange(pos, pos);
    }, 220);
  }
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (busy) return;
  const submit = form.querySelector('button[type="submit"],button:not([type])');
  if (submit) submit.disabled = true;
  const values = Object.fromEntries(new FormData(form));
  try {
    if (form.id === 'auth-form') {
      const data = await request(authMode, values);
      user = data.user;
      const r = await request('state');
      state = r.data;
      version = r.version;
      demo = false;
      route = 'home';
      location.hash = 'home';
      render();
      return;
    }
    let ok = false;
    if (form.id === 'opening-balance-form') {
      const value = Math.round(Number(values.amount) * 100);
      if (!Number.isSafeInteger(value) || Math.abs(value) > 99999999900)
        throw new Error('Informe um saldo válido.');
      ok = await commit((d) => {
        d.budgetOpeningBalances ||= {};
        d.budgetOpeningBalances[form.dataset.month] = value;
      }, 'Saldo anterior salvo.');
    }
    if (form.id === 'activity-form') {
      values.repeatUntil = values.repeat === 'none' ? '' : values.repeatUntil || '';
      if (!validRepeatUntil(values))
        throw new Error('A data final da repetição deve ser igual ou posterior à data inicial.');
      const existing = state.activities.find((a) => a.id === form.dataset.id);
      const financial = ['payment', 'income'].includes(values.type);
      const amount = financial ? Math.round(Number(values.amount) * 100) : 0;
      if (financial && (!Number.isSafeInteger(amount) || amount <= 0))
        throw new Error('Informe um valor maior que zero.');
      if (form.dataset.goal && values.repeat !== 'none')
        throw new Error('Etapas de metas não se repetem. Crie uma etapa para cada data.');
      const data = {
        id: existing?.id || uid(),
        ...values,
        amount,
        goalId: form.dataset.goal || '',
        completed: existing?.completed || {},
        postponed: existing?.postponed || {},
        savings:
          financial &&
          values.type === 'payment' &&
          !!state.categories.find((c) => c.id === values.category)?.savings,
      };
      if (existing && existing.date !== data.date) {
        data.completed = {};
        data.postponed = {};
      }
      ok = await commit((d) => {
        if (existing) d.activities = d.activities.map((a) => (a.id === existing.id ? data : a));
        else d.activities.push(data);
      }, 'Atividade salva.');
    }
    if (form.id === 'postpone-form') {
      ok = await commit((d) => {
        const a = d.activities.find((a) => a.id === form.dataset.id);
        a.postponed ||= {};
        a.completed ||= {};
        if (values.date === form.dataset.origin) delete a.postponed[form.dataset.origin];
        else a.postponed[form.dataset.origin] = values.date;
        a.completed[form.dataset.origin] = false;
      }, 'Tudo bem mudar os planos. Atividade adiada.');
    }
    if (form.id === 'goal-form') {
      const existing = state.goals.find((g) => g.id === form.dataset.id),
        id = existing?.id || uid(),
        saving = state.categories.find((c) => c.id === values.category)?.savings;
      const steps = [...form.querySelectorAll('.step-entry')].map((el) => ({
        title: el.querySelector('[name="stepTitle"]').value,
        date: el.querySelector('[name="stepDate"]').value,
        amount: saving
          ? Math.round(Number(el.querySelector('[name="stepAmount"]').value) * 100)
          : 0,
      }));
      if (!existing && !steps.length) throw new Error('Adicione pelo menos uma etapa à sua meta.');
      if (saving && steps.some((s) => !Number.isSafeInteger(s.amount) || s.amount <= 0))
        throw new Error('Informe o valor a guardar em cada etapa.');
      ok = await commit((d) => {
        const goal = {
          id,
          title: values.title,
          category: values.category,
          horizon: values.horizon,
          description: values.description,
        };
        if (existing) d.goals = d.goals.map((g) => (g.id === id ? goal : g));
        else {
          d.goals.push(goal);
          let cat = d.categories.find((c) => c.kind === 'budget' && c.savings);
          if (saving && !cat) {
            cat = { id: uid(), name: 'Dinheiro guardado', kind: 'budget', savings: true };
            d.categories.push(cat);
          }
          for (const step of steps)
            d.activities.push({
              id: uid(),
              ...step,
              type: saving ? 'payment' : values.category === 'g1' ? 'study' : 'task',
              category: saving ? cat.id : '',
              savings: !!saving,
              goalId: id,
              repeat: 'none',
              time: '',
              completed: {},
              postponed: {},
            });
        }
      }, 'Sua meta ganhou espaço para crescer.');
    }
    if (form.id === 'log-form') {
      const log = {
        ...values,
        mood: Number(values.mood),
        sleepHours: Number(values.sleepHours),
        sleepQuality: Number(values.sleepQuality),
      };
      ok = await commit((d) => {
        d.logs = d.logs.filter((l) => l.date !== log.date);
        d.logs.push(log);
      }, 'Seu dia foi registrado. Obrigado por cuidar de você.');
    }
    if (form.id === 'note-form') {
      const id = form.dataset.id || uid();
      ok = await commit((d) => {
        d.notes = d.notes.filter((n) => n.id !== id);
        d.notes.push({ id, ...values });
      }, 'Anotação salva.');
    }
    if (form.classList.contains('category-form') || form.id === 'new-category-form') {
      const name = values.name.trim(),
        kind = form.dataset.kind;
      if (!name) throw new Error('Dê um nome à categoria.');
      if (
        state.categories.some(
          (c) =>
            c.kind === kind &&
            c.id !== form.dataset.id &&
            c.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw new Error('Já existe uma categoria com esse nome.');
      ok = await commit((d) => {
        if (form.dataset.id) d.categories.find((c) => c.id === form.dataset.id).name = name;
        else d.categories.push({ id: uid(), name, kind, savings: false });
      }, 'Categoria salva.');
      if (ok) categories(kind);
      return;
    }
    if (form.id === 'profile-form') {
      let avatar = state.profile?.avatar || '';
      if (values.remove) avatar = '';
      else if (values.avatar?.size) {
        if (
          values.avatar.size > 500000 ||
          !['image/png', 'image/jpeg', 'image/webp'].includes(values.avatar.type)
        )
          throw new Error('Escolha uma imagem PNG, JPEG ou WebP de até 500 KB.');
        avatar = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(values.avatar);
        });
      }
      ok = await commit((d) => {
        d.profile = { ...d.profile, avatar };
      }, 'Perfil atualizado.');
    }
    if (ok) modal.close();
  } catch (error) {
    const target = form.querySelector('.error');
    if (target) target.textContent = error.message;
    else toast(error.message);
  } finally {
    if (submit) submit.disabled = false;
  }
});
window.addEventListener('hashchange', () => {
  if (user) {
    route = location.hash.slice(1) || 'home';
    render();
  }
});
window.addEventListener('focus', sync);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) sync();
});
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});
window.addEventListener('offline', () =>
  toast('Você está sem conexão. Conecte-se para salvar e sincronizar.'),
);
window.addEventListener('online', () => {
  toast('Conexão restabelecida.');
  sync();
});
setInterval(sync, 30000);
setInterval(checkReminders, 20000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
try {
  const r = await request('state');
  user = r.user;
  state = r.data;
  version = r.version;
  render();
} catch (error) {
  renderAuth();
  if (error.status !== 401)
    $('#auth-error').textContent =
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
}
