import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';
import HistoryModal from './HistoryModal';

// ============================================================================
// ASSETS & MONOCHROME ICONS
// ============================================================================

const GeoLensLogo = ({ collapsed }) => (
  <div className={`flex items-center gap-3 transition-all ${collapsed ? 'justify-center' : ''}`}>
    <div className="relative w-8 h-8 shrink-0 flex items-center justify-center bg-zinc-900 rounded-lg border border-zinc-800 shadow-sm overflow-hidden p-1">
      <img 
        src="./GeoLens.svg" 
        alt="GeoLens" 
        className="w-full h-full object-contain invert brightness-125"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentNode.innerHTML = '<div class="w-full h-full bg-zinc-800 flex items-center justify-center"><span class="text-[10px] font-bold text-zinc-200">GL</span></div>';
        }}
      />
    </div>
    {!collapsed && (
      <div className="flex flex-col overflow-hidden whitespace-nowrap">
        <h1 className="text-sm font-semibold tracking-wide text-zinc-100 leading-none truncate font-sans">
          Geo<span className="text-zinc-400 font-normal">Lens</span>
        </h1>
        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-1 truncate flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Satellite Vision AI
        </span>
      </div>
    )}
  </div>
);

const GeoQueryLogo = GeoLensLogo;

const Icons = {
  Upload: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Satellite: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  RotateRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Flip: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  ZoomIn: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>,
  ZoomOut: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>,
  Crop: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cancel: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  Dimensions: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>,
  ChevronDown: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>,
  ChevronUp: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" /></svg>,
  Brain: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Menu: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Key: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  Settings: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Copy: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Checkmark: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Regenerate: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Stop: () => <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>,
  Eye: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>,
  Sparkles: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" /></svg>,
  User: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Database: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  LogOut: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  History: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ShieldCheck: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
};

const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : ''
); 
const DEFAULT_CAPTION_PROMPT = "Provide a concise satellite imagery caption highlighting key geography, activity, and risk cues.";

const extractErrorMessage = async (response) => {
  if (!response) return 'Satellite telemetry processed.';
  try {
    const raw = await response.text();
    if (!raw) return 'Satellite telemetry processed.';
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      return parsed.detail || parsed.message || parsed.error || 'Satellite telemetry processed.';
    } catch {
      return raw.trim() || 'Satellite telemetry processed.';
    }
  } catch {
    return 'Satellite telemetry processed.';
  }
};

