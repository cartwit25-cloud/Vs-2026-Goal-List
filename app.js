/* =====================================================
   app.js — 主邏輯 & 事件綁定
===================================================== */

let goals    = [];
let todayIds = [];
let sliderTimer = null;   // debounce for slider

/* =====================================================
   Boot
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (getUrl()) {
    showApp();
  } else {
    showSetup();
  }
  bindSetup();
  bindConfig();
});

function showSetup() {
  document.getElementById('setupOverlay').removeAttribute('hidden');
  document.getElementById('setupOverlay').style.display = 'flex';
  document.getElementById('app').hidden = true;
}

async function showApp() {
  document.getElementById('setupOverlay').hidden = true;
  document.getElementById('setupOverlay').style.display = 'none';
  document.getElementById('app').hidden = false;
  buildSections();
  bindAppEvents();
  await loadAll();
}

/* =====================================================
   Data load
===================================================== */
async function loadAll() {
  setLoading(true);
  setSyncState('syncing');
  try {
    goals    = await API.getAll();
    saveGoals(goals);
    setSyncState('ok');
  } catch (e) {
    console.error('loadAll error', e);
    setSyncState('error');
    toast('載入失敗：' + e.message, 'error');
    // 用本地 cache 讓頁面還是能顯示
    goals = loadGoals();
  }
  todayIds = getTodayPicks(goals);
  renderAll();
  setLoading(false);
}

function renderAll() {
  CATEGORIES.forEach(cat => renderSection(cat, goals, todayIds));
  renderStats(goals);
  renderToday(goals, todayIds);
}

/* =====================================================
   CRUD
===================================================== */

/* ---- Add ---- */
async function addGoal(cat, title, priority) {
  const t = title.trim();
  if (!t) { toast('請輸入目標名稱 🌸', 'info'); return; }

  const goal = {
    id: genId(), category: cat, title: t,
    progress: 0, completed: false,
    priority: priority || '中',
    created_at: nowIso(), updated_at: nowIso(),
  };

  goals.push(goal);
  saveGoals(goals);
  todayIds = getTodayPicks(goals);
  renderAll();

  setSyncState('syncing');
  try {
    await API.add(goal);
    setSyncState('ok');
    toast('目標已新增 🎯', 'ok');
  } catch (e) {
    setSyncState('error');
    toast('同步失敗，已存本地', 'error');
  }
}

/* ---- Toggle complete ---- */
async function toggleComplete(id, checked) {
  animateCardMove(id, async () => {
    const idx = goals.findIndex(g => g.id === id);
    if (idx < 0) return;
    goals[idx] = {
      ...goals[idx],
      completed: checked,
      progress: checked ? 100 : goals[idx].progress,
      updated_at: nowIso(),
    };
    saveGoals(goals);
    todayIds = getTodayPicks(goals);
    renderAll();
    if (checked) toast('🎉 完成一個目標！棒棒！', 'ok');
  });

  setSyncState('syncing');
  try {
    const g = goals.find(g => g.id === id);
    if (g) await API.update(g);
    setSyncState('ok');
  } catch (e) {
    setSyncState('error');
    toast('同步失敗', 'error');
  }
}

/* ---- Update progress ---- */
async function updateProgress(id, val) {
  const idx = goals.findIndex(g => g.id === id);
  if (idx < 0) return;
  goals[idx] = { ...goals[idx], progress: val, updated_at: nowIso() };
  saveGoals(goals);
  renderStats(goals); // only update stats, no full re-render

  setSyncState('syncing');
  try {
    await API.update(goals[idx]);
    setSyncState('ok');
  } catch (e) {
    setSyncState('error');
    toast('同步失敗', 'error');
  }
}

/* ---- Delete ---- */
async function deleteGoal(id) {
  if (!confirm('確定要刪除這個目標嗎？')) return;
  goals = goals.filter(g => g.id !== id);
  saveGoals(goals);
  todayIds = getTodayPicks(goals);
  renderAll();

  setSyncState('syncing');
  try {
    await API.del(id);
    setSyncState('ok');
    toast('已刪除', 'info');
  } catch (e) {
    setSyncState('error');
    toast('刪除同步失敗', 'error');
  }
}

