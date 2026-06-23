import type {
  CareTask,
  DeviceRecord,
  DimensionStatus,
  ElderProfile,
  OperationalState,
  RiskResult,
} from "../types";
import type { CareLoopStatus, DisplayStatus } from "../lib/displayStatus";
import { displayToneToPillTone } from "../lib/displayStatus";
import {
  careLoopLabels,
  dimensionLabels,
  dimensionTone,
  operationalLabels,
  riskLabels,
  taskStatusLabels,
} from "../lib/statusLabels";
import { RiskBadge } from "./RiskBadge";
import { StatusPill } from "./StatusPill";

export interface HeatmapRow {
  profile: ElderProfile;
  risk: RiskResult;
  displayStatus: DisplayStatus;
  careLoopStatus: CareLoopStatus;
  task?: CareTask;
  deviceRecord?: DeviceRecord;
  memoryEstablished: boolean;
  operationalState: OperationalState;
  recentCareRecord?: string;
}

interface InstitutionHeatmapProps {
  rows: HeatmapRow[];
}

const dimensionItems = (risk: RiskResult): Array<{
  label: string;
  status: DimensionStatus;
}> => [
  { label: "生命體徵", status: risk.dimensions.vitals },
  { label: "活動", status: risk.dimensions.activity },
  { label: "睡眠", status: risk.dimensions.sleep },
  { label: "用藥", status: risk.dimensions.medication },
  { label: "安全", status: risk.dimensions.safety },
];

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatSyncTime = (value?: string) => value?.slice(11, 16) ?? "-";

export const InstitutionHeatmap = ({ rows }: InstitutionHeatmapProps) => {
  if (rows.length === 0) {
    return (
      <div className="institution-empty-state">
        目前沒有符合篩選條件的長者。
      </div>
    );
  }

  return (
    <div className="institution-card-list" aria-label="機構風險熱力圖">
      {rows.map(
        ({
          profile,
          risk,
          displayStatus,
          careLoopStatus,
          task,
          deviceRecord,
          memoryEstablished,
          operationalState,
          recentCareRecord,
        }) => {
          const dataQuality = deviceRecord?.dataQuality ?? risk.dataCompleteness;

          return (
            <article className="institution-elder-card" key={profile.elderId}>
              <header className="institution-elder-card__head">
                <div className="institution-elder-card__identity">
                  <strong>{profile.name}</strong>
                  <span>
                    {profile.age} 歲 · 房間 {profile.room}
                  </span>
                </div>

                <div className="institution-elder-card__status">
                  <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
                  <StatusPill
                    label={displayStatus.label}
                    tone={displayToneToPillTone(displayStatus.tone)}
                  />
                </div>
              </header>

              <div className="institution-elder-card__grid">
                <section>
                  <h3>前台展示狀態</h3>
                  <div className="institution-card-detail">
                    <StatusPill
                      label={displayStatus.label}
                      tone={displayToneToPillTone(displayStatus.tone)}
                    />
                    {displayStatus.shouldShowHistoricalRisk ? (
                      <span>今日曾出現高風險事件</span>
                    ) : (
                      <span>未顯示歷史高風險提示</span>
                    )}
                  </div>
                </section>

                <section>
                  <h3>今日風險等級</h3>
                  <div className="institution-card-detail">
                    <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
                    <strong>{riskLabels[risk.riskLevel]}</strong>
                  </div>
                </section>

                <section className="institution-elder-card__dimensions">
                  <h3>五維狀態</h3>
                  <div className="dimension-chip-row">
                    {dimensionItems(risk).map((item) => (
                      <span className="dimension-chip" key={item.label}>
                        <span>{item.label}</span>
                        <StatusPill
                          label={dimensionLabels[item.status]}
                          tone={dimensionTone(item.status)}
                        />
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3>設備 / 數據</h3>
                  <dl className="institution-data-list">
                    <div>
                      <dt>連線</dt>
                      <dd>
                        {deviceRecord?.connectionStatus === "online"
                          ? "在線"
                          : "離線"}
                      </dd>
                    </div>
                    <div>
                      <dt>佩戴</dt>
                      <dd>
                        {deviceRecord?.wearStatus === "worn"
                          ? "已佩戴"
                          : "未佩戴"}
                      </dd>
                    </div>
                    <div>
                      <dt>完整度</dt>
                      <dd>{formatPercent(dataQuality)}</dd>
                    </div>
                    <div>
                      <dt>來源</dt>
                      <dd>{deviceRecord?.dataSource ?? "Mock Data"}</dd>
                    </div>
                    <div>
                      <dt>同步</dt>
                      <dd>{formatSyncTime(deviceRecord?.lastSyncAt)}</dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3>照護記憶</h3>
                  <StatusPill
                    label={memoryEstablished ? "已建立" : "未建立"}
                    tone={memoryEstablished ? "stable" : "muted"}
                  />
                </section>

                <section>
                  <h3>任務狀態</h3>
                  <div className="institution-card-detail">
                    <strong>{careLoopLabels[careLoopStatus]}</strong>
                    {task ? <span>{taskStatusLabels[task.status]}</span> : null}
                    <span>運營：{operationalLabels[operationalState]}</span>
                  </div>
                </section>

                <section>
                  <h3>最近處理記錄</h3>
                  <p className="institution-recent-note">
                    {recentCareRecord || "暫無處理記錄"}
                  </p>
                </section>
              </div>

              <div className="institution-elder-card__actions">
                <a className="text-button" href={`#/elder/${profile.elderId}`}>
                  查看詳情
                </a>
                <a
                  className="text-button"
                  href={`#/elder/${profile.elderId}/profile`}
                >
                  檔案
                </a>
                <a
                  className="text-button"
                  href={`#/medication/${profile.elderId}`}
                >
                  用藥
                </a>
              </div>
            </article>
          );
        },
      )}
    </div>
  );
};
