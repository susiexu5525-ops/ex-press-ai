"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "./components/AppProvider";
import { getTerms, getRules } from "@/lib/storage";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [termCount, setTermCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);

  useEffect(() => {
    setTermCount(getTerms().length);
    setRuleCount(getRules().length);
  }, []);

  const goTo = (path) => {
    router.push(path);
  };

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col justify-between items-center py-4 px-6 bg-[#EFECE4] select-none box-border z-0">

        {/* 重新注入：全局复古多重碎纸拼贴背景（不带任何 blur） */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* 粉色块 ── 顶部主色 */}
          <div className="absolute top-[-10rem] left-[10%] w-[45vw] h-[25rem] bg-[#db5d8f] rounded-[30%_70%_40%_60%/_50%_30%_70%_50%] opacity-90" />
          {/* 橙色块 ── 左上角撕纸 */}
          <div className="absolute top-[-5rem] left-[-10rem] w-[35vw] h-[35rem] bg-[#d94e1d] rounded-[40%_60%_30%_70%/_60%_40%_70%_30%] opacity-95" />
          {/* 蓝色块 ── 右上方主拼贴层 */}
          <div className="absolute top-[-8rem] right-[-10rem] w-[50vw] h-[45rem] bg-[#2496c7] rounded-[50%_50%_30%_70%/_40%_60%_40%_60%] opacity-90" />
          {/* 黄色块 ── 左下大面积底衬 */}
          <div className="absolute bottom-[-12rem] left-[-5rem] w-[45vw] h-[45rem] bg-[#e6c412] rounded-[70%_30%_60%_40%/_50%_50%_60%_40%] opacity-95" />
          {/* 绿色块 ── 右下大面积拼接 */}
          <div className="absolute bottom-[-10rem] right-[-8rem] w-[50vw] h-[45rem] bg-[#008f85] rounded-[40%_60%_50%_50%/_60%_40%_60%_40%] opacity-90" />
        </div>

      {/* 中央复古报纸铅字 Logo 与标题区 */}
      <div className="flex flex-col items-center text-center flex-shrink-0 mt-3 mb-2">
        {/* 1. 复古圆形徽章 ── 代替现代蓝光 icon */}
        <div className="w-16 h-16 bg-[#faf8f5] border-2 border-[#c2bba8] rounded-full flex items-center justify-center shadow-md relative overflow-hidden mb-3">
          {/* 内部用一个小打字机或星芒符号作为复古主印章 */}
          <svg className="w-9 h-9 text-[#3d3226]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <div className="absolute inset-0.5 border border-[#e8e4d8] rounded-full pointer-events-none" />
        </div>

        {/* 2. 报纸头版印刷风主标题 ── 代替原来的亮蓝现代字体 */}
        <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-widest text-[#2c241c] uppercase flex items-center gap-2">
          EX <span className="text-[#c85a3e] select-none">•</span> PRESS <span className="font-sans text-xl font-light text-[#8c7e6c] lowercase italic ml-1">ai</span>
        </h1>

        {/* 3. 复古打字机字型副标题 */}
        <p className="font-mono text-xs tracking-widest text-[#7c6e5c] uppercase mt-2 bg-[#eae5d8]/60 px-3 py-0.5 rounded-sm border border-[#decfa6]/40">
          AI翻译 · 审校 · 术语管理系统
        </p>
      </div>

      {/* 四个功能入口 — 做旧质感信纸底框 */}
      <div className="w-full max-w-6xl h-[62vh] max-h-[65vh] p-6 bg-[#fbf9f3] border border-[#e3ded0] rounded-[8px_25px_10px_20px] shadow-[4px_8px_20px_rgba(61,50,38,0.15)] relative flex flex-col sm:flex-row gap-4 justify-between items-stretch overflow-hidden flex-shrink-0 z-10">

        {/* 复古金属回形针 — 右上角 */}
        <div className="absolute -top-3 right-12 w-6 h-14 border-2 border-slate-500 rounded-full rotate-[15deg] opacity-80 pointer-events-none shadow-sm after:content-[''] after:absolute after:inset-1 after:border-2 after:border-slate-500 after:rounded-full z-20" />

        {/* 复古邮戳印章 — 右下角 */}
        <div className="absolute bottom-4 right-8 border-2 border-dashed border-[#c85a3e]/60 text-[#c85a3e]/70 px-3 py-1 font-mono text-xs uppercase tracking-widest rotate-[-8deg] rounded-sm pointer-events-none select-none font-bold z-20">
          EXPRESS MAIL
        </div>

        {/* 左下角编辑部小标签 */}
        <div className="absolute bottom-6 left-6 bg-[#f4f0e6] border border-[#dcd6bf] p-2 px-4 shadow-sm rotate-[-3deg] pointer-events-none z-20">
          <div className="font-serif text-[10px] text-slate-500 tracking-wider">编辑部 · 第25期</div>
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">EDITORIAL DEPT.</div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-6 w-full px-4 h-full py-4">
        {/* 翻译 */}
        <button
          onClick={() => goTo("/translate")}
          className="bg-[#faf8f5] border border-[#e2dec9] rounded-sm p-6 flex flex-col items-center justify-between shadow-[2px_5px_15px_rgba(61,50,38,0.12)] min-h-[300px] py-9 transition-all duration-300 hover:-translate-y-2 hover:shadow-[5px_10px_25px_rgba(61,50,38,0.2)] rotate-[-1.5deg] hover:rotate-0"
        >
          {/* 翻译图标：复古打字机与手绘圆 */}
          <div className="w-24 h-24 bg-[#e6c412] rounded-[55%_45%_52%_48%/_45%_52%_48%_55%] flex items-center justify-center shadow-[inset_1px_2px_4px_rgba(0,0,0,0.15)] relative mb-3">
            {/* 手绘拟物打字机核心 */}
            <div className="w-14 h-12 relative flex flex-col items-center justify-end">
              {/* 滚筒纸张 */}
              <div className="w-8 h-4 bg-[#f4f0e6] border border-[#3d3226] rounded-t-sm absolute top-0 shadow-sm flex items-center justify-center">
                <div className="w-5 h-[1px] bg-slate-400" />
              </div>
              {/* 打字机机身 */}
              <div className="w-14 h-8 bg-[#2c241c] rounded-b-md border border-[#1a1510] relative z-10 shadow-md flex flex-col justify-between p-1">
                {/* 键盘区细节 */}
                <div className="grid grid-cols-4 gap-0.5 mt-auto">
                  {[...Array(8)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#e6c412] rounded-full scale-75" />)}
                </div>
              </div>
              {/* 底部铸铁阴影 */}
              <div className="w-12 h-1 bg-black/20 absolute bottom-[-2px] blur-[1px] rounded-full" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-wider text-slate-800 mt-4 font-serif">智能翻译</div>
            <div className="font-mono text-xs tracking-widest text-slate-400 uppercase mt-1">Translate</div>
          </div>
          <ArrowRight size={20} className="text-slate-600 font-bold text-xl transition-transform hover:translate-x-1 mt-3" />
        </button>

        {/* 审校 */}
        <button
          onClick={() => goTo("/review")}
          className="bg-[#faf8f5] border border-[#e2dec9] rounded-sm p-6 flex flex-col items-center justify-between shadow-[2px_5px_15px_rgba(61,50,38,0.12)] min-h-[300px] py-9 transition-all duration-300 hover:-translate-y-2 hover:shadow-[5px_10px_25px_rgba(61,50,38,0.2)] rotate-[1.2deg] hover:rotate-0"
        >
          {/* 审校润色卡片图标区 ── 精准修复版 */}
          <div className="w-24 h-24 bg-[#db5d8f] rounded-[48%_52%_45%_55%/_50%_45%_55%_50%] flex items-center justify-center shadow-[inset_1px_2px_4px_rgba(0,0,0,0.15)] relative mb-3 flex-shrink-0">
            {/* 整体倾斜的复古放大镜组合容器 */}
            <div className="w-14 h-14 relative rotate-[-15deg] flex items-center justify-center">
              
              {/* 1. 木质/复古手柄 ── 先渲染底层 */}
              <div className="w-2 h-7 bg-[#2c241c] border border-black/20 rounded-b-sm absolute bottom-0 right-[4px] rotate-[45deg] origin-top shadow-sm z-10">
                {/* 金属铜套箍 */}
                <div className="w-full h-1.5 bg-[#decfa6] absolute top-0" />
              </div>

              {/* 2. 放大镜镜框 ── 盖在手柄上方，防止断裂穿模 */}
              <div className="w-10 h-10 rounded-full border-[3px] border-[#decfa6] bg-slate-100/30 backdrop-blur-[0.5px] shadow-md absolute top-1 left-1 z-20 flex items-center justify-center">
                {/* 玻璃镜片内高光 */}
                <div className="w-8 h-8 rounded-full border border-white/10 relative">
                  <div className="absolute top-1 left-1 w-2 h-1 bg-white/40 rounded-full rotate-[-30deg]" />
                </div>
              </div>

            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-wider text-slate-800 mt-4 font-serif">审校润色</div>
            <div className="font-mono text-xs tracking-widest text-slate-400 uppercase mt-1">Review</div>
          </div>
          <ArrowRight size={20} className="text-slate-600 font-bold text-xl transition-transform hover:translate-x-1 mt-3" />
        </button>

        {/* 术语库 */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_TERM_MANAGER" })}
          className="bg-[#faf8f5] border border-[#e2dec9] rounded-sm p-6 flex flex-col items-center justify-between shadow-[2px_5px_15px_rgba(61,50,38,0.12)] min-h-[300px] py-9 transition-all duration-300 hover:-translate-y-2 hover:shadow-[5px_10px_25px_rgba(61,50,38,0.2)] rotate-[-1deg] hover:rotate-0"
        >
          {/* 术语图标：层叠复古档案袋与手绘圆 */}
          <div className="w-24 h-24 bg-[#2496c7] rounded-[52%_48%_50%_50%/_48%_52%_48%_52%] flex items-center justify-center shadow-[inset_1px_2px_4px_rgba(0,0,0,0.15)] relative mb-3">
            {/* 风琴卡片袋 */}
            <div className="w-14 h-12 relative flex items-end justify-center">
              {/* 后层卡片 */}
              <div className="w-10 h-9 bg-[#f4f0e6] border border-[#7c6e5c] rounded-t-sm absolute top-1 left-3 rotate-[-5deg] shadow-sm" />
              {/* 前层牛皮纸夹 */}
              <div className="w-13 h-9 bg-[#decfa6] border border-[#aa9f7f] rounded-sm relative z-10 shadow-md p-1">
                {/* 侧面索引标签 */}
                <div className="w-4 h-1.5 bg-[#decfa6] border-t border-x border-[#aa9f7f] rounded-t-sm absolute top-[-7px] left-2" />
                {/* 封面标签条 */}
                <div className="w-8 h-2 bg-white/70 border border-black/10 mx-auto mt-2 rounded-[1px]" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c85a3e] text-[#faf8f5] text-[10px] font-bold
              rounded-full flex items-center justify-center shadow-sm" style={{ fontFamily: "'Courier New', monospace" }}>
              {termCount}
            </span>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-wider text-slate-800 mt-4 font-serif">术语库</div>
            <div className="font-mono text-xs tracking-widest text-slate-400 uppercase mt-1">Termbase</div>
          </div>
          <ArrowRight size={20} className="text-slate-600 font-bold text-xl transition-transform hover:translate-x-1 mt-3" />
        </button>

        {/* 规则库 */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_RULE_MANAGER" })}
          className="bg-[#faf8f5] border border-[#e2dec9] rounded-sm p-6 flex flex-col items-center justify-between shadow-[2px_5px_15px_rgba(61,50,38,0.12)] min-h-[300px] py-9 transition-all duration-300 hover:-translate-y-2 hover:shadow-[5px_10px_25px_rgba(61,50,38,0.2)] rotate-[1.8deg] hover:rotate-0"
        >
          {/* 规则图标：三层立式老铁皮柜与手绘圆 */}
          <div className="w-24 h-24 bg-[#008f85] rounded-[50%_50%_48%_52%/_52%_48%_52%_48%] flex items-center justify-center shadow-[inset_1px_2px_4px_rgba(0,0,0,0.15)] relative mb-3">
            {/* 工业风复古文件柜 */}
            <div className="w-9 h-13 bg-[#3d4a41] border-2 border-[#222c26] rounded-sm shadow-xl flex flex-col justify-between p-1 relative">
              {/* 三层抽屉细节 */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full h-3 border border-[#222c26] bg-[#4a584e] rounded-[1px] relative flex items-center justify-center">
                  {/* 金属拉手 */}
                  <div className="w-3 h-[2px] bg-[#decfa6] rounded-full shadow-sm" />
                  {/* 标签卡槽 */}
                  <div className="w-1 h-1 bg-white/20 absolute right-1 scale-75" />
                </div>
              ))}
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c85a3e] text-[#faf8f5] text-[10px] font-bold
              rounded-full flex items-center justify-center shadow-sm" style={{ fontFamily: "'Courier New', monospace" }}>
              {ruleCount}
            </span>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold tracking-wider text-slate-800 mt-4 font-serif">规则库</div>
            <div className="font-mono text-xs tracking-widest text-slate-400 uppercase mt-1">Rules</div>
          </div>
          <ArrowRight size={20} className="text-slate-600 font-bold text-xl transition-transform hover:translate-x-1 mt-3" />
        </button>
      </div>
      </div>
    </div>
    </>
  );
}
