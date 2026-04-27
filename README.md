# 🌸 V's 2026 Goal List — 部署 & 設定教學

完全免費、免 API Key、資料存在你自己的 Google Sheets。

---

## 📁 專案結構

```
v2026/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── store.js       # 常數、localStorage、工具函式
│   ├── api.js         # Google Sheets 串接
│   ├── render.js      # DOM 渲染
│   └── app.js         # 主邏輯 & 事件
├── apps-script/
│   └── Code.gs        # Google Apps Script 程式碼
└── README.md
```

---

## 🚀 步驟一：部署到 GitHub Pages

1. 到 GitHub 新增 Repository（例如 `v-2026-goals`）
2. 把 `index.html`、`css/`、`js/` 上傳到 **根目錄**（不要包在資料夾裡）
3. 進入 Settings → Pages → Deploy from a branch → `main` / `root` → Save
4. 幾分鐘後網址會是：`https://你的帳號.github.io/v-2026-goals/`

> `apps-script/` 資料夾不需要上傳到 GitHub，只是方便你存放備份用。

---

## 📊 步驟二：設定 Google Sheets + Apps Script

### 2-1. 建立試算表

1. 開 [Google Sheets](https://sheets.google.com) → 新增空白試算表
2. 命名隨意（例如「V's 2026 Goals」）
3. 不用做任何設定，Apps Script 會自動建立「主資料」分頁

### 2-2. 建立 Apps Script

1. 在試算表裡點選 **擴充功能** → **Apps Script**
2. 把 `apps-script/Code.gs` 的程式碼**完整貼入**（取代預設的 `function myFunction(){}`）
3. 按儲存（Ctrl+S 或 Cmd+S），專案名稱隨意

### 2-3. 部署為 Web App

1. 右上角 **部署** → **新增部署**
2. 部署類型點左上齒輪 → **網路應用程式**
3. 填入：
   - 說明：隨意（例如 `V goals v1`）
   - **執行身分：我**
   - **存取權限：任何人**（⚠️ 這步很重要！）
4. 按 **部署**，第一次會要求授權，選你的 Google 帳號 → 允許
5. 複製產生的 URL，格式長這樣：
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```

> ⚠️ **之後若修改了 Code.gs，需重新部署**：
> 部署 → 管理部署 → 找到你的部署 → 鉛筆圖示 → 版本選「新版本」→ 部署

### 2-4. 在網頁填入 URL

1. 打開你的 GitHub Pages 網址
2. 輸入框貼入剛才的 Web App URL
3. 按「連線並開始使用」
4. 連線成功後就可以正常使用！

---

## 📅 步驟三：設定月份自動備份（建議做）

每個月 1 號自動把當時所有資料備份成一個獨立分頁（如 `2026_3月`）。

1. 在 Apps Script 編輯器，點左側 ⏰ **觸發程序** 圖示
2. 右下角 **新增觸發程序**
3. 設定：
   | 欄位 | 設定值 |
   |------|--------|
   | 執行函式 | `runMonthlyBackup` |
   | 部署方式 | 主要 |
   | 事件來源 | 時間型觸發 |
   | 類型 | 每月計時器 |
   | 日期 | 每月 1 日 |
4. 儲存

這樣每月 1 號會自動在 Google Sheets 建立上個月的快照分頁，並設為「警告保護」，防止不小心修改。

---

## 🎨 修改樣式

所有樣式在 `css/style.css`，用 CSS 變數管理：

```css
:root {
  --petal-dark:   #d4849f;  /* 主要粉色 */
  --sky-dark:     #6fa8ce;  /* 藍色 */
  --sage-dark:    #5e9e72;  /* 綠色 */
  --amber-dark:   #c98a3e;  /* 橘黃色 */
}
```

改這幾個變數就能快速換色。

---

## ✨ 功能一覽

| 功能 | 說明 |
|------|------|
| 四大區塊 | 工作、成長、家庭、健康，每區獨立 |
| 新增目標 | 輸入名稱 + 優先順序，Enter 或點「新增」|
| Checkbox 完成 | 勾選後文字刪除線，滑出動畫後移到最底部 |
| 進度條 | 拖拉 slider，即時顯示 %，100% 時提示完成 |
| 🔴🟡🟢 優先順序 | 左側色條 + 徽章，新增時選擇 |
| 🎯 今日3件事 | 每天隨機從未完成目標選3個，顯示在頁面頂部 |
| ⏰ 7天提醒 | 超過7天未更新的目標顯示淡紅背景 |
| 📊 完成率 | 每個 section 右上角顯示 X / Y |
| 📱 RWD | 手機版單欄排列 |
| 💾 月份備份 | 每月自動快照一個分頁，設警告保護 |

---

## ❓ 常見問題

**Q: 連線失敗怎麼辦？**
A: 確認 Apps Script 部署的「存取權限」是「任何人」，且 URL 沒有多餘空白。

**Q: 修改了 Code.gs 但沒有生效？**
A: 修改後必須「新增部署」才會更新，舊的 URL 會繼續跑舊版本。

**Q: 在不同裝置使用？**
A: 每台裝置都要在設定畫面填入同一個 Web App URL，就能讀到同一份資料。

**Q: 備份分頁可以手動建嗎？**
A: 可以！在 Apps Script 編輯器執行 `runMonthlyBackup()` 即可立即觸發一次。

---

Made with 🌸 for V's 2026