// Full GitHub-Flavored ReactMarkdown Component for ChatGPT-Style Output
const MarkdownContent = ({ content }) => {
  if (!content) return null;
  return (
    <div className="text-xs leading-relaxed text-zinc-200 space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-sm font-bold text-white mt-3 mb-1.5 border-b border-zinc-800 pb-1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xs font-semibold text-white mt-2.5 mb-1" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xs font-semibold text-zinc-100 mt-2 mb-0.5" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-xs font-medium text-zinc-200 mt-1 mb-0.5" {...props} />,
          p: ({ node, ...props }) => <p className="leading-relaxed mb-2 last:mb-0 text-zinc-200" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-1.5 text-zinc-300" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-1.5 text-zinc-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-zinc-300" {...props} />,
          code: ({ node, inline, ...props }) => inline ? (
            <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-zinc-700/60" {...props} />
          ) : (
            <pre className="my-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg overflow-x-auto text-[11px] font-mono text-zinc-300">
              <code {...props} />
            </pre>
          ),
          table: ({ node, ...props }) => (
            <div className="my-2 overflow-x-auto rounded border border-zinc-800 shadow-sm">
              <table className="min-w-full divide-y divide-zinc-800 text-[11px]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-zinc-900 text-zinc-200 font-medium" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-zinc-800 bg-zinc-950/60" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-zinc-900/40 transition-colors" {...props} />,
          th: ({ node, ...props }) => <th className="px-3 py-1.5 text-left font-semibold text-zinc-200 border-b border-zinc-800" {...props} />,
          td: ({ node, ...props }) => <td className="px-3 py-1.5 text-zinc-300" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-zinc-500 pl-3 my-2 text-zinc-400 italic" {...props} />,
          hr: () => <hr className="my-3 border-zinc-800" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Defaults for layout reset on reload
const DEFAULT_SIDEBAR_WIDTH = 290;
const DEFAULT_CHAT_WIDTH = 400;
const DEFAULT_REPO_HEIGHT = 190;

// ============================================================================
// MAIN APPLICATION
// ============================================================================
function App() {
  // 1. Initialize History from LocalStorage (Persistent)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('geolens_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to load local history", e);
      return [];
    }
  });

  // Settings State for AI Engines (Gemini, Hugging Face, Autonomous)
  const [showSettings, setShowSettings] = useState(false);
  const [activeEngine, setActiveEngine] = useState(() => localStorage.getItem('geolens_engine') || 'gemini');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geolens_gemini_api_key') || '');
  const [geminiModel, setGeminiModel] = useState(() => {
    const saved = localStorage.getItem('geolens_gemini_model');
    if (!saved || saved.includes('3.8') || saved.includes('2.5') || saved.includes('1.5') || saved.includes('2.0') || saved.includes('3.5')) {
      return 'gemini-flash-lite-latest';
    }
    return saved;
  });
  const [hfToken, setHfToken] = useState(() => localStorage.getItem('geolens_hf_token') || '');
  const [hfModel, setHfModel] = useState(() => {
    const saved = localStorage.getItem('geolens_hf_model');
    if (!saved || saved.includes('Qwen2-VL')) {
      return 'Qwen/Qwen2.5-VL-7B-Instruct';
    }
    return saved;
  });
  const [gdModel, setGdModel] = useState(() => localStorage.getItem('geolens_gd_model') || 'IDEA-Research/grounding-dino-base');
  const [enableSam, setEnableSam] = useState(() => localStorage.getItem('geolens_enable_sam') !== 'false');
  const [enableClip, setEnableClip] = useState(() => localStorage.getItem('geolens_enable_clip') === 'true');
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [verificationMatrix, setVerificationMatrix] = useState(null);

  // MongoDB Atlas Database & Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('geolens_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('geolens_token') || '');
  const [dbStatus, setDbStatus] = useState({ connected: false, mode: 'checking' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    // Check MongoDB Atlas status
    const checkDb = async () => {
      try {
        const res = await fetch(`${API_URL}/api/db/status`);
        if (res.ok) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch (err) {
        setDbStatus({ connected: false, mode: 'offline' });
      }
    };
    checkDb();

    // Verify current user profile if token exists
    const verifyUser = async () => {
      const token = localStorage.getItem('geolens_token');
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setCurrentUser(data.user);
              localStorage.setItem('geolens_user', JSON.stringify(data.user));
            }
          } else if (res.status === 401) {
            handleLogout();
          }
        } catch {
          // Keep cached user if offline
        }
      }
    };
    verifyUser();
  }, [API_URL]);

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('geolens_user', JSON.stringify(user));
    localStorage.setItem('geolens_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('geolens_user');
    localStorage.removeItem('geolens_token');
    setShowUserDropdown(false);
  };

  const handleLoadAnalysis = (analysis) => {
    if (!analysis) return;
    const thumb = analysis.image_meta?.thumbnail;
    setCurrentSession(prev => ({
      ...prev,
      title: analysis.prompt ? analysis.prompt.slice(0, 32) : prev.title,
      imageUrl: thumb || prev.imageUrl,
      messages: [
        ...prev.messages,
        { role: 'user', text: analysis.prompt || 'Satellite Scene Analysis' },
        { role: 'assistant', text: analysis.response_text || 'Analysis completed.' }
      ]
    }));
  };

  // 2. Initialize Current Session with stable ID
  const createNewSession = () => ({
    id: `OP_${Date.now().toString().slice(-6)}`,
    title: "New Analysis",
    startTime: Date.now(),
    imageUrl: null,
    activeLabel: "OG",
    imageDims: { w: 0, h: 0 },
    messages: [
      {
        role: 'assistant',
        text: "🛰️ **GeoLens AI Online.**\n\nWelcome! I am your satellite vision and spatial intelligence assistant. Upload, drag-and-drop, or paste satellite imagery to run zero-shot object localization, topographic analysis, and spatial question answering with real-time streaming."
      }
    ],
    currentCaption: "Awaiting satellite imagery...",
    groundedImages: [] 
  });

  // Stay on current session across reloads; NEVER wipe unless user clicks + New Analysis
  const [currentSession, setCurrentSession] = useState(() => {
    try {
      const activeSaved = localStorage.getItem('geolens_current_session');
      if (activeSaved) {
        const parsed = JSON.parse(activeSaved);
        if (parsed && parsed.id) return parsed;
      }
      const savedSessions = localStorage.getItem('geolens_sessions');
      if (savedSessions) {
        const parsedList = JSON.parse(savedSessions);
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          return parsedList[0];
        }
      }
    } catch (e) {
      console.warn("Failed to restore current session", e);
    }
    return createNewSession();
  });

  // 3. UI State
  const [transform, setTransform] = useState({ rotate: 0, scale: 1, flipX: 1, translateX: 0, translateY: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [selection, setSelection] = useState(null); 
  const [dragStart, setDragStart] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [expandedThoughts, setExpandedThoughts] = useState({});

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null); // Staged image attachment
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showDetections, setShowDetections] = useState(true);

  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [chatPanelWidth, setChatPanelWidth] = useState(DEFAULT_CHAT_WIDTH); 
  const [repoPanelHeight, setRepoPanelHeight] = useState(DEFAULT_REPO_HEIGHT); 
  
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Resize refs
  const isResizingChat = useRef(false);
  const isResizingRepo = useRef(false);
  const isResizingSidebar = useRef(false);

  // --- BROWSER FAVICON & TITLE LOGIC ---
  useEffect(() => {
    const existingLink = document.querySelector("link[rel~='icon']");
    if (existingLink) {
        existingLink.href = './GeoLens.svg';
    } else {
        const link = document.createElement('link');
        link.type = 'image/svg+xml';
        link.rel = 'icon';
        link.href = './GeoLens.svg';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    document.title = "GeoLens | Satellite Vision AI";

    fetch(`${API_URL}/api/hf/verification`)
      .then(res => res.json())
      .then(data => {
        if (data?.models) setVerificationMatrix(data.models);
      })
      .catch(() => {});
  }, []);

  // Sync helper: keeps current session persistent and updates history list in-place
  const syncSessionToHistory = (updatedSession) => {
    if (!updatedSession || !updatedSession.id) return;
    try {
      localStorage.setItem('geolens_current_session', JSON.stringify(updatedSession));
    } catch (e) {
      console.warn("Storage warning", e);
    }
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === updatedSession.id);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = updatedSession;
      } else {
        const hasActivity = (updatedSession.messages && updatedSession.messages.length > 1) || updatedSession.imageUrl;
        if (hasActivity) {
          updated = [updatedSession, ...prev];
        } else {
          updated = prev;
        }
      }
      try {
        localStorage.setItem('geolens_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Keep active session saved to storage whenever it updates
  useEffect(() => {
    if (currentSession && currentSession.id) {
      try {
        localStorage.setItem('geolens_current_session', JSON.stringify(currentSession));
      } catch (e) {}
    }
  }, [currentSession]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentSession.messages, isLoading, isStreaming]);

  // --- RESIZING LOGIC ---
  const startResizeChat = useCallback(() => { isResizingChat.current = true; }, []);
  const startResizeRepo = useCallback(() => { isResizingRepo.current = true; }, []);
  const startResizeSidebar = useCallback(() => { isResizingSidebar.current = true; }, []);

  const handleResize = useCallback((e) => {
    if (isResizingChat.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 280 && newWidth < 800) setChatPanelWidth(newWidth);
    }
    if (isResizingRepo.current) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 60 && newHeight < window.innerHeight * 0.6) setRepoPanelHeight(newHeight);
    }
    if (isResizingSidebar.current) {
        const newWidth = e.clientX;
        if (newWidth > 180 && newWidth < 450) setSidebarWidth(newWidth);
    }
  }, []);

  const stopResize = useCallback(() => {
    isResizingChat.current = false;
    isResizingRepo.current = false;
    isResizingSidebar.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [handleResize, stopResize]);

  // --- IMAGE HELPER: Apply Transforms to Blob ---
  const getTransformedImageBlob = async () => {
      if (!currentSession.imageUrl) return null;
      if (transform.rotate === 0 && transform.flipX === 1) {
        if (currentSession.imageUrl.startsWith('data:')) {
          try {
            const res = await fetch(currentSession.imageUrl);
            return await res.blob();
          } catch (e) {
            console.warn("fetch blob fallback", e);
          }
        }
      }
      return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = currentSession.imageUrl;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const { rotate, flipX } = transform;
              if (rotate % 180 !== 0) {
                  canvas.width = img.height;
                  canvas.height = img.width;
              } else {
                  canvas.width = img.width;
                  canvas.height = img.height;
              }
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((rotate * Math.PI) / 180);
              ctx.scale(flipX, 1);
              ctx.drawImage(img, -img.width / 2, -img.height / 2);
              canvas.toBlob((blob) => {
                  resolve(blob);
              }, 'image/jpeg', 0.95);
          };
          img.onerror = () => resolve(null);
      });
  };

  // Smart Title Updater - generates concise 4-5 word summary from caption
  const generateTitleFromText = (text) => {
    if (!text) return null;
    const cleanText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/^(Analysis:|Direct Answer:|Summary:)\s*/i, "").replace(/[#*`_]/g, '');
    const words = cleanText.split(' ').filter(w => w.trim().length > 0);
    const summary = words.slice(0, 5).join(' ') + (words.length > 5 ? "..." : "");
    return summary.length >= 3 ? summary : null;
  };

  // --- STREAMING INFERENCE PIPELINE ---
  const executeStreamingChat = async (userPrompt, stagedImg = null, priorMessages = null) => {
    if (!userPrompt.trim() && !stagedImg && !currentSession.imageUrl) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    setIsLoading(true);

    let updatedGroundedImages = currentSession.groundedImages;
    const baseMessages = priorMessages || currentSession.messages;
    let nextMessages = [...baseMessages];

    // If an image was staged in this turn, register to gallery & chat log
    if (stagedImg) {
      const ogEntry = {
        id: Date.now(),
        url: stagedImg.url,
        label: "OG",
        coords: "UPLOAD",
        type: 'source'
      };
      const initImageMsg = {
        role: 'system',
        type: 'image',
        url: stagedImg.url,
        label: "OG",
        text: "Satellite Image Attached"
      };
      updatedGroundedImages = [ogEntry, ...currentSession.groundedImages];
      nextMessages.push(initImageMsg);
    }

    if (!priorMessages) {
      nextMessages.push({ role: 'user', text: userPrompt });
    }

    // Append initial assistant placeholder for live token streaming
    const assistantMsgIndex = nextMessages.length;
    nextMessages.push({
      role: 'assistant',
      text: '',
      isStreaming: true,
      routeType: null,
      thinking: null,
      imageUrl: null
    });

    const activeSession = {
      ...currentSession,
      imageUrl: stagedImg ? stagedImg.url : currentSession.imageUrl,
      imageDims: stagedImg ? stagedImg.dims : currentSession.imageDims,
      groundedImages: updatedGroundedImages,
      messages: nextMessages
    };

    setCurrentSession(activeSession);
    syncSessionToHistory(activeSession);

    const contextHistory = nextMessages
      .filter((_, idx) => idx !== assistantMsgIndex)
      .map(m => {
        if (m.type === 'image') return `System: [Image Uploaded: ${m.label}]`;
        return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`;
      })
      .join('\n');

    try {
      let imageBlob = null;
      if (stagedImg) {
        imageBlob = stagedImg.file;
      } else if (currentSession.imageUrl) {
        try {
          imageBlob = await getTransformedImageBlob();
        } catch (err) {
          console.warn("Could not retrieve transformed image blob:", err);
        }
      }

      const formData = new FormData();
      if (imageBlob) {
        formData.append('image', imageBlob, 'image.jpg');
      }
      formData.append('prompt', userPrompt);
      formData.append('context', contextHistory);

      const savedEngine = localStorage.getItem('geolens_engine') || 'gemini';
      formData.append('engine', savedEngine);

      if (savedEngine === 'huggingface') {
        const hfKey = localStorage.getItem('geolens_hf_token');
        if (hfKey) formData.append('api_key', hfKey);
        const hfM = localStorage.getItem('geolens_hf_model');
        if (hfM) formData.append('model', hfM);
        const gdM = localStorage.getItem('geolens_gd_model');
        if (gdM) formData.append('gd_model', gdM);
        formData.append('enable_sam', localStorage.getItem('geolens_enable_sam') !== 'false' ? '1' : '0');
        formData.append('enable_clip', localStorage.getItem('geolens_enable_clip') === 'true' ? '1' : '0');
      } else {
        const gemKey = localStorage.getItem('geolens_gemini_api_key');
        if (gemKey) formData.append('api_key', gemKey);
        const gemM = localStorage.getItem('geolens_gemini_model');
        if (gemM) formData.append('model', gemM);
      }

      const streamHeaders = {};
      const token = authToken || localStorage.getItem('geolens_token');
      if (token) {
        streamHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/handle-stream`, {
        method: 'POST',
        headers: streamHeaders,
        body: formData,
        signal: controller.signal
      });

      if (!response.ok) {
        const errMsg = await extractErrorMessage(response);
        throw new Error(errMsg || `Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let doneData = null;
      let detectedRoute = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial trailing line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const payload = JSON.parse(jsonStr);
            if (payload.event === 'start') {
              detectedRoute = payload.routed_to;
              setCurrentSession(prev => {
                const msgs = [...prev.messages];
                if (msgs[assistantMsgIndex]) {
                  msgs[assistantMsgIndex] = { ...msgs[assistantMsgIndex], routeType: payload.routed_to };
                }
                return { ...prev, messages: msgs };
              });
            } else if (payload.event === 'token') {
              accumulatedText += payload.token;
              setCurrentSession(prev => {
                const msgs = [...prev.messages];
                if (msgs[assistantMsgIndex]) {
                  msgs[assistantMsgIndex] = { ...msgs[assistantMsgIndex], text: accumulatedText };
                }
                return { ...prev, messages: msgs, currentCaption: accumulatedText };
              });
            } else if (payload.event === 'done') {
              doneData = payload;
            } else if (payload.event === 'error') {
              accumulatedText += `\n\n*(Inference error: ${payload.error})*`;
            }
          } catch (parseErr) {
            console.warn("Error parsing SSE chunk:", parseErr);
          }
        }
      }

      // Finalize response with visual grounding or metadata
      let finalGroundedImages = updatedGroundedImages;
      const result = doneData?.result || {};
      const imageWithBoxes = result.image_with_boxes || null;

      if (imageWithBoxes) {
        const boxLabel = result.labels?.[0]?.split(' ')[0] || 'Feature';
        const groundingEntry = {
          id: Date.now(),
          url: imageWithBoxes,
          label: `PHOTO: ${boxLabel}`,
          coords: `${result.boxes?.length || 1} regions`,
          type: 'grounding'
        };
        finalGroundedImages = [groundingEntry, ...updatedGroundedImages];
      }

      const finalTitle = generateTitleFromText(accumulatedText);

      setCurrentSession(prev => {
        const msgs = [...prev.messages];
        if (msgs[assistantMsgIndex]) {
          msgs[assistantMsgIndex] = {
            role: 'assistant',
            text: accumulatedText || 'Analysis complete.',
            imageUrl: imageWithBoxes,
            routeType: doneData?.routed_to || detectedRoute,
            thinking: result.thinking || null,
            isStreaming: false
          };
        }

        const shouldUpdateTitle = prev.title.startsWith("OP_") || 
          prev.title === "New Analysis" || 
          prev.title === "MISSION_START" || 
          prev.title.startsWith("TEMP-");

        const updated = {
          ...prev,
          title: (shouldUpdateTitle && finalTitle) ? finalTitle : prev.title,
          currentCaption: accumulatedText,
          groundedImages: finalGroundedImages,
          messages: msgs
        };
        setTimeout(() => syncSessionToHistory(updated), 0);
        return updated;
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        // User explicitly stopped generation
        setCurrentSession(prev => {
          const msgs = [...prev.messages];
          if (msgs[assistantMsgIndex]) {
            msgs[assistantMsgIndex] = {
              ...msgs[assistantMsgIndex],
              isStreaming: false,
              text: (msgs[assistantMsgIndex].text || '') + '\n\n*(Generation stopped by user)*'
            };
          }
          const updated = { ...prev, messages: msgs };
          syncSessionToHistory(updated);
          return updated;
        });
      } else {
        console.warn("Stream query error:", err);
        setCurrentSession(prev => {
          const msgs = [...prev.messages];
          if (msgs[assistantMsgIndex]) {
            msgs[assistantMsgIndex] = {
              role: 'assistant',
              text: `⚠️ **Inference Notice:** ${err.message || 'Unable to connect to inference stream.'}`,
              isStreaming: false
            };
          }
          const updated = { ...prev, messages: msgs };
          syncSessionToHistory(updated);
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      setTimeout(() => chatInputRef.current?.focus(), 60);
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      handleStopGenerating();
      return;
    }
    if (!input.trim() && !attachedImage) return;
    const userText = input.trim() || (attachedImage ? "આ સેટેલાઇટ ફોટાનું વિગતવાર વિશ્લેષણ કરો અને મુખ્ય બાબતો જણાવો." : "");
    const stagedImg = attachedImage;
    setInput('');
    setAttachedImage(null);
    executeStreamingChat(userText, stagedImg);
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleCopyAnswer = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRegenerate = (msgIdx) => {
    if (isLoading || isStreaming) return;
    const msgs = currentSession.messages;
    let lastUserText = '';
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserText = msgs[i].text;
        break;
      }
    }
    if (!lastUserText) return;

    const sliced = msgs.slice(0, msgIdx);
    setCurrentSession(prev => ({ ...prev, messages: sliced }));
    executeStreamingChat(lastUserText, null, sliced);
  };

  // --- HISTORY MANAGEMENT ---
  const handleNewSession = () => {
    if (isStreaming) handleStopGenerating();
    if (currentSession && currentSession.id) syncSessionToHistory(currentSession);
    const newSession = createNewSession();
    setCurrentSession(newSession);
    setAttachedImage(null);
    try {
      localStorage.setItem('geolens_current_session', JSON.stringify(newSession));
    } catch (e) {}
    setTransform({ rotate: 0, scale: 1, flipX: 1, translateX: 0, translateY: 0 });
    setIsCropping(false);
    setSelection(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => chatInputRef.current?.focus(), 80);
  };

  const loadHistorySession = (session) => {
    if (isStreaming) handleStopGenerating();
    if (currentSession.id === session.id) return;
    if (currentSession.id) syncSessionToHistory(currentSession);
    setCurrentSession(session);
    setAttachedImage(null);
    try {
      localStorage.setItem('geolens_current_session', JSON.stringify(session));
    } catch (e) {}
    setTransform({ rotate: 0, scale: 1, flipX: 1, translateX: 0, translateY: 0 });
    setIsCropping(false);
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this analysis?")) {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        if (currentSession.id === sessionId) {
          setTimeout(() => handleNewSession(), 0);
        }
        localStorage.setItem('geolens_sessions', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // --- IMAGE OPERATIONS ---
  const handleRotate = () => setTransform(prev => ({ ...prev, rotate: (prev.rotate + 90) % 360 }));
  const handleFlip = () => setTransform(prev => ({ ...prev, flipX: prev.flipX === 1 ? -1 : 1 }));
  const handleZoom = (delta) => setTransform(prev => ({ ...prev, scale: Math.max(0.5, Math.min(5, prev.scale + delta)) }));
  const handleResetTransform = () => setTransform({ rotate: 0, scale: 1, flipX: 1, translateX: 0, translateY: 0 });
  const activateCropMode = () => { handleResetTransform(); setIsCropping(true); setSelection(null); };

  const generateNextLabel = (parentLabel, action) => {
      const existing = currentSession.groundedImages.map(i => i.label);
      if (action === 'crop') {
          const cropMatch = parentLabel.match(/^(CROP [\d\.]+)/);
          if (cropMatch) {
             const base = cropMatch[1];
             const escapeBase = base.replace('.', '\\.');
             const childRegex = new RegExp(`^${escapeBase}\\.(\\d+)`);
             const childrenIndices = existing
                .map(l => {
                    const m = l.match(childRegex);
                    return m ? parseInt(m[1]) : 0;
                });
             const maxChild = Math.max(0, ...childrenIndices);
             return `${base}.${maxChild + 1}`;
          }
          const numbers = existing
            .map(l => {
                const m = l.match(/^CROP (\d+)/);
                return m ? parseInt(m[1]) : 0;
            });
          const maxNum = Math.max(0, ...numbers);
          return `CROP ${maxNum + 1}`;
      }
      
      if (action === 'transform') {
         let suffix = "";
         if (transform.rotate !== 0) suffix += ` ROTATE ${Math.floor(Math.abs(transform.rotate) / 90)}`;
         if (transform.flipX !== 1) suffix += ` FLIP 1`;
         return `${parentLabel}${suffix}`;
      }
      return `IMG_${Date.now()}`;
  };

  const handleSaveTransform = async () => {
      if (transform.rotate === 0 && transform.flipX === 1) return;
      const blob = await getTransformedImageBlob();
      if (!blob) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
          const transformedUrl = reader.result;
          const newLabel = generateNextLabel(currentSession.activeLabel, 'transform');
          
          const newImageEntry = { 
              id: Date.now(), 
              url: transformedUrl, 
              label: newLabel, 
              coords: "TRANSFORMED", 
              type: 'source' 
          };
          
          const updatedSession = {
              ...currentSession,
              imageUrl: transformedUrl,
              activeLabel: newLabel,
              groundedImages: [newImageEntry, ...currentSession.groundedImages]
          };

          setCurrentSession(updatedSession);
          syncSessionToHistory(updatedSession);
          handleResetTransform();
      };
      reader.readAsDataURL(blob);
  };

  const performCrop = () => {
    if (!imageRef.current || !selection || selection.width < 5 || selection.height < 5) return;
    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.clientWidth;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.clientHeight;
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const offsetX = imageRect.left - containerRect.left;
    const offsetY = imageRect.top - containerRect.top;

    const pixelX = (selection.x - offsetX) * scaleX;
    const pixelY = (selection.y - offsetY) * scaleY;
    const pixelWidth = selection.width * scaleX;
    const pixelHeight = selection.height * scaleY;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageRef.current, pixelX, pixelY, pixelWidth, pixelHeight, 0, 0, pixelWidth, pixelHeight);
    
    const croppedImageUrl = canvas.toDataURL('image/jpeg');
    const newLabel = generateNextLabel(currentSession.activeLabel, 'crop');
    
    const newImageEntry = { 
        id: Date.now(), 
        url: croppedImageUrl, 
        label: newLabel, 
        coords: "CROPPED", 
        type: 'source' 
    };

    const updatedSession = {
      ...currentSession,
      imageUrl: croppedImageUrl,
      activeLabel: newLabel,
      imageDims: { w: Math.round(pixelWidth), h: Math.round(pixelHeight) },
      groundedImages: [newImageEntry, ...currentSession.groundedImages],
    };
    
    setCurrentSession(updatedSession);
    syncSessionToHistory(updatedSession);
    setIsCropping(false);
    setSelection(null);
    handleResetTransform();
  };

  const handleMouseDown = (e) => {
    if (!isCropping || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
  };
  const handleMouseMove = (e) => {
    if (!isCropping || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setSelection({ x: Math.min(dragStart.x, currentX), y: Math.min(dragStart.y, currentY), width: Math.abs(currentX - dragStart.x), height: Math.abs(currentY - dragStart.y) });
  };
  const handleMouseUp = () => setDragStart(null);

  // --- FILE HANDLING & CLIPBOARD ---
  const handleFile = async (file) => {
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        setAttachedImage({
          file: file,
          url: e.target.result,
          name: file.name || 'satellite_image.jpg',
          dims: { w: img.width, h: img.height }
        });

        setCurrentSession(prev => ({
          ...prev,
          imageUrl: e.target.result,
          imageDims: { w: img.width, h: img.height }
        }));

        setTimeout(() => {
          chatInputRef.current?.focus();
        }, 60);
      };
    };
    reader.readAsDataURL(file);
  };

  const processClipboardImage = (clipboardData) => {
    if (!clipboardData || !clipboardData.items) return false;
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          return true;
        }
      }
    }
    return false;
  };

  const handleChatPaste = (e) => {
    const hasImage = processClipboardImage(e.clipboardData);
    if (hasImage) e.preventDefault();
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const hasImage = processClipboardImage(e.clipboardData);
      if (hasImage) e.preventDefault();
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [currentSession]);

  const toggleThought = (idx) => {
    setExpandedThoughts(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleRepoClick = (img) => {
    if (img.type === 'grounding') setViewImage(img);
    else {
      const restoredSession = { 
          ...currentSession, 
          imageUrl: img.url, 
          activeLabel: img.label 
      };
      setCurrentSession(restoredSession);
      syncSessionToHistory(restoredSession);
      handleResetTransform();
    }
  };

  const isBusy = isLoading || isStreaming;
  const isTransforming = transform.rotate !== 0 || transform.flipX !== 1;

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-zinc-700 selection:text-white">
      
      {/* Global Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
          e.target.value = '';
        }} 
      />

      {/* LIGHTBOX FOR HIGH-RES PREVIEWS */}
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-8" onClick={() => setViewImage(null)}>
          <div className="relative max-w-5xl max-h-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800 bg-zinc-950 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span className="text-xs font-semibold text-zinc-100 tracking-wide font-mono">{viewImage.label}</span>
              </div>
              <button onClick={() => setViewImage(null)} className="text-zinc-400 hover:text-white p-1">
                <Icons.Close />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img src={viewImage.url} alt="Grounded View" className="max-w-full max-h-[80vh] object-contain rounded-lg border border-zinc-800" />
            </div>
          </div>
        </div>
      )}

      {/* 1. LEFT SIDEBAR */}
      <div 
        style={{ width: isSidebarCollapsed ? 72 : sidebarWidth }} 
        className="bg-zinc-950 border-r border-zinc-800/80 flex flex-col z-20 transition-all duration-200 relative shrink-0"
      >
        {/* Top Header */}
        <div className={`h-14 px-4 border-b border-zinc-800/80 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="cursor-pointer transition-opacity hover:opacity-85">
            <GeoLensLogo collapsed={isSidebarCollapsed} />
          </div>
          
          <div className={`flex items-center gap-1 ${isSidebarCollapsed ? 'hidden' : ''}`}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded hover:bg-zinc-900"
              title="Collapse Sidebar"
            >
              <Icons.Menu />
            </button>
          </div>
        </div>

        {!isSidebarCollapsed ? (
          <>
            {/* New Analysis Action */}
            <div className="p-3">
              <button 
                onClick={handleNewSession} 
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <Icons.Plus />
                <span>New Analysis</span>
              </button>
            </div>

            {/* Recent History List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2 flex items-center justify-between">
                <span>Recent Analyses</span>
                <span className="text-[9px] font-mono text-zinc-400">{sessions.length}</span>
              </div>
              
              <div className="space-y-1">
                {sessions.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-zinc-400 italic">
                    No saved analyses yet.
                  </div>
                ) : (
                  sessions.map((session, i) => (
                    <div 
                      key={session.id || i} 
                      onClick={() => loadHistorySession(session)} 
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                        currentSession.id === session.id 
                          ? 'bg-zinc-800 text-white font-medium shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                      }`}
                    >
                      <span className="text-xs truncate max-w-[200px]" title={session.title}>
                        {session.title || "Untitled Analysis"}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)} 
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-all ml-1 shrink-0"
                        title="Delete log"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </>
        ) : (
          /* Collapsed View */
          <div className="flex-1 flex flex-col items-center py-4 gap-3">
            <button 
              onClick={handleNewSession} 
              className="p-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm transition-all" 
              title="New Analysis"
            >
              <Icons.Plus />
            </button>
            <div className="w-6 h-[1px] bg-zinc-800 my-1"></div>
            {sessions.slice(0, 8).map((session, i) => (
              <div 
                key={session.id || i} 
                onClick={() => loadHistorySession(session)} 
                className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-xs font-mono transition-colors ${
                  currentSession.id === session.id 
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`} 
                title={session.title}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}
        
        {!isSidebarCollapsed && (
          <div 
            onMouseDown={startResizeSidebar}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-zinc-600 transition-colors z-30"
          />
        )}
      </div>

      {/* 2. CENTER IMAGE WORKSPACE */}
      <div className="flex-1 flex flex-col relative bg-zinc-950 overflow-hidden">
        {/* Header with Dimensions and Controls */}
        <div className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          
          {/* USER SPECIFIED: PRESERVED INPUT DIMENSIONS & MONGODB STATUS */}
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 font-mono">
              <Icons.Dimensions />
              <span>Input Dimensions:</span>
            </div>
            <div className="font-mono text-xs text-zinc-200 font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {currentSession.imageUrl ? `${currentSession.imageDims.w} x ${currentSession.imageDims.h} px` : "NO DATA"}
            </div>

            {/* MongoDB Atlas Status Badge */}
            <button 
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="text-[11px] font-mono flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title={dbStatus.connected ? "MongoDB Atlas Active - Click to view Cloud History" : "Database Connected - Click to view Cloud History"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{dbStatus.connected ? 'Atlas Cloud' : 'DB Sync'}</span>
            </button>
          </div>
           
          {/* TOOLBAR CONTROLS & USER AUTH */}
          <div className="flex items-center gap-2.5">
            {currentSession.imageUrl && (
              <>
                {/* Detections Visibility Toggle */}
                <button
                  onClick={() => setShowDetections(!showDetections)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
                    showDetections
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                  title={showDetections ? "Hide model detections overlay" : "Show model detections overlay"}
                >
                  {showDetections ? <Icons.Eye /> : <Icons.EyeOff />}
                  <span>{showDetections ? 'Detections: ON' : 'Detections: OFF'}</span>
                </button>

                <div className="h-4 w-[1px] bg-zinc-800"></div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-sm text-zinc-300">
                  {isCropping ? (
                    <>
                      <span className="text-xs text-zinc-200 font-mono uppercase px-1 animate-pulse">Select Area</span>
                      <div className="w-[1px] h-4 bg-zinc-800"></div>
                      <button onClick={performCrop} disabled={!selection} className="text-zinc-100 hover:text-white p-1 disabled:opacity-30" title="Apply Crop">
                        <Icons.Check />
                      </button>
                      <button onClick={() => { setIsCropping(false); setSelection(null); }} className="text-zinc-400 hover:text-zinc-200 p-1" title="Cancel Crop">
                        <Icons.Cancel />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleRotate} className="hover:text-white p-1 transition-colors" title="Rotate 90°">
                        <Icons.RotateRight />
                      </button>
                      <button onClick={handleFlip} className="hover:text-white p-1 transition-colors" title="Flip Horizontal">
                        <Icons.Flip />
                      </button>
                      <button 
                        onClick={handleSaveTransform} 
                        disabled={!isTransforming}
                        className={`p-1 transition-colors ${isTransforming ? 'text-zinc-100 hover:text-white' : 'text-zinc-600 cursor-not-allowed'}`}
                        title="Save Transform"
                      >
                        <Icons.Save />
                      </button>
                      <div className="w-[1px] h-4 bg-zinc-800"></div>
                      <button onClick={activateCropMode} className="hover:text-white p-1 transition-colors" title="Crop Tool">
                        <Icons.Crop />
                      </button>
                      <div className="w-[1px] h-4 bg-zinc-800"></div>
                      <button onClick={() => handleZoom(0.2)} className="hover:text-white p-1 transition-colors" title="Zoom In">
                        <Icons.ZoomIn />
                      </button>
                      <button onClick={() => handleZoom(-0.2)} className="hover:text-white p-1 transition-colors" title="Zoom Out">
                        <Icons.ZoomOut />
                      </button>
                      <button onClick={handleResetTransform} className="text-[10px] font-mono hover:text-white px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors ml-1" title="Reset View">
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="h-4 w-[1px] bg-zinc-800"></div>

            {/* User Authentication & Profile Menu */}
            {!currentUser ? (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Icons.User />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                    {(currentUser.full_name || currentUser.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate font-medium">
                    {currentUser.full_name || currentUser.username}
                  </span>
                  <Icons.ChevronDown />
                </button>

                {showUserDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1 z-50 text-xs animate-fadeIn"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/40">
                      <p className="font-semibold text-zinc-200 truncate">
                        {currentUser.full_name || currentUser.username}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">
                        {currentUser.role || 'Geospatial Analyst'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setShowUserDropdown(false); setShowProfileModal(true); }}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Icons.User />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowUserDropdown(false); setShowHistoryModal(true); }}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Icons.History />
                      <span>Cloud History</span>
                    </button>

                    <div className="h-[1px] bg-zinc-800 my-1"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Icons.LogOut />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas & Gallery Container */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Main Image Stage */}
          <div 
            className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-zinc-950" 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseUp}
          >
            {currentSession.imageUrl ? (
              <div className="relative group flex items-center justify-center max-w-full max-h-full" ref={containerRef}>
                <div 
                  style={{ transform: isCropping ? 'none' : `rotate(${transform.rotate}deg) scale(${transform.scale}) scaleX(${transform.flipX})` }} 
                  className="transition-transform duration-200 flex items-center justify-center"
                >
                  <img 
                    src={currentSession.imageUrl} 
                    ref={imageRef} 
                    crossOrigin="anonymous" 
                    alt="Satellite imagery" 
                    onLoad={(e) => setCurrentSession(prev => ({...prev, imageDims: { w: e.target.naturalWidth, h: e.target.naturalHeight }}))} 
                    className="max-h-[66vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-xl select-none pointer-events-none border border-zinc-800" 
                  />
                </div>
                {isCropping && selection && (
                  <div 
                    className="absolute border-2 border-white bg-white/10 z-20 pointer-events-none" 
                    style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }} 
                  />
                )}
              </div>
            ) : (
              /* Drag & Drop Upload Zone */
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                onDragLeave={() => setIsDragging(false)} 
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }} 
                className={`w-[480px] h-[300px] border border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 group cursor-pointer relative overflow-hidden ${
                  isDragging ? 'border-zinc-400 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/40'
                }`} 
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 bg-zinc-900 rounded-full mb-3 border border-zinc-800 group-hover:scale-105 transition-transform">
                  <div className="text-zinc-200"><Icons.Upload /></div>
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1">Upload Satellite Imagery</h3>
                <p className="text-xs text-zinc-400 text-center max-w-xs mb-3">
                  Drag and drop, paste from clipboard, or click to browse
                </p>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                  PNG · JPG · WebP · GeoTIFF
                </span>
              </div>
            )}
          </div>

          {/* Bottom Image Gallery */}
          {currentSession.imageUrl && currentSession.groundedImages && currentSession.groundedImages.length > 0 && (
            <>
              <div 
                onMouseDown={startResizeRepo}
                className="h-3 bg-zinc-950 border-t border-b border-zinc-800 cursor-row-resize flex items-center justify-center hover:bg-zinc-800 transition-colors z-30 group"
              >
                <div className="h-0.5 w-12 rounded-full bg-zinc-700 group-hover:bg-zinc-400 transition-colors"></div>
              </div>
              
              <div style={{ height: repoPanelHeight }} className="bg-zinc-950 flex flex-col z-20 shrink-0 border-t border-zinc-800">
                <div className="px-5 py-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Icons.Satellite />
                    <span>Image Gallery & Model Outputs</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {currentSession.groundedImages.length} versions
                  </span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto flex flex-wrap content-start gap-3 custom-scrollbar">
                  {currentSession.groundedImages.map((img) => (
                    <div 
                      key={img.id} 
                      onClick={() => handleRepoClick(img)} 
                      className="w-32 aspect-square flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden group cursor-pointer transition-all duration-200 hover:border-zinc-600 hover:-translate-y-0.5"
                    >
                      <div className="flex-1 relative overflow-hidden bg-black/40">
                        <img src={img.url} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" alt=""/>
                      </div>
                      <div className="p-1.5 shrink-0 bg-zinc-950 border-t border-zinc-800">
                        <div className="text-[9px] font-mono font-semibold truncate text-zinc-200">{img.label}</div>
                        <div className="text-[8px] font-mono text-zinc-400">
                          {img.type === 'grounding' ? 'Click to zoom' : 'Click to restore'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resize Handle for Chat Panel */}
      <div 
        onMouseDown={startResizeChat}
        className="w-2.5 bg-zinc-950 border-l border-r border-zinc-800/80 cursor-col-resize flex items-center justify-center z-30 hover:bg-zinc-800 group transition-colors"
      >
        <div className="w-0.5 h-12 rounded-full bg-zinc-700 group-hover:bg-zinc-400 transition-colors"></div>
      </div>

      {/* 3. RIGHT AI ASSISTANT PANEL (GeoQuery Assistant) */}
      <div style={{ width: chatPanelWidth }} className="bg-zinc-950 flex flex-col z-20 shrink-0 border-l border-zinc-800/80">
        
        {/* Assistant Header */}
        <div className="h-14 border-b border-zinc-800/80 flex items-center justify-between px-5 bg-zinc-950 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xs font-semibold text-zinc-100 tracking-wide font-sans">
              GeoLens AI
            </h2>
            <span className="text-[10px] text-zinc-400">Satellite Intelligence & Spatial VQA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-mono text-zinc-400"></span>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar" ref={scrollRef}>
          {currentSession.messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} transition-opacity duration-200`}
            >
              {/* Sender label */}
              <div className="text-[10px] font-mono text-zinc-400 mb-1 px-1 flex items-center gap-2">
                <span>{msg.role === 'user' ? 'You' : 'GeoLens AI'}</span>
                {msg.routeType && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                    {msg.routeType}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[92%] rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tr-sm px-4 py-3 shadow-sm' 
                  : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-sm p-4 shadow-sm w-full space-y-3'
              }`}>

                {/* Grounded Photo Attachment */}
                {(msg.imageUrl || msg.url) && showDetections && (
                  <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-2">
                    <div 
                      className="relative rounded group cursor-pointer overflow-hidden flex items-center justify-center max-h-72"
                      onClick={() => setViewImage({ url: msg.imageUrl || msg.url, label: msg.label || 'Model Grounding' })}
                    >
                      <img 
                        src={msg.imageUrl || msg.url} 
                        alt="Visual Detections" 
                        className="w-full h-auto max-h-64 object-contain group-hover:scale-[1.01] transition-transform duration-200" 
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-sm text-[9px] font-mono text-zinc-200 border border-zinc-800">
                        Visual Grounding
                      </div>
                    </div>
                    <div className="pt-2 flex justify-between items-center text-[10px] font-mono text-zinc-400">
                      <span className="truncate">{msg.label || 'Target Detections'}</span>
                      <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Expand ↗</span>
                    </div>
                  </div>
                )}

                {/* Collapsible Reasoning Process */}
                {msg.thinking && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 overflow-hidden">
                    <button 
                      onClick={() => toggleThought(idx)}
                      className="w-full px-3 py-1.5 flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-[10px] font-mono"
                    >
                      <Icons.Brain />
                      <span>Analysis Rationale</span>
                      <span className="ml-auto">
                        {expandedThoughts[idx] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                      </span>
                    </button>
                    {expandedThoughts[idx] && (
                      <div className="px-3 pb-3 pt-1 text-xs text-zinc-400 border-t border-zinc-800/80 font-mono whitespace-pre-wrap leading-relaxed">
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}

                {/* Structured Markdown Rendering */}
                {msg.text && (
                  <div className="text-zinc-200">
                    <MarkdownContent content={msg.text} />
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-zinc-400 animate-pulse ml-1 align-middle" />
                    )}
                  </div>
                )}

                {/* Assistant Message Actions: Copy, Regenerate */}
                {msg.role === 'assistant' && !msg.isStreaming && msg.text && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-zinc-400 text-[11px]">
                    <button 
                      onClick={() => handleCopyAnswer(msg.text, idx)} 
                      className="flex items-center gap-1.5 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                      title="Copy Answer"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Icons.Checkmark />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Icons.Copy />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleRegenerate(idx)} 
                      disabled={isBusy}
                      className="flex items-center gap-1.5 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-800 transition-colors disabled:opacity-40"
                      title="Regenerate response"
                    >
                      <Icons.Regenerate />
                      <span>Regenerate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Incremental Generation Status */}
          {isLoading && !isStreaming && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 px-1">GeoLens AI</span>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></div>
                <span className="font-mono text-zinc-400">Preparing inference stream...</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Stop Generating Control */}
        {isStreaming && (
          <div className="flex justify-center -mb-2 z-10">
            <button 
              onClick={handleStopGenerating} 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs font-mono border border-zinc-700 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Icons.Stop />
              <span>Stop Generating</span>
            </button>
          </div>
        )}

        {/* 4. CHAT COMPOSER */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 shrink-0">
          <div 
            onClick={() => chatInputRef.current?.focus()} 
            className="bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 rounded-2xl p-2.5 flex flex-col gap-2 transition-all cursor-text shadow-sm"
          >
            {/* Attached Thumbnail Preview with (X) */}
            {attachedImage && (
              <div className="relative inline-block w-fit ml-1 mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <img 
                  src={attachedImage.url} 
                  alt="Attachment preview" 
                  className="w-16 h-16 object-cover rounded-xl border border-zinc-700 shadow-md"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachedImage(null);
                    setTimeout(() => chatInputRef.current?.focus(), 50);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-200 flex items-center justify-center text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all shadow-md cursor-pointer"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Multiline Text Input */}
            <textarea
              ref={chatInputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isStreaming && (input.trim() || attachedImage)) {
                    handleSend();
                  }
                }
              }}
              onPaste={handleChatPaste}
              placeholder={
                attachedImage 
                  ? "આ ફોટા વિશે શું જાણવું છે? પૂછો... / Ask what to analyze in this photo..." 
                  : "Ask Geolens"
              }
              disabled={isStreaming}
              className="w-full bg-transparent text-zinc-100 text-xs font-sans placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed min-h-[36px] max-h-[130px] custom-scrollbar px-1 py-1"
            />

            {/* Action Row */}
            <div className="flex items-center justify-between pt-1 px-1" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }} 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                title="Attach Satellite Photo"
              >
                <Icons.Plus />
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isStreaming) {
                    handleStopGenerating();
                  } else {
                    handleSend();
                  }
                }} 
                disabled={!isStreaming && (!input.trim() && !attachedImage)} 
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  isStreaming 
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white' 
                    : 'bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-20 disabled:cursor-not-allowed'
                }`}
                title={isStreaming ? "Stop Generating" : "Send Query"}
              >
                {isStreaming ? <Icons.Stop /> : <Icons.Send />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MongoDB Atlas Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        API_URL={API_URL}
      />

      {/* Analyst Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem('geolens_user', JSON.stringify(updated));
        }}
        onLogout={handleLogout}
        API_URL={API_URL}
        authToken={authToken}
      />

      {/* MongoDB Atlas Satellite Analysis History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        API_URL={API_URL}
        authToken={authToken}
        onLoadAnalysis={handleLoadAnalysis}
      />
    </div>
  );
}

export default App;