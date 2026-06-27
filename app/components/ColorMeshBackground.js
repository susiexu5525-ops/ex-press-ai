export default function ColorMeshBackground() {
  return (
    <>
      {/* 基础背景 Layer -30 */}
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />

      {/* 彩色渐变光晕 Layer -20 */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {/* 蓝色光晕 - 左上 */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px]" />
        {/* 紫色光晕 - 右上 */}
        <div className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full bg-purple-400/15 blur-[100px]" />
        {/* 青色光晕 - 左中 */}
        <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] rounded-full bg-cyan-400/15 blur-[80px]" />
        {/* 橙色光晕 - 右下 */}
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-orange-400/10 blur-[100px]" />
      </div>

      {/* 噪点纹理 Layer -10 */}
      <div className="fixed inset-0 -z-10 pointer-events-none noise-texture opacity-[0.03]" />
    </>
  );
}
