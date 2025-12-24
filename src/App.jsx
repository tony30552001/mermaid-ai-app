import React, { useState, useEffect, useRef } from 'react';
import { Play, PenTool, AlertTriangle, Wand2, Download, Copy, Check, RotateCcw, Loader2, Code, MessageSquarePlus, ChevronDown, ChevronRight, FileImage, FileCode, Sparkles, Link, ArrowRightLeft, MousePointerClick, X, Share2, Box, GitCommit, Database, BarChart, BrainCircuit, Map, PieChart, Clock, Layout, Palette, Layers, Target, Hand, Image as ImageIcon, Upload, Trash2, LogIn, LogOut, Maximize2, Minimize2 } from 'lucide-react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const aiModel = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.0-flash";

// --- Constants: Diagram Types ---
const DIAGRAM_TYPES = [
  { id: 'flowchart', label: '流程圖 (Flowchart)', icon: Share2, prompt: '使用 graph TD 或 graph LR' },
  { id: 'architecture', label: '架構圖 (Architecture)', icon: Layers, prompt: '使用 architecture-beta' }, // 修改為 architecture-beta
  { id: 'quadrant', label: '象限圖 (Quadrant)', icon: Target, prompt: '使用 quadrantChart' },
  { id: 'sequence', label: '循序圖 (Sequence)', icon: ArrowRightLeft, prompt: '使用 sequenceDiagram' },
  { id: 'class', label: '類別圖 (Class)', icon: Box, prompt: '使用 classDiagram' },
  { id: 'state', label: '狀態圖 (State)', icon: GitCommit, prompt: '使用 stateDiagram-v2' },
  { id: 'er', label: '實體關聯圖 (ER)', icon: Database, prompt: '使用 erDiagram' },
  { id: 'gantt', label: '甘特圖 (Gantt)', icon: BarChart, prompt: '使用 gantt' },
  { id: 'mindmap', label: '心智圖 (Mindmap)', icon: BrainCircuit, prompt: '使用 mindmap' },
  { id: 'journey', label: '使用者旅程 (Journey)', icon: Map, prompt: '使用 journey' },
  { id: 'pie', label: '圓餅圖 (Pie)', icon: PieChart, prompt: '使用 pie' },
  { id: 'timeline', label: '時間軸 (Timeline)', icon: Clock, prompt: '使用 timeline' },
];

// --- Constants: Themes ---
const THEMES = [
  { id: 'default', label: '預設 (Default)', color: 'bg-indigo-500' },
  { id: 'neutral', label: '簡約 (Neutral)', color: 'bg-slate-500' },
  { id: 'dark', label: '深色 (Dark)', color: 'bg-slate-900' },
  { id: 'forest', label: '森林 (Forest)', color: 'bg-emerald-600' },
  { id: 'base', label: '基本 (Base)', color: 'bg-white border border-slate-300' },
];