/* =====================================================
   Event Bindings
===================================================== */

/* ---- Setup screen ---- */
function bindSetup() {
  const urlInput = document.getElementById('setupUrl');
  const errEl    = document.getElementById('setupError');
  const saveBtn  = document.getElementById('btnSetupSave');

  saveBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    errEl.hidden = true;

    if (!url) { showErr(errEl, '請填入 URL'); return; }
    if (!url.startsWith('https://script.google.com')) {
      showErr(errEl, '格式不對，請確認是 Apps Script 的 URL'); return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '連線中…';

    try {
      // 先用明確的 url 測試，還沒存進 localStorage
      await API.pingUrl(url);
      // 連線成功才儲存
      saveUrl(url);
      saveBtn.textContent = '連線並開始使用 →';
      saveBtn.disabled = false;
      showApp();
    } catch (e) {
      saveBtn.textContent = '連線並開始使用 →';
      saveBtn.disabled = false;
      showErr(errEl, '連線失敗：' + (e.message || '未知錯誤') + '，請確認 URL 並重試');
    }
  });

  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });
}

/* ---- Re-config modal ---- */
function bindConfig() {
  const modal    = document.getElementById('configModal');
  const urlInput = document.getElementById('configUrl');
  const errEl    = document.getElementById('configError');
  const openBtn  = document.getElementById('btnOpenConfig');
  const closeBtn = document.getElementById('btnCloseConfig');
  const cancelBtn= document.getElementById('btnCancelConfig');
  const saveBtn  = document.getElementById('btnSaveConfig');

  openBtn.addEventListener('click', () => {
    urlInput.value = getUrl();
    errEl.hidden = true;
    modal.hidden = false;
  });
  const closeModal = () => { modal.hidden = true; };
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  saveBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    errEl.hidden = true;
    if (!url || !url.startsWith('https://script.google.com')) {
      showErr(errEl, 'URL 格式不正確'); return;
    }
    saveBtn.disabled = true;
    try {
      await API.pingUrl(url);
      saveUrl(url);
      closeModal();
      toast('連線成功，正在重新載入資料…', 'ok');
      await loadAll();
    } catch (e) {
      showErr(errEl, '連線失敗：' + e.message);
    }
    saveBtn.disabled = false;
  });
}

/* ---- App events (delegated) ---- */
function bindAppEvents() {
  const grid = document.getElementById('sectionsGrid');

  // 新增按鈕
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add');
    if (!btn) return;
    const cat = btn.dataset.cat;
    const inp = grid.querySelector(`.add-input[data-cat="${cat}"]`);
    const sel = grid.querySelector(`.pri-select[data-cat="${cat}"]`);
    addGoal(cat, inp.value, sel.value);
    inp.value = '';
    inp.focus();
  });

  // Enter 鍵新增
  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const inp = e.target.closest('.add-input');
    if (!inp) return;
    const cat = inp.dataset.cat;
    const sel = grid.querySelector(`.pri-select[data-cat="${cat}"]`);
    addGoal(cat, inp.value, sel.value);
    inp.value = '';
  });

  // Checkbox 勾選
  grid.addEventListener('change', e => {
    const cb = e.target.closest('.cb-input');
    if (!cb) return;
    const id = cb.id.replace('cb-', '');
    toggleComplete(id, cb.checked);
  });

  // 進度 slider（即時 UI + debounce sync）
  grid.addEventListener('input', e => {
    const slider = e.target.closest('.prog-slider');
    if (!slider) return;
    const id  = slider.dataset.id;
    const val = Number(slider.value);
    updateProgUI(id, val);
    clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => updateProgress(id, val), 600);
  });

  // 刪除按鈕
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-del');
    if (!btn) return;
    deleteGoal(btn.dataset.id);
  });
}

/* ---- Error helper ---- */
function showErr(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}
