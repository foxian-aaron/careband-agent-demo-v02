import { useState } from "react";
import { MemoryDraftCard } from "../components/MemoryDraftCard";
import { MemoryItemConfirmTable } from "../components/MemoryItemConfirmTable";
import { MockNoticeBanner } from "../components/MockNoticeBanner";
import { UnknownElderState } from "../components/UnknownElderState";
import { createMemoryDraft } from "../lib/mockBackendAdapter";
import {
  chenMemorySample,
  createMockInitialCareMemoryDraft,
} from "../lib/memoryExtractor";
import { useDemo } from "../store/demoStore";
import type { MemorySourceType } from "../types";

interface MemoryIntakePageProps {
  elderId: string;
}

const sourceOptions: Array<{ value: MemorySourceType; label: string }> = [
  { value: "family_oral", label: "家属口述" },
  { value: "caregiver_input", label: "护工录入" },
  { value: "medical_record_text", label: "病历单文字" },
  { value: "medication_list_text", label: "用药单文字" },
  { value: "institution_record", label: "机构记录" },
  { value: "other", label: "其他" },
];

export const MemoryIntakePage = ({ elderId }: MemoryIntakePageProps) => {
  const { state, dispatch } = useDemo();
  const [sourceType, setSourceType] = useState<MemorySourceType>("family_oral");
  const [input, setInput] = useState(chenMemorySample);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const profile = state.profiles[elderId];
  if (!profile) {
    return (
      <div className="page">
        <UnknownElderState elderId={elderId} />
      </div>
    );
  }
  const draft = state.memoryDraftsByElderId[profile.elderId];
  const savedMemory = state.initialCareMemoryByElderId[profile.elderId];

  const generateDraft = async () => {
    setLoading(true);
    const nextDraft = createMockInitialCareMemoryDraft(profile.elderId, input, sourceType);
    await createMemoryDraft(nextDraft);
    dispatch({ type: "CREATE_MEMORY_DRAFT", draft: nextDraft });
    setLoading(false);
    setSaved(false);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>导入历史资料 / Care Memory Intake</span>
          <h1>{profile.name}长者记忆初始化</h1>
          <p>用于解决设备初用时 AI 没有长期数据、个人基线和背景信息的冷启动问题。</p>
        </div>
        <a className="primary-link" href={`#/elder/${profile.elderId}`}>
          返回驾驶舱
        </a>
      </header>

      <MockNoticeBanner>
        請勿粘貼真實病歷、身份證明、電話、地址、Apple Health 原始資料或真實長者敏感資料；當前僅用於示例演示。
        Mock extractor 不會調用真實 QwenPaw / LLM。AI 生成的記憶草稿必須人工確認。本內容不構成醫療診斷。
      </MockNoticeBanner>

      <section className="panel memory-intake-form">
        <div className="section-title">
          <span>输入区</span>
          <h2>粘贴历史资料</h2>
        </div>
        <p className="trace-disclaimer">
          請勿粘貼真實病歷、身份證明、電話、地址、Apple Health 原始資料或真實長者敏感資料；當前僅用於示例演示。
          Mock extractor 不會調用真實 QwenPaw / LLM，AI 生成的記憶草稿必須人工確認，本內容不構成醫療診斷。
        </p>
        <label>
          <span>资料来源</span>
          <select value={sourceType} onChange={(event) => setSourceType(event.target.value as MemorySourceType)}>
            {sourceOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} />
        <div className="button-row">
          <button className="primary" onClick={generateDraft} disabled={loading || !input.trim()}>
            {loading ? "生成中..." : "生成初始照护记忆草稿"}
          </button>
          <button onClick={() => setInput(chenMemorySample)}>填入陈伯示例资料</button>
        </div>
      </section>

      {draft ? (
        <>
          <MemoryDraftCard draft={draft} />
          <MemoryItemConfirmTable draft={draft} dispatch={dispatch} />
          <section className="panel memory-save-panel">
            <div>
              <h2>保存到老人初始照护记忆</h2>
              <p className="muted-copy">
                AI 生成的是待确认的初始照护记忆，不构成医疗诊断，也不是最终病历。
              </p>
            </div>
            <button
              className="primary"
              onClick={() => {
                dispatch({ type: "SAVE_INITIAL_CARE_MEMORY", elderId: profile.elderId });
                setSaved(true);
              }}
            >
              保存到老人初始照护记忆
            </button>
            {saved || savedMemory ? (
              <p className="trace-disclaimer">
                已保存。返回驾驶舱后会显示：初始照护记忆已建立、动态状态基线建立中，以及高血压关注、跌倒风险关注、晚药易漏、粤语优先、夜间离床关注等标签。
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
};