// --- Constants: High-Quality Example Prompts ---
const EXAMPLE_PROMPTS = {
  flowchart: `流程名稱：線上課程購買流程
1. 使用者瀏覽課程詳情
2. 點擊「立即購買」
3. 檢查是否登入
   - 未登入：跳轉登入頁 -> 登入成功 -> 返回購買頁
   - 已登入：進入結帳頁面
4. 選擇付款方式 (信用卡/LinePay)
5. 執行付款
   - 成功：開通課程權限 -> 寄送通知 -> 結束
   - 失敗：顯示錯誤訊息 -> 返回結帳頁`,

  architecture: `架構：雲端服務架構 (Architecture Beta)
1. group api(cloud)[API Services]
2. group db(database)[Data Storage]
3. service gateway(internet)[Gateway] in api
4. service server(server)[Backend API] in api
5. service redis(server)[Redis Cache] in db
6. service sql(database)[MySQL] in db
關係：
- gateway:R -- L:server
- server:B -- T:redis
- server:R -- L:sql`,

  quadrant: `主題：專案優先級分析矩陣
1. x-axis: 投入成本 (Low Cost --> High Cost)
2. y-axis: 預期效益 (Low Impact --> High Impact)
3. 象限定義：
   - quadrant-1: 重點策略 (High Impact, High Cost)
   - quadrant-2: 優先執行/速贏 (High Impact, Low Cost)
   - quadrant-3: 暫緩/棄置 (Low Impact, Low Cost)
   - quadrant-4: 避免/陷阱 (Low Impact, High Cost)
4. 資料點 (範圍 0.0 ~ 1.0)：
   - AI 客服系統: [0.3, 0.9]
   - 舊系統維護: [0.4, 0.2]
   - 全新雲端架構: [0.8, 0.8]
   - 節日行銷活動: [0.2, 0.6]`,

  sequence: `場景：ATM 提款流程
參與者：User(使用者), ATM(提款機), BankSystem(銀行主機)
1. User 插入提款卡 -> ATM
2. ATM 要求輸入密碼 -> User
3. User 輸入密碼 -> ATM
4. ATM 發送驗證請求 -> BankSystem
5. BankSystem 回傳驗證成功 -> ATM
6. User 輸入金額 -> ATM
7. ATM 請求扣款 -> BankSystem
8. BankSystem 確認餘額並扣款 -> ATM
9. ATM 吐鈔並列印收據 -> User`,

  class: `系統：圖書管理系統
1. Book (書本)
   - 屬性：title, isbn, author
   - 方法：borrow(), return()
2. Member (會員)
   - 屬性：name, memberId
   - 方法：register()
3. Librarian (管理員)
   - 繼承自 Member
   - 方法：addBook()
關係：Member "1" -- "0..*" Book : 借閱`,

  state: `物件：訂單狀態生命週期
1. 初始狀態：Pending (待付款)
2. 事件：付款成功 -> 轉移至 Processing (處理中)
3. 事件：付款失敗 -> 轉移至 Failed (失敗) -> 結束
4. 在 Processing 狀態：
   - 出貨 -> Shipped (已出貨)
   - 取消 -> Cancelled (已取消)
5. Shipped -> Delivered (已送達) -> 結束`,

  er: `系統：電子商務資料庫
1. Customer (客戶)：id, name, email
2. Order (訂單)：orderId, date, totalAmount
3. Product (產品)：productId, name, price
關係：
- Customer ||--o{ Order : "places" (一對多)
- Order }|--|{ Product : "contains" (多對多)`,

  gantt: `專案：網站改版計畫
日期格式：YYYY-MM-DD
1. 需求分析 : a1, 2024-01-01, 5d
2. UI 設計 : a2, after a1, 7d
3. 前端開發 : a3, after a2, 10d
4. 後端開發 : a4, after a2, 12d
5. 測試驗收 : a5, after a3, 5d`,

  mindmap: `中心主題：人工智慧 (AI)
1. 機器學習 (Machine Learning)
   - 監督式學習
   - 非監督式學習
   - 強化學習
2. 深度學習 (Deep Learning)
   - CNN (影像識別)
   - RNN (自然語言)
   - Transformer
3. 應用領域
   - 自駕車
   - 醫療診斷
   - 聊天機器人`,

  journey: `旅程：使用者網購體驗
評分範圍：1~5 (5最高)
1. 搜尋商品 : 5, 使用者, 方便快速
2. 比較價格 : 3, 使用者, 資訊混亂
3. 加入購物車 : 4, 使用者, 順暢
4. 結帳付款 : 2, 使用者, 步驟繁瑣
5. 等待收貨 : 4, 物流, 準時`,

  pie: `標題：2024年公司營收來源分佈
1. 軟體授權 : 45%
2. 顧問服務 : 25%
3. 硬體銷售 : 20%
4. 其他 : 10%`,

  timeline: `主題：網際網路發展史
1. 1969 : ARPANET 誕生
2. 1983 : TCP/IP 協定標準化
3. 1990 : World Wide Web (WWW) 提案
4. 1998 : Google 成立
5. 2004 : Facebook 上線
6. 2007 : iPhone 發表 (行動網路時代)`
};

