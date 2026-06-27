"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function MemoryPage() {
  const router = useRouter();

  return (
    <div className="w-full space-y-6">
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回首页
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <ShieldCheck size={20} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">规则库</h1>
          <p className="text-xs text-slate-400">管理翻译审校规则</p>
        </div>
      </div>

      <div className="bg-[#faf8f5] rounded-sm border border-[#e2dec9] shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6">
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-16 h-16 bg-[#29ABE2]/10 rounded-sm flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-[#29ABE2]" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2 font-mono">规则管理</h2>
          <p className="text-slate-400 text-sm max-w-md font-mono">
            在首页点击"规则库"按钮可以打开规则管理器弹窗，配置翻译和审校的强制规范规则。
          </p>
        </div>
      </div>
    </div>
  );
}
