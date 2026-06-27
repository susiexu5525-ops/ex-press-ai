import "./globals.css";
import AppProvider from "./components/AppProvider";
import ColorMeshBackground from "./components/ColorMeshBackground";

export const metadata = {
  title: "ExPress AI — 高校外宣新闻翻译与审校",
  description: "AI辅助高校外宣新闻翻译与审校工具",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="relative min-h-screen">
        <AppProvider>{children}</AppProvider>
        <ColorMeshBackground />
      </body>
    </html>
  );
}
