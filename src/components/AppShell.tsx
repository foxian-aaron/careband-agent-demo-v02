import type { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
}

export const AppShell = ({ children, currentPath }: AppShellProps) => (
  <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#/institution">
        <span>智护环</span>
        <strong>CareBand Agent</strong>
      </a>
      <Navigation currentPath={currentPath} />
      <div className="sidebar-note">
        <strong>Demo v0.2</strong>
        <p>前端 Mock 驱动的落地验证版：记忆、穿戴、硬件、Agent 与隐私边界。</p>
      </div>
    </aside>
    <main className="main-content">
      <div className="global-mock-banner" role="note">
        GitHub Pages 靜態 Mock 預覽版：當前不運行後端、不接真實 QwenPaw、不接真實穿戴服務；所有流程為前端 Mock / API Contract 展示。
      </div>
      {children}
    </main>
  </div>
);
