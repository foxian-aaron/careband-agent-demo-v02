import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../components/AppShell";
import { AgentTracePanel } from "../components/AgentTracePanel";
import { DemoProvider, type DemoAction } from "../store/demoStore";
import { ElderDashboardPage } from "../pages/ElderDashboardPage";
import { ElderProfilePage } from "../pages/ElderProfilePage";
import { FamilyPage } from "../pages/FamilyPage";
import { MemoryIntakePage } from "../pages/MemoryIntakePage";
import { MedicationPage } from "../pages/MedicationPage";
import { ConsentPrivacyPage } from "../pages/ConsentPrivacyPage";
import { isFutureWearableSource, WearableImportPage } from "../pages/WearableImportPage";
import { demoStorageKey, resetLocalDemoState } from "../lib/demoReset";
import { parseWearableCsv, wearableCsvExample } from "../lib/wearableImport";

const renderWithDemo = (node: React.ReactElement) =>
  renderToStaticMarkup(<DemoProvider>{node}</DemoProvider>);

describe("public mock safety UI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AppShell renders the global GitHub Pages Mock preview banner", () => {
    const html = renderToStaticMarkup(
      <AppShell currentPath="/institution">
        <div>content</div>
      </AppShell>,
    );

    expect(html).toContain("GitHub Pages 靜態 Mock 預覽版");
    expect(html).toContain("當前不運行後端");
    expect(html).toContain("前端 Mock / API Contract");
  });

  it("unknown elder pages show UnknownElderState instead of Chen data", () => {
    const pages = [
      <ElderDashboardPage elderId="UNKNOWN" />,
      <ElderProfilePage elderId="UNKNOWN" />,
      <MemoryIntakePage elderId="UNKNOWN" />,
      <WearableImportPage elderId="UNKNOWN" />,
      <MedicationPage elderId="UNKNOWN" />,
      <ConsentPrivacyPage elderId="UNKNOWN" />,
      <FamilyPage elderId="UNKNOWN" />,
    ];

    for (const page of pages) {
      const html = renderWithDemo(page);
      expect(html).toContain("資料未載入：找不到此長者資料。");
      expect(html).toContain("系統不會自動切換到陳伯 E001");
      expect(html).not.toContain("陈伯");
    }
  });

  it("MemoryIntakePage warns against real sensitive data and keeps medical boundary", () => {
    const html = renderWithDemo(<MemoryIntakePage elderId="E001" />);

    expect(html).toContain("請勿粘貼真實病歷");
    expect(html).toContain("Mock extractor");
    expect(html).toContain("AI 生成的記憶草稿必須人工確認");
    expect(html).toContain("不構成醫療診斷");
  });

  it("WearableImportPage labels future sources as not connected", () => {
    const html = renderWithDemo(<WearableImportPage elderId="E001" />);

    expect(html).toContain("Apple Health");
    expect(html).toContain("Future Integration");
    expect(html).toContain("當前未接入真實服務");
    expect(html).toContain("v0.2 公網版不會讀取真實穿戴資料");
    expect(isFutureWearableSource("Apple Health")).toBe(true);
    expect(isFutureWearableSource("Mock wearable sample")).toBe(false);
  });

  it("Mock Data and CSV sample imports parse with safe source labels", () => {
    const mockRows = parseWearableCsv("E001", wearableCsvExample, "Mock wearable sample");
    const csvRows = parseWearableCsv("E001", wearableCsvExample, "CSV 示例數據");

    expect(mockRows.length).toBeGreaterThan(0);
    expect(csvRows.length).toBeGreaterThan(0);
    expect(mockRows[0].dataSource).toBe("Mock wearable sample");
    expect(csvRows[0].dataSource).toBe("CSV 示例數據");
  });

  it("AgentTracePanel shows Mock Agent, future QwenPaw, redaction, and medical disclaimer", () => {
    const html = renderWithDemo(<AgentTracePanel elderId="E001" />);

    expect(html).toContain("Mock Agent");
    expect(html).toContain("QwenPaw");
    expect(html).toContain("脫敏");
    expect(html).toContain("本結果僅為照護風險提示，不構成醫療診斷。");
  });

  it("resetLocalDemoState clears the local demo key and dispatches RESET_DEMO", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const removeItem = vi.fn();
    const actions: DemoAction[] = [];

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: { removeItem } },
    });

    resetLocalDemoState((action) => actions.push(action));

    expect(removeItem).toHaveBeenCalledWith(demoStorageKey);
    expect(actions).toEqual([{ type: "RESET_DEMO" }]);

    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});
