import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "焚信",
  description: "一个无需数据库、支持快速部署到 Vercel 的阅后即焚文本工具。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
