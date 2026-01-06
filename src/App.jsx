import React, { useState, useEffect, useRef } from 'react';
import { Play, PenTool, AlertTriangle, Wand2, Download, Copy, Check, RotateCcw, Loader2, Code, MessageSquarePlus, ChevronDown, ChevronRight, FileImage, FileCode, Sparkles, Link, ArrowRightLeft, MousePointerClick, X, Share2, Box, GitCommit, Database, BarChart, BrainCircuit, Map, PieChart, Clock, Layout, Palette, Layers, Target, Hand, Image as ImageIcon, Upload, Trash2, LogIn, LogOut, Maximize2, Minimize2, Save, FolderOpen, Edit2, Eye } from 'lucide-react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const aiModel = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

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
  { id: 'default', label: '預設 (Default)', color: 'bg-indigo-500', look: 'classic' },
  { id: 'neutral', label: '簡約 (Neutral)', color: 'bg-slate-500', look: 'classic' },
  { id: 'dark', label: '深色 (Dark)', color: 'bg-slate-900', look: 'classic' },
  { id: 'forest', label: '森林 (Forest)', color: 'bg-emerald-600', look: 'classic' },
  { id: 'base', label: '基本 (Base)', color: 'bg-white border border-slate-300', look: 'classic' },
  { id: 'handDrawn', label: '✏️ 手繪風格 (Hand-Drawn)', color: 'bg-amber-100 border border-amber-400', look: 'handDrawn', baseTheme: 'neutral' },
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
  const avatar = user?.avatar;

  return (
    <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-slate-200">
      <div className="hidden sm:flex flex-col items-end">
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Mermaid Flow</h1>
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

  // 圖表類型選單狀態
  const [showTypeSelector, setShowTypeSelector] = useState(false); // 預設收合
  const [typeSelectorHeight, setTypeSelectorHeight] = useState(120);
  const [isResizingSelector, setIsResizingSelector] = useState(false);
  const selectorRef = useRef(null);

  // 底部抽屜狀態 (手機版選項面板)
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setIsResizingSelector(false);
    const handleMouseMove = (e) => {
      if (isResizingSelector) {
        const newHeight = e.clientY - selectorRef.current.getBoundingClientRect().top;
        setTypeSelectorHeight(Math.max(60, Math.min(400, newHeight)));
      }
    };

    if (isResizingSelector) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isResizingSelector]);

  // 風格狀態
  const [theme, setTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // AI 編輯指令狀態
  const [editInstruction, setEditInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);

  // 工作區狀態 (Workspace)
  const [savedDiagrams, setSavedDiagrams] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('mermaid_workspace');
    if (saved) {
      try {
        setSavedDiagrams(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse workspace data", e);
      }
    }
  }, []);

  const saveToWorkspace = (e) => {
    e?.preventDefault(); // 防止可能的表單提交或頁面重整
    const name = window.prompt("請為此圖表命名：", `未命名圖表 ${new Date().toLocaleDateString()}`);
    if (name) {
      const newDiagram = {
        id: Date.now(),
        name,
        code: mermaidCode,
        type: diagramType,
        updatedAt: new Date().toISOString()
      };

      setSavedDiagrams(prev => {
        const newSaved = [newDiagram, ...prev];
        localStorage.setItem('mermaid_workspace', JSON.stringify(newSaved));
        return newSaved;
      });

      setActiveTab('workspace'); // Auto switch to workspace
    }
  };

  const loadFromWorkspace = (diagram) => {
    if (window.confirm(`確定要載入「${diagram.name}」嗎？目前的內容將被覆蓋。`)) {
      setMermaidCode(diagram.code);
      setDiagramType(diagram.type || 'flowchart');
      setPrompt('');
      setActiveTab('edit');
      // If mobile, switch to preview or remain in edit? Maybe edit to see code first.
      if (window.innerWidth < 768) setIsMobilePreview(false);
    }
  };

  const deleteFromWorkspace = (id) => {
    if (window.confirm("確定要刪除此圖表嗎？此動作無法復原。")) {
      const newSaved = savedDiagrams.filter(d => d.id !== id);
      setSavedDiagrams(newSaved);
      localStorage.setItem('mermaid_workspace', JSON.stringify(newSaved));
    }
  };

  const renameInWorkspace = (id, oldName) => {
    const newName = window.prompt("請輸入新的圖表名稱：", oldName);
    if (newName && newName !== oldName) {
      setSavedDiagrams(prev => {
        const newSaved = prev.map(d => d.id === id ? { ...d, name: newName, updatedAt: new Date().toISOString() } : d);
        localStorage.setItem('mermaid_workspace', JSON.stringify(newSaved));
        return newSaved;
      });
    }
  };

  // 狀態管理
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [svgContent, setSvgContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [zoomInput, setZoomInput] = useState('100');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 分享郵件狀態
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    to: '',
    cc: '',
    subject: '',
    body: ''
  });

  // 互動狀態：平移 (Pan)
  const [isPanningTool, setIsPanningTool] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanDragging, setIsPanDragging] = useState(false);

  // Mobile View State
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mermaidRef = useRef(null);

  // Touch Handling Ref
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const lastPinchDistRef = useRef(null);
  const startScaleRef = useRef(1);

  useEffect(() => {
    const script = document.createElement('script');
    // 更新為 11.4.0 以支援 architecture-beta
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      const currentTheme = THEMES.find(t => t.id === theme);
      const mermaidTheme = currentTheme?.baseTheme || theme;
      const lookStyle = currentTheme?.look || 'classic';

      window.mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        look: lookStyle,
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
      const currentTheme = THEMES.find(t => t.id === theme);
      const mermaidTheme = currentTheme?.baseTheme || theme;
      const lookStyle = currentTheme?.look || 'classic';

      window.mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        look: lookStyle,
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

      if (!apiKey) {
        throw new Error("未設定 Gemini API Key。請檢查環境變數 VITE_GEMINI_API_KEY。");
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
    5. 【節點 ID 規範】使用簡單的英文數字作為 ID (如 node1, A, B)，必免使用中文或特殊符號作為 ID。將顯示文字放在括號內，例如 node1["中文顯示文字"]。
    6. 【字元轉義】顯示文字若包含標點符號，請務必使用雙引號包覆，例如 id["Text (with) brackets"]。
    7. 【禁用語法】不要使用 click 事件，避免過於深層的 subgraph 嵌套。
    8. 若是心智圖(mindmap)或甘特圖(gantt)，請確保縮排格式正確。`;

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
      // Mobile: Switch to preview after generation
      if (window.innerWidth < 768) setIsMobilePreview(true);
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
    4. 【節點 ID 與轉義】確保 ID 為英文數字，中文顯示文字必須用雙引號包起來，例如 A["中文內容"]。
    5. 只回傳 Code，不包含解釋。`;

    const userMessage = `目前代碼：\n${mermaidCode}\n\n錯誤訊息：\n${renderError}`;
    try {
      let fixedCode = await callGemini(systemPrompt, userMessage);
      fixedCode = fixedCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      setMermaidCode(fixedCode);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFixing(false);
      // Mobile: Switch to preview after fix
      if (window.innerWidth < 768) setIsMobilePreview(true);
    }
  };

  const handleAiEdit = async () => {
    if (!editInstruction.trim()) return;
    setIsAiEditing(true);
    const systemPrompt = `你是一個 Mermaid.js 編輯助手。請根據指令修改代碼。只回傳代碼。
    規則：
    1. 保持 ID 為簡單英文數字，顯示內容用雙引號包覆。
    2. 確保語法正確性，避免不支援的特殊符號。`;
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

  // Touch Handlers for Mobile Panning
  // Touch Handlers for Mobile Panning & Zooming
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleCanvasTouchStart = (e) => {
    // 單指拖曳
    if (e.touches.length === 1 && isPanningTool) {
      setIsPanDragging(true);
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    // 雙指縮放
    else if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      lastPinchDistRef.current = dist;
      startScaleRef.current = scale;
      setIsPanDragging(false); // 縮放時取消拖曳狀態，避免衝突
    }
  };

  const handleCanvasTouchMove = (e) => {
    // 雙指縮放 (優先處理)
    if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const dist = getTouchDist(e.touches);
      if (lastPinchDistRef.current > 0) {
        const zoomFactor = dist / lastPinchDistRef.current;
        const newScale = Math.min(5, Math.max(0.1, startScaleRef.current * zoomFactor));
        setScale(newScale);
      }
    }
    // 單指拖曳
    else if (e.touches.length === 1 && isPanDragging) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchRef.current.x;
      const dy = touch.clientY - lastTouchRef.current.y;

      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleCanvasTouchEnd = () => setIsPanDragging(false);

  // Add non-passive touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => handleCanvasTouchStart(e);
    const onTouchMove = (e) => handleCanvasTouchMove(e);
    const onTouchEnd = (e) => handleCanvasTouchEnd(e);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPanningTool, isPanDragging]);

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

  // --- AI 產生圖表標題 ---
  const generateDiagramTitle = async () => {
    if (!mermaidCode.trim()) return 'mermaid-diagram';
    try {
      const systemPrompt = `你是一個檔案命名專家。請根據 Mermaid 圖表代碼，產生一個簡短貼切的標題作為檔名。
規則：
1. 使用繁體中文
2. 最多 8 個字
3. 要能概括圖表的核心主題
4. 不要使用標點符號或特殊字元
5. 只回傳標題文字，不要任何解釋`;
      const title = await callGemini(systemPrompt, mermaidCode);
      // 清理標題：移除換行、空白、特殊字元
      const cleanTitle = title.trim()
        .replace(/[\n\r]/g, '')
        .replace(/[\\/:*?"<>|]/g, '')
        .substring(0, 20);
      return cleanTitle || 'mermaid-diagram';
    } catch (e) {
      console.warn('AI 標題產生失敗，使用預設檔名', e);
      return 'mermaid-diagram';
    }
  };

  // Download Functions
  const downloadSVG = async () => {
    if (!svgContent) return;
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const title = await generateDiagramTitle();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };
  const downloadImage = async (fmt) => {
    if (!svgContent || !mermaidRef.current) return;
    const svgEl = mermaidRef.current.querySelector('svg');
    if (!svgEl) return;

    setShowExportMenu(false);
    setIsExporting(true);

    // 先取得 AI 標題
    const title = await generateDiagramTitle();

    // Helper: 內嵌所有樣式到 SVG
    const inlineStyles = (svgElement) => {
      const cloned = svgElement.cloneNode(true);

      // 取得所有計算樣式並內嵌
      const allElements = cloned.querySelectorAll('*');
      allElements.forEach(el => {
        const computed = window.getComputedStyle(svgElement.querySelector(`#${el.id}`) || el);
        const importantStyles = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 'font-weight', 'opacity', 'transform'];
        importantStyles.forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value && value !== 'none' && value !== '') {
            el.style[prop] = value;
          }
        });
      });

      return cloned;
    };

    // Helper: 將 SVG 轉換為 Data URL (使用 Base64 編碼)
    const svgToDataUrl = (svgString) => {
      // 處理 Unicode 字元
      const encoded = encodeURIComponent(svgString)
        .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
      return 'data:image/svg+xml;base64,' + btoa(encoded);
    };

    // Helper to perform the actual export with a specific scale
    const exportWithScale = (scaleToUse) => {
      return new Promise((resolve, reject) => {
        try {
          // 1. Get bounds and clone
          const bbox = svgEl.getBBox();
          const w = bbox.width;
          const h = bbox.height;

          // 檢查 Canvas 大小限制 (大多數瀏覽器限制約 16384 或更小)
          const maxCanvasSize = 16384;
          const targetWidth = Math.ceil(w * scaleToUse);
          const targetHeight = Math.ceil(h * scaleToUse);

          if (targetWidth > maxCanvasSize || targetHeight > maxCanvasSize) {
            reject(new Error(`圖表尺寸過大 (${targetWidth}x${targetHeight})，超過瀏覽器限制`));
            return;
          }

          // 複製並處理 SVG
          const cloned = svgEl.cloneNode(true);
          cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
          cloned.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
          cloned.setAttribute('width', w);
          cloned.setAttribute('height', h);
          cloned.removeAttribute('style');
          cloned.removeAttribute('class');

          const bgColor = theme === 'dark' ? '#0f172a' : '#ffffff';

          // 在 SVG 中加入背景 rect
          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('x', bbox.x);
          bgRect.setAttribute('y', bbox.y);
          bgRect.setAttribute('width', bbox.width);
          bgRect.setAttribute('height', bbox.height);
          bgRect.setAttribute('fill', bgColor);
          cloned.insertBefore(bgRect, cloned.firstChild);

          // 移除可能造成跨域問題的元素
          const foreignObjects = cloned.querySelectorAll('foreignObject');
          foreignObjects.forEach(fo => fo.remove());

          // 移除外部圖片引用
          const images = cloned.querySelectorAll('image');
          images.forEach(img => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href');
            if (href && !href.startsWith('data:')) {
              img.remove();
            }
          });

          // 內嵌必要的字體樣式
          const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
          styleEl.textContent = `
            * { font-family: "Segoe UI", "Noto Sans TC", sans-serif !important; }
            text { font-family: "Segoe UI", "Noto Sans TC", sans-serif !important; }
          `;
          cloned.insertBefore(styleEl, cloned.firstChild);

          // 2. Serialize to Data URL
          const svgStr = new XMLSerializer().serializeToString(cloned);
          const dataUrl = svgToDataUrl(svgStr);

          // 3. Load Image (不設定 crossOrigin 因為是 data URL)
          const img = new Image();

          img.onload = () => {
            try {
              const cvs = document.createElement('canvas');
              cvs.width = targetWidth;
              cvs.height = targetHeight;
              const ctx = cvs.getContext('2d');

              if (!ctx) {
                throw new Error('無法建立 Canvas context');
              }

              // Fill Background (雙重保險)
              ctx.fillStyle = bgColor;
              ctx.fillRect(0, 0, cvs.width, cvs.height);

              // Draw
              ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

              // Export using toBlob for better memory handling
              cvs.toBlob((blob) => {
                if (!blob) {
                  reject(new Error('Canvas toBlob 失敗'));
                  return;
                }
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${title}.${fmt}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
                resolve();
              }, `image/${fmt === 'jpg' ? 'jpeg' : fmt}`, 0.95);

            } catch (err) {
              reject(err);
            }
          };

          img.onerror = (e) => {
            console.error('Image load error:', e);
            reject(new Error('圖片載入失敗'));
          };

          img.src = dataUrl;
        } catch (e) {
          reject(e);
        }
      });
    };

    // Retry Logic: Try 2x first, then 1x, then 0.5x
    exportWithScale(2)
      .catch((err) => {
        console.warn('Export at 2x failed, retrying at 1x...', err.message);
        return exportWithScale(1);
      })
      .catch((err) => {
        console.warn('Export at 1x failed, retrying at 0.5x...', err.message);
        return exportWithScale(0.5);
      })
      .catch((finalErr) => {
        console.error('Final Export Error:', finalErr);
        alert(`匯出失敗：${finalErr.message}\n\n建議方案：\n1. 嘗試下載 SVG 格式（無限制）\n2. 使用瀏覽器截圖功能\n3. 縮小圖表後重試`);
      })
      .finally(() => {
        setIsExporting(false);
      });
  };
  const copyToClipboard = () => { const ta = document.createElement("textarea"); ta.value = mermaidCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  // 分享郵件功能
  const openShareModal = async () => {
    setShowExportMenu(false);
    // 使用 AI 產生預設主旨
    const title = await generateDiagramTitle();
    const senderEmail = user?.username || user?.email || '';
    const senderName = user?.name || '使用者';
    setShareForm({
      to: '',
      cc: '',
      subject: `【Mermaid 圖表分享】${title}`,
      body: `您好，\n\n${senderName} 想與您分享一份 Mermaid 圖表。\n\n圖表已自動下載為 JPG 附件，請確認已附加至此郵件。\n\n---\n寄件人：${senderName}${senderEmail ? ` <${senderEmail}>` : ''}\n\n---\nMermaid 語法：\n${mermaidCode}\n\n此郵件由 Mermaid Flow 工具生成`
    });
    setShowShareModal(true);
  };

  const handleSendEmail = async () => {
    const { to, cc, subject, body } = shareForm;

    // 先下載 JPG 圖片
    if (svgContent && mermaidRef.current) {
      const svgEl = mermaidRef.current.querySelector('svg');
      if (svgEl) {
        try {
          // 取得 AI 標題作為檔名
          const title = await generateDiagramTitle();

          const bbox = svgEl.getBBox();
          const w = bbox.width;
          const h = bbox.height;

          const cloned = svgEl.cloneNode(true);
          cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          cloned.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
          cloned.setAttribute('width', w);
          cloned.setAttribute('height', h);

          const bgColor = theme === 'dark' ? '#0f172a' : '#ffffff';
          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('x', bbox.x);
          bgRect.setAttribute('y', bbox.y);
          bgRect.setAttribute('width', bbox.width);
          bgRect.setAttribute('height', bbox.height);
          bgRect.setAttribute('fill', bgColor);
          cloned.insertBefore(bgRect, cloned.firstChild);

          const svgStr = new XMLSerializer().serializeToString(cloned);
          const encoded = encodeURIComponent(svgStr)
            .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
          const dataUrl = 'data:image/svg+xml;base64,' + btoa(encoded);

          const img = new Image();
          img.onload = () => {
            const cvs = document.createElement('canvas');
            cvs.width = Math.ceil(w * 2);
            cvs.height = Math.ceil(h * 2);
            const ctx = cvs.getContext('2d');
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

            cvs.toBlob((blob) => {
              if (blob) {
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${title}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
              }
            }, 'image/jpeg', 0.95);
          };
          img.src = dataUrl;
        } catch (e) {
          console.error('圖片下載失敗', e);
        }
      }
    }

    // 延遲一下再開啟郵件，讓圖片有時間下載
    setTimeout(() => {
      // 建立 mailto 連結
      let mailtoUrl = `mailto:${encodeURIComponent(to)}`;
      const params = [];

      if (cc.trim()) {
        params.push(`cc=${encodeURIComponent(cc)}`);
      }
      if (subject.trim()) {
        params.push(`subject=${encodeURIComponent(subject)}`);
      }
      if (body.trim()) {
        params.push(`body=${encodeURIComponent(body)}`);
      }

      if (params.length > 0) {
        mailtoUrl += '?' + params.join('&');
      }

      // 開啟郵件客戶端
      window.open(mailtoUrl, '_blank');
      setShowShareModal(false);
    }, 500);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden text-slate-800" style={{ fontFamily: '"Roboto Flex", "Noto Sans TC", sans-serif' }}>
      {/* Header */}
      <header id="main-header" className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg"><Wand2 className="w-5 h-5 text-white" /></div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Mermaid Flow</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://mermaid.js.org/intro/" target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline hidden md:block">語法參考</a>
          <UserProfile user={user} />
          <SignOutButton onLogout={onLogout} provider={user?.provider} />
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row h-full relative">
        {/* Left Panel */}
        <div
          id="main-sidebar"
          className={`
            md:w-1/3 flex flex-col border-r border-slate-200 bg-white shadow-lg z-30
            fixed md:relative inset-0 md:inset-auto h-full transition-transform duration-300 ease-in-out
            ${isFullscreen ? 'md:hidden' : ''}
            ${isMobilePreview ? 'hidden md:flex' : 'flex w-full'}
          `}
        >
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button onClick={() => setActiveTab('generate')} className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'generate' ? 'text-indigo-600 bg-white shadow-inner border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <MessageSquarePlus className="w-4 h-4" /> AI 生成
            </button>
            <button onClick={() => setActiveTab('edit')} className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'edit' ? 'text-indigo-600 bg-white shadow-inner border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Code className="w-4 h-4" /> 程式碼編輯 {renderError && <span className="w-2 h-2 rounded-full bg-red-500 ml-1 animate-pulse" />}
            </button>
            <button onClick={() => setActiveTab('workspace')} className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'workspace' ? 'text-indigo-600 bg-white shadow-inner border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FolderOpen className="w-4 h-4" /> 工作區
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* Generate Tab */}
            <div className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${activeTab === 'generate' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>

              {/* 摘要列 - 點擊展開選項 */}
              <div
                className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200 cursor-pointer hover:from-indigo-100 hover:to-slate-100 transition-colors"
                onClick={() => setShowOptionsDrawer(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* 圖表類型標籤 */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200">
                      <Layout className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-700">
                        {DIAGRAM_TYPES.find(t => t.id === diagramType)?.label.split(' (')[0]}
                      </span>
                    </div>
                    {/* 圖片狀態標籤 */}
                    {selectedImage ? (
                      <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200">
                        <ImageIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">已上傳圖片</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 opacity-60">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">圖片 (選填)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600">
                    <span className="text-xs font-medium hidden sm:inline">設定選項</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 主要內容區 - 描述輸入 (最大化) */}
              <div className="flex-1 flex flex-col p-4 min-h-0">
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1 flex-shrink-0">
                  <PenTool className="w-4 h-4" /> 描述流程或需求
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`請描述您想要的圖表內容...\n\n範例：\n- 使用者登入流程，包含帳號驗證、雙因素認證、登入成功或失敗的分支\n- 網站架構圖，首頁連結到商品頁、關於我們、聯絡我們\n- 專案開發時間軸，從需求分析到上線維運的各個階段`}
                  className="flex-1 w-full p-4 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50 leading-relaxed placeholder:text-slate-400"
                />
              </div>

              {/* 底部按鈕區 */}
              <div className="flex-shrink-0 px-4 pb-20 md:pb-4 flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center justify-center"
                  title="重設所有內容"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsMobilePreview(true)}
                  className="md:hidden px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-2"
                  title="預覽圖表"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button onClick={handleGenerate} disabled={isGenerating || (!prompt.trim() && !selectedImage)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg ${isGenerating || (!prompt.trim() && !selectedImage) ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}>
                  {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /> 生成中...</>) : (<><Play className="w-5 h-5 fill-current" /> 生成圖表</>)}
                </button>
              </div>

              {/* 底部抽屜 - 選項面板 */}
              {showOptionsDrawer && (
                <>
                  {/* 背景遮罩 */}
                  <div
                    className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
                    onClick={() => setShowOptionsDrawer(false)}
                  />
                  {/* 抽屜內容 */}
                  <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
                    {/* 抽屜把手 */}
                    <div className="flex justify-center py-3 flex-shrink-0">
                      <div className="w-10 h-1 bg-slate-300 rounded-full" />
                    </div>

                    {/* 抽屜標題 */}
                    <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                      <h3 className="text-lg font-bold text-slate-800">設定選項</h3>
                      <button
                        onClick={() => setShowOptionsDrawer(false)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>

                    {/* 抽屜內容 - 可滾動 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {/* 圖表類型選擇 */}
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Layout className="w-4 h-4 text-indigo-600" />
                          選擇圖表類型
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                          {DIAGRAM_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.id}
                                onClick={() => {
                                  handleTypeSelect(type.id);
                                }}
                                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all
                                ${diagramType === type.id
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                              >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span className="truncate w-full text-center">{type.label.split(' (')[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 圖片上傳區 */}
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                          圖片轉圖表 (選填)
                        </label>
                        <div
                          className={`relative border-2 border-dashed rounded-xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] mt-3
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
                              <Loader2 className="w-8 h-8 animate-spin mb-2" />
                              <span className="text-sm font-medium">AI 正在分析圖片內容...</span>
                            </div>
                          ) : selectedImage ? (
                            <div className="w-full relative group">
                              <img src={selectedImage} alt="Uploaded" className="max-h-[160px] mx-auto rounded-lg shadow-md object-contain" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                                title="移除圖片"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="bg-indigo-100 p-3 rounded-full mb-3">
                                <Upload className="w-6 h-6 text-indigo-600" />
                              </div>
                              <p className="text-sm text-slate-600 font-medium">點擊或拖曳圖片至此</p>
                              <p className="text-xs text-slate-400 mt-1">支援白板草圖、截圖或手繪稿</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 抽屜底部按鈕 */}
                    <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50">
                      <button
                        onClick={() => setShowOptionsDrawer(false)}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                      >
                        完成設定
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Edit Tab */}
            <div className={`absolute inset-0 flex flex-col p-4 pb-24 md:pb-4 transition-opacity duration-200 ${activeTab === 'edit' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="mb-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex-shrink-0">
                <label className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI 智慧修改</label>
                <div className="flex flex-col gap-2">
                  <textarea value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiEdit(); } }} placeholder="例如：把 '結帳' 節點改成紅色..." className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-y" />
                  <div className="flex justify-end"><button onClick={handleAiEdit} disabled={isAiEditing || !editInstruction.trim()} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">{isAiEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : '修改'}</button></div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <label className="text-sm font-medium text-slate-700">Mermaid Source Code</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={saveToWorkspace} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors" title="儲存到工作區"><Save className="w-3 h-3" /> 儲存</button>
                  <button onClick={copyToClipboard} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">{isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {isCopied ? "已複製" : "複製"}</button>
                </div>
              </div>
              <div className="flex-1 relative min-h-0 border rounded-lg overflow-hidden shadow-inner">
                <textarea value={mermaidCode} onChange={(e) => setMermaidCode(e.target.value)} className="absolute inset-0 w-full h-full p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset resize-none bg-slate-900 text-slate-100" spellCheck="false" />
              </div>

              <button
                onClick={() => setIsMobilePreview(true)}
                className="md:hidden mt-3 w-full py-3 bg-indigo-50 border border-indigo-200 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Eye className="w-4 h-4" /> 預覽圖表
              </button>
              {renderError && (
                <div className="mt-3 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <div className="flex items-start gap-2 text-red-700 text-xs max-h-24 overflow-y-auto"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span className="break-all font-mono">{renderError}</span></div>
                    <button onClick={handleFix} disabled={isFixing} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-md shadow-sm">{isFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} 讓 AI 修復</button>
                  </div>
                </div>
              )}
            </div>

            {/* Workspace Tab */}
            <div className={`absolute inset-0 flex flex-col p-4 pb-24 md:pb-4 transition-opacity duration-200 overflow-y-auto ${activeTab === 'workspace' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-1">我的工作區</h3>
                <p className="text-sm text-slate-500">儲存並管理您的 Mermaid圖表</p>
              </div>

              {savedDiagrams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-lg">
                  <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">目前沒有儲存的圖表</p>
                  <button onClick={() => setActiveTab('edit')} className="mt-4 text-indigo-600 text-sm hover:underline">去儲存目前的圖表</button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedDiagrams.map((diagram) => {
                    const TypeIcon = DIAGRAM_TYPES.find(t => t.id === diagram.type)?.icon || FileCode;
                    return (
                      <div key={diagram.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-md text-indigo-600">
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 line-clamp-1">{diagram.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                                  {DIAGRAM_TYPES.find(t => t.id === diagram.type)?.label.split(' (')[0] || diagram.type}
                                </span>
                                <span className="text-[10px] text-slate-400">{new Date(diagram.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => renameInWorkspace(diagram.id, diagram.name)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="重新命名">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteFromWorkspace(diagram.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="刪除">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 mb-3 h-20 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/90 pointer-events-none"></div>
                          <code className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap">{diagram.code}</code>
                        </div>
                        <button onClick={() => loadFromWorkspace(diagram)} className="w-full py-2 bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100 transition-colors text-sm">
                          載入此圖表
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div
          className={`
            bg-slate-100 relative overflow-hidden flex-col h-full transition-all duration-300
            ${isFullscreen
              ? 'fixed inset-0 z-50 flex'
              : `md:w-2/3 ${isMobilePreview ? 'flex w-full fixed inset-0 z-20 md:static md:z-auto' : 'hidden md:flex'}`
            }
          `}
          id="print-container"
          ref={containerRef}
          onWheel={undefined} // Handled by useEffect
        >
          <div className="absolute top-4 right-4 flex items-center gap-1.5 md:gap-2 z-10 pointer-events-none flex-wrap justify-end max-w-full pl-4">
            <button
              onClick={() => setIsMobilePreview(false)}
              className={`pointer-events-auto md:hidden bg-indigo-600 text-white shadow-md border border-transparent hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isMobilePreview ? 'flex' : 'hidden'}`}
              title="回到編輯"
            >
              <PenTool className="w-4 h-4" /> 編輯
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-slate-700 hover:text-indigo-600 px-2 md:px-3 py-2 rounded-lg text-sm font-medium hidden md:flex items-center gap-2" title={isFullscreen ? "退出全螢幕" : "全螢幕預覽"}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsPanningTool(!isPanningTool)} className={`pointer-events-auto backdrop-blur shadow-sm border px-2 md:px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isPanningTool ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-100' : 'bg-white/90 border-slate-200 text-slate-700 hover:text-indigo-600'}`} title="抓手模式"><Hand className="w-4 h-4" /></button>
            <div className="relative pointer-events-auto theme-menu-container">
              <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-slate-700 hover:text-indigo-600 px-2 md:px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Palette className="w-4 h-4" /><ChevronDown className={`w-3 h-3 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} /></button>
              {showThemeMenu && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">{THEMES.map((t) => (<button key={t.id} onClick={() => { setTheme(t.id); setShowThemeMenu(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 ${theme === t.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'}`}><span className={`w-3 h-3 rounded-full shadow-sm border border-black/10 ${t.color}`}></span>{t.label.split(' (')[0]}{theme === t.id && <Check className="w-3 h-3 ml-auto" />}</button>))}</div>}
            </div>
            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg p-1 hidden md:flex items-center gap-0.5 md:gap-1 pointer-events-auto">
              <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="w-7 h-8 md:w-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">-</button>
              <div className="w-14 relative hidden md:flex items-center justify-center"><input type="text" value={zoomInput} onChange={(e) => setZoomInput(e.target.value)} onBlur={handleZoomCommit} onKeyDown={(e) => e.key === 'Enter' && handleZoomCommit()} className="w-full text-center text-xs font-medium text-slate-600 bg-transparent focus:outline-none focus:bg-slate-50 rounded px-1 py-0.5" /><span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span></div>
              <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="w-7 h-8 md:w-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">+</button>
              <div className="w-px h-4 bg-slate-200 mx-1 hidden md:block"></div>
              <button onClick={handleResetView} className="w-8 h-8 md:flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded hidden"><RotateCcw className="w-4 h-4" /></button>
            </div>
            <div className="relative pointer-events-auto export-menu-container">
              <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!svgContent || isExporting} className={`bg-indigo-600 shadow-md border border-transparent text-white hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${showExportMenu ? 'ring-2 ring-indigo-300' : ''}`}>
                {isExporting ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden md:inline">AI 命名中...</span></> : <><Download className="w-4 h-4" /> <span className="hidden md:inline">匯出</span> <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} /></>}
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                  <button onClick={() => downloadImage('png')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-green-600" /> 匯出 PNG
                  </button>
                  <button onClick={() => downloadImage('jpg')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-blue-600" /> 匯出 JPG
                  </button>
                  <button onClick={downloadSVG} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-orange-600" /> 匯出 SVG
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={openShareModal} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-600" /> 分享郵件
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseLeave}
            style={{ touchAction: isPanningTool ? 'none' : 'auto' }}
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
      </main >

      {/* 分享郵件對話框 */}
      {showShareModal && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-200"
            onClick={() => setShowShareModal(false)}
          />
          {/* 對話框 */}
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[85vh] z-50 bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 fade-in duration-300">
            {/* 標題列 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">分享圖表</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* 表單內容 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* 寄件人 (唯讀) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  寄件人
                </label>
                <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600">
                  {user?.name || '使用者'} {user?.username || user?.email ? `<${user?.username || user?.email}>` : ''}
                </div>
              </div>

              {/* 收件人 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  收件人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={shareForm.to}
                  onChange={(e) => setShareForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* CC */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  副本 (CC)
                </label>
                <input
                  type="text"
                  value={shareForm.cc}
                  onChange={(e) => setShareForm(prev => ({ ...prev, cc: e.target.value }))}
                  placeholder="多個信箱用逗號分隔"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* 主旨 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  主旨
                </label>
                <input
                  type="text"
                  value={shareForm.subject}
                  onChange={(e) => setShareForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="郵件主旨"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* 內文 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  內文
                </label>
                <textarea
                  value={shareForm.body}
                  onChange={(e) => setShareForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* 提示訊息 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-xs text-indigo-700">
                  � <strong>自動附件：</strong>點擊「下載圖片並開啟郵件」後，系統會自動下載 JPG 圖片，請在郵件中附加該檔案。
                </p>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!shareForm.to.trim()}
                className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下載圖片並開啟郵件
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Floating Action Button removed based on user feedback */}
    </div>
  );
}

export default function App() {
  const isMsalAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();

  // Initialize googleUser from localStorage
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      const saved = localStorage.getItem('googleUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse googleUser from localStorage", e);
      return null;
    }
  });

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
    localStorage.setItem('googleUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (googleUser) {
      localStorage.removeItem('googleUser');
      googleLogout(); // Ensure Google logout is called
    }
    setGoogleUser(null);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <SignInButton onGoogleLoginSuccess={handleGoogleLoginSuccess} />;
  }

  return <MainApp user={currentUser} onLogout={handleLogout} />;
}
