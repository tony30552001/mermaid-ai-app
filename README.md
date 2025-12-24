# Mermaid AI 智慧圖表生成器 (Mermaid AI Architect)

這是一個基於 React + Vite 開發的現代化 Web 應用程式，整合 Google Gemini AI 模型，協助使用者透過自然語言或圖片快速生成、編輯與管理 Mermaid.js 圖表。

## 🌟 主要功能特點 (Features)

### 🤖 AI 智慧生成與編輯
*   **文字轉圖表 (Text to Diagram)**：輸入自然語言描述（如「購物車結帳流程」），自動生成對應的 Mermaid 語法。
*   **圖片轉圖表 (Image to Diagram)**：上傳架構圖或是手繪草稿，AI 自動分析並轉換為 Mermaid 代碼。
*   **智慧對話編輯 (Conversational Editing)**：透過對話指令（如「把所有決策節點變成紅色」）直接調整圖表內容。
*   **一鍵語法修復 (Auto-Fix)**：遇到 Mermaid 語法錯誤時，提供「讓 AI 修復」按鈕，自動診斷並修正代碼。

### 🎨 強大的圖表編輯器
*   **即時預覽 (Real-time Preview)**：左側編輯代碼，右側即時渲染。
*   **多種圖表類型支援**：支援 Flowchart, Sequence, Class, State, ER, Gantt, Mindmap, User Journey, Architecture (Beta) 等多種圖表。
*   **豐富的範本庫**：內建各類圖表的優質 Prompt 範本，點擊即可套用。

### 🖼️ 互動式預覽與檢視
*   **平移與縮放 (Pan & Zoom)**：支援滑鼠滾輪縮放 (Mouse Wheel Zoom) 與抓手模式 (Panning)，輕鬆檢視大型圖表。
*   **全螢幕模式 (Fullscreen)**：提供沈浸式的全螢幕預覽體驗。
*   **行動裝置最佳化 (Responsive Design)**：針對手機版面特別優化，提供編輯器/預覽切換模式，解決小螢幕操作痛點。
*   **多樣化主題 (Themes)**：內建 Default, Neutral, Dark, Forest, Base 等多種配色主題。

### 💾 工作區管理 (Workspace)
*   **本機儲存 (Local Storage)**：將生成的圖表儲存於瀏覽器 LocalStorage，無需伺服器即可持久化保存。
*   **圖表管理**：
    *   **命名與重新命名**：自訂圖表名稱。
    *   **分類標籤**：列表自動顯示圖表類型標籤（如「流程圖」）。
    *   **載入與刪除**：隨時載入舊檔進行編輯或刪除不再需要的圖表。

### 🔒 身份驗證與安全
*   **雙重 SSO 支援**：
    *   **Microsoft Entra ID**：企業級登入整合。
    *   **Google Sign-In**：便捷的 Google 帳號登入。
*   **環境變數保護**：API Key 與 Client ID 透過 `.env` 管理。

### 📤 匯出功能
*   支援將圖表匯出為高解析度的 **PNG**, **JPG** 圖片或向量格式 **SVG**。

---

## 🛠️ 技術堆疊 (Tech Stack)

*   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **AI Model**: Google Gemini 1.5 Flash (via `import.meta.env.VITE_GEMINI_API_KEY`)
*   **Diagramming**: [Mermaid.js](https://mermaid.js.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Auth**: 
    *   `@azure/msal-react` (Microsoft)
    *   `@react-oauth/google` (Google)

## 🚀 快速開始 (Getting Started)

### 1. 安裝依賴
```bash
npm install
```

### 2. 設定環境變數
請在專案根目錄建立 `.env` 檔案，並填入以下資訊：
```env
# Google Gemini API Key (必要)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 預設使用模型 (建議使用 gemini-1.5-flash)
VITE_GEMINI_MODEL=gemini-1.5-flash

# Authentication (視需求配置)
VITE_ENTRA_CLIENT_ID=your_microsoft_entra_client_id
VITE_ENTRA_TENANT_ID=your_microsoft_entra_tenant_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

## 📱 手機版操作指南
本應用程式針對行動裝置 (Mobile) 進行了特別優化：
*   **預覽模式切換**：在手機上生成圖表後，會自動切換至全螢幕預覽。
*   **懸浮按鈕**：右下角提供「編輯/預覽」切換按鈕。
*   **縮放手勢**：支援雙指縮放或使用介面上的 `+` / `-` 按鈕。

---
**Mermaid AI Tool** - 讓圖表製作變得簡單、智慧、高效。
