/* =====================================================
   api.js — Google Sheets Apps Script 串接
===================================================== */

const API = {

  // 測試連線 - 接受明確傳入的 url（用於設定時還沒儲存的情況）
  async pingUrl(url) {
    const res = await fetch(`${url}?action=ping`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || 'ping failed');
    return true;
  },

  // 測試連線 (ping) - 使用已儲存的 url
  async ping(url) {
    return this.pingUrl(url || getUrl());
  },

  // 讀取全部目標
  async getAll() {
    const url = getUrl();
    const res = await fetch(`${url}?action=getAll`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);
    return json.goals || [];
  },

  // 新增目標
  async add(goal) {
    return this._post({ action: 'add', goal });
  },

  // 更新目標（進度 / 完成狀態 / 任意欄位）
  async update(goal) {
    return this._post({ action: 'update', goal });
  },

  // 刪除目標
  async del(id) {
    return this._post({ action: 'delete', id });
  },

  async _post(body) {
    const url = getUrl();
    // Apps Script CORS: 必須用 text/plain，避免 preflight
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || 'server error');
    return json;
  },
};