// --- Helper: Format Prompt with Label ---
const formatPromptWithLabel = (typeId, content) => {
  const typeLabel = DIAGRAM_TYPES.find(t => t.id === typeId)?.label.split(' (')[0] || '';
  if (!content) return '';
  return `【範例：${typeLabel}】\n${content}`;
};

const INITIAL_PROMPT = formatPromptWithLabel('flowchart', EXAMPLE_PROMPTS.flowchart);

const INITIAL_CODE = `graph TD
    A[使用者瀏覽課程詳情] --> B[點擊立即購買]
    B --> C{檢查是否登入}
    C -- 未登入 --> D[跳轉登入頁]
    D --> D1[登入成功]
    D1 --> B
    C -- 已登入 --> E[進入結帳頁面]
    E --> F{選擇付款方式}
    F --> G[執行付款]
    G -- 成功 --> H[開通課程權限]
    H --> I[寄送通知]
    I --> J((結束))
    G -- 失敗 --> K[顯示錯誤訊息]
    K --> E`;

function UserProfile({ user }) {
  const name = user?.name || "使用者";
  const username = user?.username || "";
  const avatar = user?.avatar; // Put avatar URL here if available, or use initial

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-slate-700">{name}</span>
        <span className="text-[10px] text-slate-500">{username}</span>
      </div>
      {avatar ? (
        <img src={avatar} alt={name} className="w-8 h-8 rounded-full border border-indigo-200" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

function SignInButton({ onGoogleLoginSuccess }) {
  const { instance } = useMsal();

  // Microsoft Login
  const handleMicrosoftLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  // Google Login
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Use the access token to get user info if needed, or if configured for ID token, decode it.
      // But useGoogleLogin (implicit) gives access_token. We need to fetch user info.
      // Alternatively, use 'flow: "auth-code"' or just fetch userinfo endpoint.
      // For simplicity, let's just fetch user info with the token.
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        onGoogleLoginSuccess({
          name: userInfo.name,
          username: userInfo.email,
          avatar: userInfo.picture,
          provider: 'google'
        });
      } catch (error) {
        console.error("Google User Info Error:", error);
      }
    },
    onError: error => console.error("Google Login Failed:", error),
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wand2 className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Mermaid AI Architect</h1>
        <p className="text-slate-500 mb-8">請登入以使用 AI 圖表生成工具</p>

        <div className="space-y-3">
          <button
            onClick={handleMicrosoftLogin}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            使用 Microsoft 帳戶登入
          </button>

          <button
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-3 px-4 rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            使用 Google 帳戶登入
          </button>
        </div>
      </div>
    </div>
  );
}

function SignOutButton({ onLogout, provider }) {
  const { instance } = useMsal();

  const handleLogout = () => {
    if (provider === 'microsoft') {
      instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/"
      });
    } else if (provider === 'google') {
      googleLogout();
      onLogout(); // Clear local state
      window.location.reload(); // Force reload to clear any lingering state
    }
  };

  return (
    <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="登出">
      <LogOut className="w-4 h-4" />
    </button>
  );
}

function MainApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [mermaidCode, setMermaidCode] = useState(INITIAL_CODE);
  const [diagramType, setDiagramType] = useState('flowchart');

  // 圖片分析狀態
  const [showImageUpload, setShowImageUpload] = useState(false); // 新增：控制圖片上傳區塊的展開/收合
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef(null);

  // 風格狀態
  const [theme, setTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // AI 編輯指令狀態
  const [editInstruction, setEditInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);

  // 狀態管理
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [svgContent, setSvgContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [zoomInput, setZoomInput] = useState('100');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 互動狀態：平移 (Pan)
  const [isPanningTool, setIsPanningTool] = useState(true); // Default to true
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanDragging, setIsPanDragging] = useState(false);

  const mermaidRef = useRef(null);
  const containerRef = useRef(null);

  // --- 初始化 Mermaid ---
  useEffect(() => {
    const script = document.createElement('script');
    // 更新為 11.4.0 以支援 architecture-beta
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        securityLevel: 'loose',
        flowchart: { htmlLabels: false },
      });
      renderDiagram(mermaidCode);
    };
    document.body.appendChild(script);

    // Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // --- 監聽 Theme 變更並重新渲染 ---
  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        securityLevel: 'loose',
        flowchart: { htmlLabels: false },
      });
      renderDiagram(mermaidCode);
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => { renderDiagram(mermaidCode); }, 500);
    return () => clearTimeout(timer);
  }, [mermaidCode]);

  useEffect(() => {
    setZoomInput(Math.round(scale * 100).toString());
  }, [scale]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) setShowExportMenu(false);
      if (showThemeMenu && !event.target.closest('.theme-menu-container')) setShowThemeMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu, showThemeMenu]);

  // --- 圖片處理邏輯 ---
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setShowImageUpload(true); // 上傳後自動展開
        analyzeImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- AI API 呼叫 ---
  const callGemini = async (systemPrompt, userMessage, imageBase64 = null) => {
    try {
      const parts = [{ text: userMessage }];
      if (imageBase64) {
        const base64Data = imageBase64.split(',')[1];
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );
      if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("無法從 AI 獲取回應");
      return text;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // --- 分析圖片功能 ---
  const analyzeImage = async (imageData) => {
    setIsAnalyzingImage(true);
    setRenderError(null);
    const systemPrompt = `你是一個專業的圖表分析師。請分析這張圖片的內容，將其轉換為生成 Mermaid 圖表所需的詳細文字描述。
    
    你的任務：
    1. 識別圖片中最適合的 Mermaid 圖表類型（例如：流程圖、循序圖、心智圖、架構圖等）。
    2. 用繁體中文詳細描述圖片中的所有節點、文字、連結關係和邏輯流程。
    3. 輸出格式必須包含兩部分：
       TYPE: [英文圖表類型ID]
       DESC: [詳細描述]
    
    圖表類型ID參考：flowchart, sequence, class, state, er, gantt, mindmap, journey, pie, timeline, quadrant, architecture。
    `;
    try {
      const result = await callGemini(systemPrompt, "請分析這張圖片", imageData);
      const typeMatch = result.match(/TYPE:\s*(\w+)/i);
      const descMatch = result.match(/DESC:\s*([\s\S]*)/i);
      if (typeMatch && typeMatch[1]) {
        const detectedType = typeMatch[1].toLowerCase();
        const validTypes = DIAGRAM_TYPES.map(t => t.id);
        if (validTypes.includes(detectedType)) {
          setDiagramType(detectedType);
        } else if (detectedType.includes('flow')) {
          setDiagramType('flowchart');
        }
      }
      if (descMatch && descMatch[1]) {
        setPrompt(descMatch[1].trim());
      } else {
        setPrompt(result.replace(/TYPE:.*?\n/, '').trim());
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setRenderError(`圖片分析失敗: ${errorMsg}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // --- 重設功能 ---
  const handleReset = () => {
    if (window.confirm('確定要清空所有內容並重新開始嗎？目前的描述與圖片將會被移除。')) {
      setDiagramType('flowchart');
      setPrompt('');
      setMermaidCode('');
      setEditInstruction('');
      setSelectedImage(null);
      setShowImageUpload(false);
      setRenderError(null);
      setSvgContent('');
      setScale(1);
      setPan({ x: 0, y: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- 生成圖表 ---
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setRenderError(null);

    const selectedTypeInfo = DIAGRAM_TYPES.find(t => t.id === diagramType) || DIAGRAM_TYPES[0];
    const systemPrompt = `你是一個精通 Mermaid.js 的圖表專家。請根據使用者的描述，生成有效的 Mermaid 語法代碼。
    
    規則：
    1. 使用者希望生成【${selectedTypeInfo.label}】。
    2. 請務必${selectedTypeInfo.prompt} 開頭。
    3. 只回傳 Code，不包含解釋。不要使用 markdown code block 符號。
    4. 【完整性】確保生成的代碼包含完整的流程，不要遺漏步驟。
    5. 確保中文 ID 處理正確 (例如使用 id["中文名稱"])。
    6. 若是心智圖(mindmap)或甘特圖(gantt)，請確保縮排格式正確。`;

    try {
      let code = await callGemini(systemPrompt, prompt);
      code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      setMermaidCode(code);
      setActiveTab('edit');

      if (['flowchart', 'er', 'class', 'architecture', 'quadrant'].includes(diagramType)) {
        setScale(1);
      } else if (['timeline', 'gantt'].includes(diagramType)) {
        setScale(3);
      } else {
        setScale(2);
      }
      setPan({ x: 0, y: 0 });

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setRenderError(`生成失敗: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFix = async () => {
    if (!renderError) return;
    setIsFixing(true);

    const selectedTypeInfo = DIAGRAM_TYPES.find(t => t.id === diagramType) || DIAGRAM_TYPES[0];

    // 強化 Prompt: 鎖定當前圖表類型
    const systemPrompt = `你是一個 Mermaid.js 除錯專家。請修復使用者提供的 Mermaid 代碼錯誤。
    
    重要規則：
    1. 必須維持原本的圖表類型：【${selectedTypeInfo.label}】。
    2. 請務必${selectedTypeInfo.prompt} 開頭或使用相關語法。
    3. 針對報錯訊息進行修復，若語法不支援該圖表類型，請改寫為該類型支援的語法。
    4. 只回傳 Code，不包含解釋。`;

    const userMessage = `目前代碼：\n${mermaidCode}\n\n錯誤訊息：\n${renderError}`;
    try {
      let fixedCode = await callGemini(systemPrompt, userMessage);
      fixedCode = fixedCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      setMermaidCode(fixedCode);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFixing(false);
    }
  };

  const handleAiEdit = async () => {
    if (!editInstruction.trim()) return;
    setIsAiEditing(true);
    const systemPrompt = `你是一個 Mermaid.js 編輯助手。請根據指令修改代碼。只回傳代碼。`;
    const userMessage = `原始代碼：\n${mermaidCode}\n\n指令：\n${editInstruction}`;
    try {
      let code = await callGemini(systemPrompt, userMessage);
      code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      setMermaidCode(code);
      setEditInstruction('');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setRenderError(errorMsg);
    } finally {
      setIsAiEditing(false);
    }
  };

  const renderDiagram = async (code) => {
    if (!window.mermaid) return;
    if (!code.trim()) {
      setSvgContent('');
      setRenderError(null);
      return;
    }
    try {
      try { await window.mermaid.parse(code); } catch (e) { throw new Error(e.message || "Mermaid 語法解析失敗"); }
      const id = `mermaid-diagram-${Date.now()}`;
      const { svg } = await window.mermaid.render(id, code);
      setSvgContent(svg);
      setRenderError(null);
    } catch (error) {
      console.error("Render Error:", error);
      const errorMsg = error instanceof Error ? error.message : "圖表渲染失敗。";
      setRenderError(errorMsg);
    }
  };

  const handleTypeSelect = (typeId) => {
    setDiagramType(typeId);
    if (!prompt || prompt.startsWith('【範例')) {
      setPrompt(formatPromptWithLabel(typeId, EXAMPLE_PROMPTS[typeId] || ''));
    }
  };

  // UI Handlers
  const handleZoomCommit = () => {
    let val = parseInt(zoomInput, 10);
    if (isNaN(val)) val = Math.round(scale * 100);
    if (val < 10) val = 10; if (val > 500) val = 500;
    setScale(val / 100); setZoomInput(val.toString());
  };
  const handleResetView = () => { setScale(1); setPan({ x: 0, y: 0 }); };
  const handleCanvasMouseDown = (e) => { if (isPanningTool) { setIsPanDragging(true); e.preventDefault(); } };
  const handleCanvasMouseMove = (e) => { if (isPanDragging) setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY })); };
  const handleCanvasMouseUp = () => setIsPanDragging(false);
  const handleCanvasMouseLeave = () => setIsPanDragging(false);

  // Wheel Zoom Logic
  // Wheel Zoom Logic (Native Event Handler for better control)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const zoomStep = 0.2;
        setScale(prevScale => {
          const newScale = Math.min(5, Math.max(0.1, prevScale + (direction * zoomStep)));
          return parseFloat(newScale.toFixed(2));
        });
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Download Functions
  const downloadSVG = () => { if (!svgContent) return; const blob = new Blob([svgContent], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'diagram.svg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); setShowExportMenu(false); };
  const downloadImage = (fmt) => {
    if (!svgContent || !mermaidRef.current) return; const svgEl = mermaidRef.current.querySelector('svg'); if (!svgEl) return;
    const bbox = svgEl.getBBox(); const w = bbox.width; const h = bbox.height; const cloned = svgEl.cloneNode(true); cloned.setAttribute('width', w); cloned.setAttribute('height', h); cloned.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
    const svgStr = new XMLSerializer().serializeToString(cloned); const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas'); cvs.width = w * 3; cvs.height = h * 3; const ctx = cvs.getContext('2d'); ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff'; ctx.fillRect(0, 0, cvs.width, cvs.height); ctx.scale(3, 3); ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement('a'); a.href = cvs.toDataURL(`image/${fmt}`); a.download = `diagram.${fmt}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); setShowExportMenu(false);
    }; img.src = url;
  };
  const copyToClipboard = () => { const ta = document.createElement("textarea"); ta.value = mermaidCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden text-slate-800" style={{ fontFamily: '"Roboto Flex", "Noto Sans TC", sans-serif' }}>
      {/* Header */}
      <header id="main-header" className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg"><Wand2 className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mermaid AI Architect</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://mermaid.js.org/intro/" target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline hidden md:block">語法參考</a>
          <UserProfile user={user} />
          <SignOutButton onLogout={onLogout} provider={user?.provider} />
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
        {/* Left Panel */}
        <div id="main-sidebar" className={`w-full md:w-1/3 flex flex-col border-r border-slate-200 bg-white h-full shadow-lg z-10 transition-all duration-300 ${isFullscreen ? 'hidden' : ''}`}>
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button onClick={() => setActiveTab('generate')} className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'generate' ? 'text-indigo-600 bg-white shadow-inner border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <MessageSquarePlus className="w-4 h-4" /> AI 生成
            </button>
            <button onClick={() => setActiveTab('edit')} className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'edit' ? 'text-indigo-600 bg-white shadow-inner border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Code className="w-4 h-4" /> 程式碼編輯 {renderError && <span className="w-2 h-2 rounded-full bg-red-500 ml-1 animate-pulse" />}
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* Generate Tab */}
            <div className={`absolute inset-0 flex flex-col p-4 transition-opacity duration-200 ${activeTab === 'generate' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>

              {/* Image Upload Toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${showImageUpload ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>圖片轉圖表 (選填)</span>
                    {selectedImage && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已上傳</span>}
                  </div>
                  {showImageUpload ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showImageUpload && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[100px] group
                        ${selectedImage ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                      onClick={() => !selectedImage && fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />

                      {isAnalyzingImage ? (
                        <div className="flex flex-col items-center text-indigo-600">
                          <Loader2 className="w-6 h-6 animate-spin mb-2" />
                          <span className="text-xs font-medium">AI 正在分析圖片內容...</span>
                        </div>
                      ) : selectedImage ? (
                        <div className="w-full relative group">
                          <img src={selectedImage} alt="Uploaded" className="max-h-[120px] mx-auto rounded shadow-sm object-contain" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                            title="移除圖片"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-indigo-500" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">點擊或拖曳圖片至此</p>
                          <p className="text-[10px] text-slate-400 mt-1">支援白板草圖、截圖或手繪稿</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Diagram Type Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Layout className="w-4 h-4" /> 選擇圖表類型
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                  {DIAGRAM_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border text-[10px] font-medium transition-all text-center
                          ${diagramType === type.id
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate w-full">{type.label.split(' (')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 pt-4">
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1 flex-shrink-0">
                  <PenTool className="w-4 h-4" /> 描述流程或需求
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`請描述您的需求...`}
                  className="flex-1 w-full p-4 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50 leading-relaxed font-mono placeholder:text-slate-400"
                />
              </div>
              <div className="mt-4 flex-shrink-0 flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center justify-center"
                  title="重設所有內容"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={handleGenerate} disabled={isGenerating || (!prompt.trim() && !selectedImage)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg ${isGenerating || (!prompt.trim() && !selectedImage) ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}>
                  {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /> 生成中...</>) : (<><Play className="w-5 h-5 fill-current" /> 生成</>)}
                </button>
              </div>
            </div>

            {/* Edit Tab */}
            <div className={`absolute inset-0 flex flex-col p-4 transition-opacity duration-200 ${activeTab === 'edit' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="mb-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex-shrink-0">
                <label className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI 智慧修改</label>
                <div className="flex flex-col gap-2">
                  <textarea value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiEdit(); } }} placeholder="例如：把 '結帳' 節點改成紅色..." className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-y" />
                  <div className="flex justify-end"><button onClick={handleAiEdit} disabled={isAiEditing || !editInstruction.trim()} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">{isAiEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : '修改'}</button></div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <label className="text-sm font-medium text-slate-700">Mermaid Source Code</label>
                <button onClick={copyToClipboard} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">{isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {isCopied ? "已複製" : "複製"}</button>
              </div>
              <div className="flex-1 relative min-h-0 border rounded-lg overflow-hidden shadow-inner">
                <textarea value={mermaidCode} onChange={(e) => setMermaidCode(e.target.value)} className="absolute inset-0 w-full h-full p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset resize-none bg-slate-900 text-slate-100" spellCheck="false" />
              </div>
              {renderError && (
                <div className="mt-3 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <div className="flex items-start gap-2 text-red-700 text-xs max-h-24 overflow-y-auto"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span className="break-all font-mono">{renderError}</span></div>
                    <button onClick={handleFix} disabled={isFixing} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-md shadow-sm">{isFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} 讓 AI 修復</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div
          className={`w-full ${isFullscreen ? 'fixed inset-0 z-50' : 'md:w-2/3'} bg-slate-100 relative overflow-hidden flex flex-col h-full transition-all duration-300`}
          id="print-container"
          ref={containerRef}
          onWheel={undefined} // Handled by useEffect
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10 pointer-events-none">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2" title={isFullscreen ? "退出全螢幕" : "全螢幕預覽"}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsPanningTool(!isPanningTool)} className={`pointer-events-auto backdrop-blur shadow-sm border px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isPanningTool ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-100' : 'bg-white/90 border-slate-200 text-slate-700 hover:text-indigo-600'}`} title="抓手模式"><Hand className="w-4 h-4" /></button>
            <div className="relative pointer-events-auto theme-menu-container">
              <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Palette className="w-4 h-4" /><ChevronDown className={`w-3 h-3 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} /></button>
              {showThemeMenu && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">{THEMES.map((t) => (<button key={t.id} onClick={() => { setTheme(t.id); setShowThemeMenu(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 ${theme === t.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'}`}><span className={`w-3 h-3 rounded-full shadow-sm border border-black/10 ${t.color}`}></span>{t.label.split(' (')[0]}{theme === t.id && <Check className="w-3 h-3 ml-auto" />}</button>))}</div>}
            </div>
            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg p-1 flex items-center gap-1 pointer-events-auto">
              <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">-</button>
              <div className="w-14 relative flex items-center justify-center"><input type="text" value={zoomInput} onChange={(e) => setZoomInput(e.target.value)} onBlur={handleZoomCommit} onKeyDown={(e) => e.key === 'Enter' && handleZoomCommit()} className="w-full text-center text-xs font-medium text-slate-600 bg-transparent focus:outline-none focus:bg-slate-50 rounded px-1 py-0.5" /><span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span></div>
              <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">+</button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button onClick={handleResetView} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"><RotateCcw className="w-4 h-4" /></button>
            </div>
            <div className="relative pointer-events-auto export-menu-container">
              <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!svgContent} className={`bg-indigo-600 shadow-md border border-transparent text-white hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${showExportMenu ? 'ring-2 ring-indigo-300' : ''}`}><Download className="w-4 h-4" /> 匯出 <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} /></button>
              {showExportMenu && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right"><button onClick={() => downloadImage('png')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><FileImage className="w-4 h-4 text-green-600" /> 匯出 PNG</button><button onClick={() => downloadImage('jpg')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><FileImage className="w-4 h-4 text-blue-600" /> 匯出 JPG</button><button onClick={downloadSVG} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><FileCode className="w-4 h-4 text-orange-600" /> 匯出 SVG</button></div>}
            </div>
          </div>

          <div
            onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseLeave}
            className={`flex-1 overflow-auto transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] bg-slate-50'} relative ${isPanningTool ? (isPanDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          >
            {isAiEditing && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center text-indigo-600 pointer-events-none"><Loader2 className="w-10 h-10 animate-spin mb-2" /><span className="font-semibold animate-pulse">AI 正在調整架構中...</span></div>}
            <div className="min-w-full min-h-full flex p-8 relative">
              {renderError ? (
                <div className="m-auto flex flex-col items-center justify-center max-w-md w-full bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-red-100 text-center animate-in fade-in zoom-in-95 duration-300 z-30">
                  <div className="bg-red-100 p-3 rounded-full mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">無法渲染圖表</h3>
                  <p className="text-sm text-slate-500 mb-4">檢測到 Mermaid 語法錯誤，無法顯示預覽。</p>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded p-3 mb-6 text-left max-h-32 overflow-y-auto"><code className="text-xs font-mono text-red-600 break-all">{renderError}</code></div>
                  <button onClick={handleFix} disabled={isFixing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">{isFixing ? <><Loader2 className="w-5 h-5 animate-spin" /> AI 正在修復中...</> : <><Sparkles className="w-5 h-5" /> 一鍵智慧修復</>}</button>
                </div>
              ) : !mermaidCode.trim() ? (
                <div className="m-auto flex flex-col items-center justify-center text-slate-400">
                  <div className="w-24 h-24 bg-slate-200/50 rounded-full flex items-center justify-center mb-4">
                    <Layout className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-500 mb-1">尚未建立圖表</h3>
                  <p className="text-sm">請在左側輸入描述或選擇範例開始</p>
                </div>
              ) : (
                <div id="print-content" ref={mermaidRef} className="m-auto transition-transform duration-75 ease-linear origin-top-left select-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }} dangerouslySetInnerHTML={{ __html: svgContent }} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const isMsalAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const [googleUser, setGoogleUser] = useState(null);

  // Unified User State
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isMsalAuthenticated && accounts.length > 0) {
      setCurrentUser({
        name: accounts[0].name,
        username: accounts[0].username,
        provider: 'microsoft'
      });
    } else if (googleUser) {
      setCurrentUser(googleUser);
    } else {
      setCurrentUser(null);
    }
  }, [isMsalAuthenticated, accounts, googleUser]);

  const handleGoogleLoginSuccess = (user) => {
    setGoogleUser(user);
    // You might want to persist this to localStorage for persistence across reloads
  };

  const handleLogout = () => {
    setGoogleUser(null);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <SignInButton onGoogleLoginSuccess={handleGoogleLoginSuccess} />;
  }

  return <MainApp user={currentUser} onLogout={handleLogout} />;
}