import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ThemeProvider from "./lib/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMRS Sejiwa - Rekam Medis Elektronik",
  description: "Sistem Informasi Manajemen Rumah Sakit Sejiwa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, position: "relative" }}>
        {/* Animated Liquid Background Blobs */}
        <div className="liquid-bg-container">
          <div className="liquid-blob blob-1"></div>
          <div className="liquid-blob blob-2"></div>
          <div className="liquid-blob blob-3"></div>
          <div className="liquid-blob blob-4"></div>
        </div>
        
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
