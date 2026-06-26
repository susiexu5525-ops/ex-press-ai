/**
 * localStorage 读写封装
 */

const KEYS = {
  TERMS: "ex-press-ai-terms",
  RULES: "ex-press-ai-rules",
  HISTORY: "ex-press-ai-history",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getTerms() {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEYS.TERMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setTerms(terms) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.TERMS, JSON.stringify(terms));
}

export function getRules() {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEYS.RULES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setRules(rules) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.RULES, JSON.stringify(rules));
}

export function getHistory() {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry) {
  if (!isBrowser()) return;
  const history = getHistory();
  history.unshift({ ...entry, id: Date.now(), time: new Date().toISOString() });
  // 只保留最近20条
  if (history.length > 20) history.length = 20;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

/**
 * 首次加载时初始化默认数据
 */
import defaultTerms from "@/data/defaultTerms.json";
import defaultRules from "@/data/defaultRules.json";

export function initDefaults() {
  if (!isBrowser()) return;
  const existingTerms = getTerms();
  const existingRules = getRules();
  if (existingTerms.length === 0) {
    setTerms(defaultTerms);
  }
  if (existingRules.length === 0) {
    setRules(defaultRules);
  }
}
