import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BetmanPRO - 실시간 스포츠 분석 대시보드",
  description: "배트맨 프로토 & 토토 실시간 배당 분석 및 라이브 스코어 통합 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        {/* 라이트모드 깜빡임 방지 */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('betman-theme')==='light')document.documentElement.classList.add('light')}catch(e){}` }} />
      </head>
      <body className="min-h-screen bg-[var(--bg-base)] text-slate-100">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
