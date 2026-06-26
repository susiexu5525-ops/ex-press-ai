"use client";

import { useReducer, useEffect, createContext, useContext } from "react";
import Navbar from "./components/Navbar";
import TranslationPanel from "./components/TranslationPanel";
import ReviewPanel from "./components/ReviewPanel";
import TerminologyManager from "./components/TerminologyManager";
import RuleManager from "./components/RuleManager";
import { initDefaults } from "@/lib/storage";

// --- Context ---
export const AppContext = createContext(null);

const initialState = {
  // 翻译
  sourceText: "",
  translatedText: "",
  isTranslating: false,
  isReviewing: false,

  // 术语
  detectedTerms: [],
  showTermManager: false,

  // 规则
  appliedRules: [],
  showRuleManager: false,

  // 审校
  annotations: [],
  activeAnnotation: null,

  // UI
  activeTab: "translate",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_SOURCE_TEXT":
      return { ...state, sourceText: action.payload };
    case "SET_TRANSLATED_TEXT":
      return { ...state, translatedText: action.payload };
    case "SET_IS_TRANSLATING":
      return { ...state, isTranslating: action.payload };
    case "SET_IS_REVIEWING":
      return { ...state, isReviewing: action.payload };
    case "SET_DETECTED_TERMS":
      return { ...state, detectedTerms: action.payload };
    case "SET_APPLIED_RULES":
      return { ...state, appliedRules: action.payload };
    case "SET_ANNOTATIONS":
      return { ...state, annotations: action.payload };
    case "SET_ACTIVE_ANNOTATION":
      return { ...state, activeAnnotation: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "TOGGLE_TERM_MANAGER":
      return { ...state, showTermManager: !state.showTermManager };
    case "TOGGLE_RULE_MANAGER":
      return { ...state, showRuleManager: !state.showRuleManager };
    case "RESET":
      return {
        ...initialState,
        showTermManager: state.showTermManager,
        showRuleManager: state.showRuleManager,
      };
    default:
      return state;
  }
}

export function useApp() {
  return useContext(AppContext);
}

export default function RootLayout({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    initDefaults();
  }, []);

  return (
    <html lang="zh-CN">
      <head>
        <title>ex·press·AI — 高校外宣新闻翻译与审校</title>
        <meta
          name="description"
          content="AI辅助高校外宣新闻翻译与审校工具"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50">
        <AppContext.Provider value={{ state, dispatch }}>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
          {state.showTermManager && <TerminologyManager />}
          {state.showRuleManager && <RuleManager />}
        </AppContext.Provider>
      </body>
    </html>
  );
}
