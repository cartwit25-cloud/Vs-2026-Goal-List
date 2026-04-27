/* =====================================================
   render.js — DOM 渲染
===================================================== */

/* ---- Loading bar ---- */
function setLoading(on) {
  let bar = document.getElementById('loadingBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'loadingBar';
    document.body.prepend(bar);
  }
  bar.classList.toggle('on', on);
}

/* ---- Sync badge ---- */
function setSyncState(state) {
  // state: 'ok' | 'syncing' | 'error' | 'idle'
  const badge = document.getElementById('syncBadge');
  const label = document.getElementById('syncLabel');
  badge.dataset.state = state;
  const map = { ok: '已連線', syncing: '同步中…', error: '同步失敗', idle: '未連線' };
  label.textContent = map[state] || state;
}

/* ---- Toast ---- */
function toast(msg, type = 'default', ms = 2800) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { ok: '✅', error: '❌', info: 'ℹ️', default: '🌸' };
  el.innerHTML = `<span>${icons[type] || '🌸'}</span><span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, ms);
}

/* ---- Stats ---- */
function renderStats(goals) {
  const total = goals.length;
  const done  = goals.filter(g => g.completed).length;
  const rate  = total === 0 ? 0 : Math.round(done / total * 100);
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent  = done;
  document.getElementById('statRate').textContent  = rate + '%';
}

/* ---- Today strip ---- */
function renderToday(goals, todayIds) {
  const strip  = document.getElementById('todayStrip');
  const chips  = document.getElementById('todayChips');
  const picks  = goals.filter(g => todayIds.includes(g.id) && !g.completed);
  chips.innerHTML = '';
  if (picks.length === 0) { strip.hidden = true; return; }
  strip.hidden = false;
  picks.forEach(g => {
    const chip = document.createElement('div');
    chip.className = 'today-chip';
    chip.innerHTML = `
      <span class="chip-cat">${CAT_EMOJI[g.category]} ${g.category}</span>
      <span>${escHtml(g.title)}</span>
    `;
    chips.appendChild(chip);
  });
}

/* ---- Build all section cards ---- */
function buildSections() {
  const grid = document.getElementById('sectionsGrid');
  grid.innerHTML = '';
  CATEGORIES.forEach((cat, i) => {
    const card = document.createElement('div');
    card.className = 'sec-card';
    card.dataset.cat = cat;
    card.style.animationDelay = (i * 80) + 'ms';
    card.innerHTML = `
      <div class="sec-header">
        <div class="sec-header-left">
          <span class="sec-emoji">${CAT_EMOJI[cat]}</span>
          <span class="sec-name">${cat}</span>
        </div>
        <span class="sec-rate" id="rate-${cat}">0 / 0</span>
      </div>
      <div class="add-bar">
        <input type="text" class="add-input" data-cat="${cat}" placeholder="輸入新目標…" />
        <select class="pri-select" data-cat="${cat}">
          <option value="高">🔴 高</option>
          <option value="中" selected>🟡 中</option>
          <option value="低">🟢 低</option>
        </select>
        <button class="btn-add" data-cat="${cat}">＋ 新增</button>
      </div>
      <div class="goal-list" id="list-${cat}"></div>
    `;
    grid.appendChild(card);
  });
}

/* ---- Render one section ---- */
function renderSection(cat, goals, todayIds) {
  const list     = document.getElementById('list-' + cat);
  const rateEl   = document.getElementById('rate-' + cat);
  const catGoals = goals.filter(g => g.category === cat);
  const active   = catGoals.filter(g => !g.completed)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const done     = catGoals.filter(g => g.completed);

  list.innerHTML = '';
  [...active, ...done].forEach(g => {
    list.appendChild(buildGoalCard(g, todayIds));
  });
  rateEl.textContent = `${done.length} / ${catGoals.length}`;
}

/* ---- Build a single goal card ---- */
function buildGoalCard(goal, todayIds) {
  const prog = Math.min(100, Math.max(0, Number(goal.progress) || 0));
  const card = document.createElement('div');
  card.className = 'goal-card';
  card.dataset.id  = goal.id;
  card.dataset.pri = goal.priority || '中';
  if (goal.completed)            card.classList.add('is-done');
  if (isStale(goal))             card.classList.add('is-stale');
  if (todayIds.includes(goal.id) && !goal.completed) card.classList.add('is-today');

  card.innerHTML = `
    ${isStale(goal) ? '<span class="stale-badge">⏰ 7天未更新</span>' : ''}
    <div class="goal-top">
      <div class="cb-wrap">
        <input type="checkbox" class="cb-input" id="cb-${goal.id}" ${goal.completed ? 'checked' : ''} />
        <label class="cb-visual" for="cb-${goal.id}"></label>
      </div>
      <div class="goal-info">
        <div class="goal-name">${escHtml(goal.title)}</div>
        <div class="goal-meta">
          <span class="pri-badge ${goal.priority || '中'}">${goal.priority || '中'}</span>
          <span class="goal-date">${fmtDate(goal.created_at)}</span>
        </div>
      </div>
      <button class="btn-del" data-id="${goal.id}" title="刪除">✕</button>
    </div>
    <div class="goal-prog">
      <div class="prog-top">
        <span class="prog-lbl">進度</span>
        <span class="prog-pct" id="pct-${goal.id}">${prog}%</span>
      </div>
      <div class="prog-track">
        <div class="prog-fill" id="fill-${goal.id}" style="width:${prog}%"></div>
      </div>
      <input type="range" min="0" max="100" value="${prog}"
             class="prog-slider" data-id="${goal.id}" />
      <div class="complete-tip ${prog >= 100 ? 'show' : ''}" id="tip-${goal.id}">
        🎉 太棒了！可以勾選完成囉！
      </div>
    </div>
  `;
  return card;
}

/* ---- Inline update progress UI only (no re-render) ---- */
function updateProgUI(id, val) {
  const fill = document.getElementById('fill-' + id);
  const pct  = document.getElementById('pct-'  + id);
  const tip  = document.getElementById('tip-'  + id);
  if (fill) fill.style.width = val + '%';
  if (pct)  pct.textContent  = val + '%';
  if (tip)  tip.classList.toggle('show', val >= 100);
}

/* ---- Animate card out then re-render (for checkbox toggle) ---- */
function animateCardMove(id, cb) {
  const card = document.querySelector(`.goal-card[data-id="${id}"]`);
  if (!card) { cb(); return; }
  card.classList.add('moving-out');
  card.addEventListener('transitionend', cb, { once: true });
  // fallback
  setTimeout(cb, 600);
}
