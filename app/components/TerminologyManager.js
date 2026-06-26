"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/app/components/AppProvider";
import { getTerms, setTerms } from "@/lib/storage";
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Search,
  Save,
  Undo2,
} from "lucide-react";
import defaultTerms from "@/data/defaultTerms.json";

export default function TerminologyManager() {
  const { dispatch } = useApp();
  const [terms, setLocalTerms] = useState([]);
  const [search, setSearch] = useState("");
  const [newZh, setNewZh] = useState("");
  const [newEn, setNewEn] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editZh, setEditZh] = useState("");
  const [editEn, setEditEn] = useState("");

  useEffect(() => {
    setLocalTerms(getTerms());
  }, []);

  const handleClose = () => {
    dispatch({ type: "TOGGLE_TERM_MANAGER" });
  };

  const handleSave = () => {
    setTerms(terms);
    dispatch({ type: "TOGGLE_TERM_MANAGER" });
  };

  const handleAdd = () => {
    if (!newZh.trim() || !newEn.trim()) return;
    const newTerm = {
      id: `t${Date.now()}`,
      zh: newZh.trim(),
      en: newEn.trim(),
    };
    const updated = [...terms, newTerm];
    setLocalTerms(updated);
    setNewZh("");
    setNewEn("");
  };

  const handleDelete = (id) => {
    setLocalTerms(terms.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleStartEdit = (term) => {
    setEditingId(term.id);
    setEditZh(term.zh);
    setEditEn(term.en);
  };

  const handleConfirmEdit = () => {
    if (!editZh.trim() || !editEn.trim()) return;
    setLocalTerms(
      terms.map((t) =>
        t.id === editingId ? { ...t, zh: editZh.trim(), en: editEn.trim() } : t
      )
    );
    setEditingId(null);
  };

  const handleReset = () => {
    if (confirm("确定恢复为默认术语库？当前修改将丢失。")) {
      setLocalTerms([...defaultTerms]);
    }
  };

  const filtered = search
    ? terms.filter(
        (t) =>
          t.zh.includes(search) ||
          t.en.toLowerCase().includes(search.toLowerCase())
      )
    : terms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                术语库管理
              </h2>
              <p className="text-xs text-slate-400">
                {terms.length} 个术语 | 自动识别原文中的术语
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Search + Add */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索术语..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newZh}
              onChange={(e) => setNewZh(e.target.value)}
              placeholder="中文术语"
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <span className="text-slate-300">→</span>
            <input
              type="text"
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder="English term"
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!newZh.trim() || !newEn.trim()}
              className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Term List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1.5">
            {filtered.map((term) => (
              <div
                key={term.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 group transition-colors"
              >
                {editingId === term.id ? (
                  <>
                    <input
                      type="text"
                      value={editZh}
                      onChange={(e) => setEditZh(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-brand-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleConfirmEdit()}
                    />
                    <span className="text-slate-300">→</span>
                    <input
                      type="text"
                      value={editEn}
                      onChange={(e) => setEditEn(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-brand-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      onKeyDown={(e) => e.key === "Enter" && handleConfirmEdit()}
                    />
                    <button
                      onClick={handleConfirmEdit}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Save size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-700 font-medium">
                      {term.zh}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="flex-1 text-sm text-slate-600">
                      {term.en}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(term)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                {search ? "没有匹配的术语" : "术语库为空，请添加术语"}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <Undo2 size={13} />
            恢复默认
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
