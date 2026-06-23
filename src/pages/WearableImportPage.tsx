import { useState } from "react";
import { DataQualityBadge } from "../components/DataQualityBadge";
import { MockNoticeBanner } from "../components/MockNoticeBanner";
import { UnknownElderState } from "../components/UnknownElderState";
import { WearableDataSourceBadge } from "../components/WearableDataSourceBadge";
import { importWearableData } from "../lib/mockBackendAdapter";
import {
  chenWearableSevenDayCsv,
  parseWearableCsv,
  wearableCsvExample,
} from "../lib/wearableImport";
import { useDemo } from "../store/demoStore";
import type { WearableDataSource } from "../types";

interface WearableImportPageProps {
  elderId: string;
}

const activeSources: Array<{ label: string; value: WearableDataSource }> = [
  { label: "Mock Data", value: "Mock wearable sample" },
  { label: "CSV 示例數據 / CSV Sample", value: "CSV 示例數據" },
];

const futureSources = [
  "Apple Health",
  "Android Health Connect",
  "Fitbit",
  "Zepp / Amazfit",
] as const;

export const isFutureWearableSource = (source: WearableDataSource) =>
  (futureSources as readonly string[]).includes(source);

export const WearableImportPage = ({ elderId }: WearableImportPageProps) => {
  const { state, dispatch } = useDemo();
  const [source, setSource] = useState<WearableDataSource>("CSV 示例數據");
  const [csv, setCsv] = useState(wearableCsvExample);
  const [loading, setLoading] = useState(false);
  const [futureNotice, setFutureNotice] = useState("");
  const profile = state.profiles[elderId];
  if (!profile) {
    return (
      <div className="page">
        <UnknownElderState elderId={elderId} />
      </div>
    );
  }
  const latestImport = state.wearableImports[profile.elderId]?.[0];

  const runImport = async (csvText: string, dataSource: WearableDataSource) => {
    if (isFutureWearableSource(dataSource)) {
      setFutureNotice(
        "此來源目前僅展示未來接入點。v0.2 公網版不會讀取真實穿戴資料。不會調用真實 Apple Health / Health Connect / Fitbit / Zepp API。",
      );
      return;
    }
    const snapshots = parseWearableCsv(profile.elderId, csvText, dataSource);
    if (!snapshots.length) return;
    setLoading(true);
    await importWearableData(snapshots);
    dispatch({
      type: "IMPORT_WEARABLE_DATA",
      elderId: profile.elderId,
      source: dataSource,
      snapshots,
    });
    setLoading(false);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>穿戴数据导入 / Wearable Data Import</span>
          <h1>{profile.name}穿戴数据导入模拟</h1>
          <p>展示未来如何接入 Apple Health / Health Connect / Fitbit / Zepp / CSV 数据。</p>
        </div>
        <a className="primary-link" href={`#/elder/${profile.elderId}`}>
          返回驾驶舱
        </a>
      </header>

      <MockNoticeBanner>
        当前为模拟导入，v0.2 公網版不會讀取真實穿戴資料；Apple Health / Health Connect / Fitbit / Zepp 僅展示 Future Integration。
      </MockNoticeBanner>

      <section className="panel wearable-import-form">
        <div className="section-title">
          <span>数据来源选择</span>
          <h2>选择导入通道</h2>
        </div>
        <div className="source-grid">
          {activeSources.map((item) => (
            <button
              className={source === item.value ? "active" : ""}
              key={item.value}
              onClick={() => {
                setSource(item.value);
                setFutureNotice("");
              }}
            >
              {item.label}
              <small>Mock only</small>
            </button>
          ))}
          {futureSources.map((item) => (
            <button
              className="future-source"
              key={item}
              type="button"
              onClick={() =>
                setFutureNotice(
                  "此來源目前僅展示未來接入點。v0.2 公網版不會讀取真實穿戴資料。不會調用真實 Apple Health / Health Connect / Fitbit / Zepp API。",
                )
              }
            >
              {item}
              <small>Future Integration · 當前未接入真實服務</small>
            </button>
          ))}
        </div>
        {futureNotice ? <p className="trace-disclaimer">{futureNotice}</p> : null}
        <WearableDataSourceBadge source={source} />
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} />
        <div className="button-row">
          <button className="primary" disabled={loading} onClick={() => runImport(csv, source)}>
            {loading ? "导入中..." : "导入示例数据（Mock）"}
          </button>
          <button
            onClick={() => {
              setSource("CSV 示例數據");
              setCsv(chenWearableSevenDayCsv);
              setFutureNotice("");
              void runImport(chenWearableSevenDayCsv, "CSV 示例數據");
            }}
          >
            导入陈伯 7 天穿戴示例数据
          </button>
        </div>
      </section>

      {latestImport ? (
        <section className="panel">
          <div className="section-title">
            <span>DailySnapshot 列表</span>
            <h2>最近一次导入结果</h2>
          </div>
          <div className="table-wrap">
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th>date</th>
                  <th>steps</th>
                  <th>heart_rate_avg</th>
                  <th>sleep_duration</th>
                  <th>active_minutes</th>
                  <th>wear_time_hours</th>
                  <th>data_quality</th>
                </tr>
              </thead>
              <tbody>
                {latestImport.snapshots.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td>{snapshot.date}</td>
                    <td>{snapshot.steps}</td>
                    <td>{snapshot.heartRateAvg}</td>
                    <td>{snapshot.sleepDuration}</td>
                    <td>{snapshot.activeMinutes}</td>
                    <td>{snapshot.wearTimeHours}</td>
                    <td><DataQualityBadge quality={snapshot.dataQuality} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};
