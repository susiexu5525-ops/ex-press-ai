"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/app/components/AppProvider";
import { getRules, setRules } from "@/lib/storage";
import {
  X,
  Plus,
  Trash2,
  ShieldCheck,
  Search,
  Save,
  Undo2,
  ShieldAlert,
  Shield,
} from "lucide-react";
import defaultRules from "@/data/defaultRules.json";

const severityColors = {
  强制: "bg-red-100 text-red-700 border-red-200",
  建议: "bg-blue-100 text-blue-700 border-blue-200",
};

const typeLabels = {
  school: "学校规范",
  mentor: "导师规范",
};

export default function RuleManager() {
  const { dispatch } = useApp();
  const [rules, setLocalRules] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // 新增表单
  const [formName, setFormName] = useState("");
  const [formPattern, setFormPattern] = useState("");
  const [formReplacement, setFormReplacement] = useState("");
  const [formSeverity, setFormSeverity] = useState("强制");
  const [formType, setFormType] = useState("school");
  const [formNote, setFormNote] = useState("");

  // 编辑
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setLocalRules(getRules());
  }, []);

  const handleClose = () => {
    dispatch({ type: "TOGGLE_RULE_MANAGER" });
  };

  const handleSave = () => {
    setRules(rules);
    dispatch({ type: "TOGGLE_RULE_MANAGER" });
  };

  const handleAdd = () => {
    if (!formName.trim() || !formPattern.trim()) return;
    const newRule = {
      id: Date.now(),
      type: formType,
      name: formName.trim(),
      pattern: formPattern.trim(),
      replacement: formReplacement.trim(),
      severity: formSeverity,
      note: formNote.trim(),
    };
    setLocalRules([...rules, newRule]);
    resetForm();
  };

  const resetForm = () => {
    setFormName("");
    setFormPattern("");
    setFormReplacement("");
    setFormSeverity("强制");
    setFormType("school");
    setFormNote("");
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setLocalRules(rules.filter((r) => r.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleReset = () => {
    if (confirm("确定恢复为默认规则库？当前修改将丢失。")) {
      setLocalRules([...defaultRules]);
    }
  };

  const filtered = search
    ? rules.filter(
        (r) =>
          r.name.includes(search) ||
          r.pattern.toLowerCase().includes(search.toLowerCase()) ||
          r.note.includes(search)
      )
    : rules;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <ShieldCheck size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                规则库管理
              </h2>
              <p className="text-xs text-slate-400">
                {rules.length} 条规则 | 译文生成后自动应用
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

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索规则..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-600 text-white
                rounded-xl hover:bg-brand-700 transition-colors font-medium"
            >
              <Plus size={16} />
              新增
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="规则名称（如：校名统一）"
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="school">学校规范</option>
                    <option value="mentor">导师规范</option>
                  </select>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="强制">强制</option>
                    <option value="建议">建议</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formPattern}
                  onChange={(e) => setFormPattern(e.target.value)}
                  placeholder="匹配模式（支持正则）"
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg font-mono
                    focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
                <input
                  type="text"
                  value={formReplacement}
                  onChange={(e) => setFormReplacement(e.target.value)}
                  placeholder="替换为..."
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
              </div>
              <textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="规则说明..."
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formName.trim() || !formPattern.trim()}
                  className="px-4 py-1.5 text-xs bg-brand-600 text-white rounded-lg
                    hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  添加规则
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rule List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filtered.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm
                  transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-sm font-medium text-slate-700">
                        {rule.name}
                      </h4>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                          severityColors[rule.severity] ||
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {rule.severity === "强制" ? (
                          <ShieldAlert size={10} className="inline mr-0.5" />
                        ) : (
                          <Shield size={10} className="inline mr-0.5" />
                        )}
                        {rule.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">
                        {typeLabels[rule.type] || rule.type}
                      </span>
                    </div>

                    {rule.pattern && (
                      <div className="flex items-center gap-2 text-xs mb-1.5">
                        <code className="px-2 py-0.5 bg-red-50 text-red-600 rounded font-mono text-[11px]">
                          {rule.pattern}
                        </code>
                        {rule.replacement && (
                          <>
                            <span className="text-slate-300">→</span>
                            <code className="px-2 py-0.5 bg-green-50 text-green-600 rounded font-mono text-[11px]">
                              {rule.replacement}
                            </code>
                          </>
                        )}
                      </div>
                    )}

                    {rule.note && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {rule.note}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg
                      opacity-0 group-hover:opacity-100 transition-all"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                {search ? "没有匹配的规则" : "规则库为空，请添加规则"}
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
