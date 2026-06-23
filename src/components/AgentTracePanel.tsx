import { buildAgentTrace } from "../lib/agentTrace";
import {
  getAgentSummariesForElder,
  getAgentTraceForElder,
  getEventsForElder,
  getRiskForElder,
  useDemo,
} from "../store/demoStore";
import { FutureIntegrationBadge } from "./FutureIntegrationBadge";
import { MockNoticeBanner } from "./MockNoticeBanner";

interface AgentTracePanelProps {
  elderId: string;
}

export const AgentTracePanel = ({ elderId }: AgentTracePanelProps) => {
  const { state, dispatch } = useDemo();
  const profile = state.profiles[elderId];
  const events = getEventsForElder(state, elderId);
  const risk = getRiskForElder(state, elderId);
  const summaries = getAgentSummariesForElder(state, elderId);
  const trace = getAgentTraceForElder(state, elderId);
  const buildTrace = (status: "ready" | "fallback_rule") =>
    buildAgentTrace({
      profile,
      baseline: state.baselines[elderId],
      snapshot: state.snapshots[elderId],
      events,
      risk,
      summaries,
      initialCareMemory: state.initialCareMemoryByElderId[elderId],
      deviceRecord: state.deviceRecords[elderId],
      status,
    });

  return (
    <section className="panel agent-trace-panel">
      <div className="section-title with-actions">
        <div>
          <span>AI Agent 调用面板</span>
          <h2>Agent Request / Response Trace</h2>
        </div>
        <div className="button-row">
          <button onClick={() => dispatch({ type: "GENERATE_AGENT_SUMMARY", trace: buildTrace("ready") })}>
            重新生成 Agent 摘要（Mock）
          </button>
          <button onClick={() => dispatch({ type: "SIMULATE_AGENT_FAILURE", elderId })}>
            模拟 Agent 失败
          </button>
          <button
            className="primary"
            onClick={() =>
              dispatch({ type: "FALLBACK_TO_RULE_SUMMARY", trace: buildTrace("fallback_rule") })
            }
          >
            模拟 Agent fallback
          </button>
        </div>
      </div>
      <MockNoticeBanner>
        当前为 Mock Agent；QwenPaw 是 future-compatible integration point，當前未接入真實 QwenPaw API。
        本結果僅為照護風險提示，不構成醫療診斷。
      </MockNoticeBanner>
      <p className="trace-disclaimer">
        Trace 面板為開發 / 評審演示視圖；真實產品中會先脫敏原始語音、病歷、位置與設備 payload，家屬端不會看到完整 Agent Request。
      </p>
      <div className="tag-row">
        <FutureIntegrationBadge label={trace.status === "failed" ? "Mock Agent Failed" : "Mock Agent"} />
        <FutureIntegrationBadge label="QwenPaw-compatible endpoint planned" />
        <FutureIntegrationBadge label="Future Integration" />
        <FutureIntegrationBadge label="API Contract" />
        <FutureIntegrationBadge label="Frontend simulation" />
        <FutureIntegrationBadge label="Fallback Ready" />
      </div>
      {trace.status === "failed" ? (
        <p className="trace-disclaimer">Agent 暂不可用，已 fallback 到规则摘要。</p>
      ) : null}
      <div className="agent-output-cards">
        <article>
          <span>护工摘要</span>
          <p>{trace.response.caregiver_summary}</p>
        </article>
        <article>
          <span>家属摘要</span>
          <p>{trace.response.family_summary}</p>
        </article>
        <article>
          <span>机构摘要</span>
          <p>{trace.response.institution_summary}</p>
        </article>
      </div>
      <p className="trace-disclaimer">
        本結果僅為照護風險提示，不構成醫療診斷。{trace.response.safety_disclaimer}
      </p>
      <div className="agent-io-grid">
        <details open>
          <summary>Agent Request · Demo trace sample / would be redacted in production</summary>
          <pre>{JSON.stringify(trace.request, null, 2)}</pre>
        </details>
        <details open>
          <summary>Agent Response</summary>
          <pre>{JSON.stringify(trace.response, null, 2)}</pre>
        </details>
      </div>
    </section>
  );
};
