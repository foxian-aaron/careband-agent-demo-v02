import type {
  AgentRoleSummaries,
  CareEvent,
  DailySnapshot,
  ElderProfile,
  PersonalBaseline,
  RiskResult,
} from "../types";
import { buildMockQwenPawIO } from "../lib/qwenpawAdapter";

interface AgentIOPanelProps {
  profile: ElderProfile;
  baseline: PersonalBaseline;
  snapshot: DailySnapshot;
  events: CareEvent[];
  risk: RiskResult;
  summaries: AgentRoleSummaries;
}

export const AgentIOPanel = ({
  profile,
  baseline,
  snapshot,
  events,
  risk,
  summaries,
}: AgentIOPanelProps) => {
  const io = buildMockQwenPawIO(profile, baseline, snapshot, events, risk, summaries);

  return (
    <section className="panel agent-io-panel">
      <div className="section-title">
        <span>Mock QwenPaw Agent IO</span>
        <h2>结构化输入 / 多角色输出</h2>
      </div>
      <p className="muted-copy">
        当前版本使用 Mock Agent 输出，不接真實 QwenPaw API。下方仅展示 QwenPaw-compatible
        request / response contract，未来接入前需完成脱敏、授权和人工确认流程。
      </p>
      <div className="agent-io-grid">
        <div>
          <h3>Mock QwenPaw Request</h3>
          <pre>{JSON.stringify(io.request, null, 2)}</pre>
        </div>
        <div>
          <h3>Mock QwenPaw Response</h3>
          <pre>{JSON.stringify(io.response, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
};
