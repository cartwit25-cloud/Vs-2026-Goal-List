/* =====================================================
   store.js — 狀態管理 & localStorage
===================================================== */

const STORE_KEY   = 'v2026_goals';
const URL_KEY     = 'v2026_url';
const TODAY_KEY   = 'v2026_today';
const TODAY_DATE_KEY = 'v2026_today_date';

const CATEGORIES = ['工作', '成長', '家庭', '健康'];
const CAT_EMOJI  = { '工作': '💼', '成長': '🌱', '家庭': '🏠', '健康': '🏃' };
const PRIORITIES = ['高', '中', '低'];
const STALE_DAYS = 7;

/* ---- URL ---- */
function getUrl()       { return localStorage.getItem(URL_KEY) || ''; }
function saveUrl(url)   { localStorage.setItem(URL_KEY, url.trim()); }
function clearUrl()     { localStorage.removeItem(URL_KEY); }

/* ---- Goals (local cache) ---- */
function loadGoals() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
}
function saveGoals(goals) {
  localStorage.setItem(STORE_KEY, JSON.stringify(goals));
}

/* ---- ID / date helpers ---- */
function genId() {
  return 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}
function nowIso() { return new Date().toISOString(); }
function isStale(goal) {
  if (goal.completed) return false;
  const ref = goal.updated_at || goal.created_at;
  if (!ref) return false;
  return (Date.now() - new Date(ref)) / 86400000 >= STALE_DAYS;
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return diff + '天前';
  return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
}
function escHtml(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

/* ---- Today 3 picks (completely random, refreshed daily) ---- */
function getTodayPicks(goals) {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(TODAY_DATE_KEY);
  const savedIds  = JSON.parse(localStorage.getItem(TODAY_KEY) || '[]');
  const activeIds = goals.filter(g => !g.completed).map(g => g.id);

  if (savedDate === today) {
    // Validate saved picks still exist and are active
    const valid = savedIds.filter(id => activeIds.includes(id));
    if (valid.length === Math.min(3, activeIds.length)) return valid;
  }

  // Re-pick randomly
  const pool = [...activeIds].sort(() => Math.random() - .5);
  const picks = pool.slice(0, 3);
  localStorage.setItem(TODAY_KEY, JSON.stringify(picks));
  localStorage.setItem(TODAY_DATE_KEY, today);
  return picks;
}
