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
    <main className="main-content">{children}</main>
  </div>
);
