import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "秋招时间表",
  description: "记录投递、笔试与面试的本地秋招时间表",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
