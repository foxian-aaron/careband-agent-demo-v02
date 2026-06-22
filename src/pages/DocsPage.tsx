import { MedicalDisclaimer } from "../components/MedicalDisclaimer";

export const DocsPage = () => (
  <div className="page docs-page">
    <header className="page-header">
      <div>
        <span>文档页</span>
        <h1>智护环 CareBand Agent Demo 说明</h1>
        <p>评委和团队成员可在这里快速理解 Demo 剧本、数据、规则和后续扩展。</p>
      </div>
    </header>

    <section className="panel docs-section">
      <h2>Demo v0.2 已展示什么</h2>
      <ul className="insight-list">
        <li>长者记忆初始化：资料输入、Mock AI 提取、人工确认、保存到驾驶舱标签。</li>
        <li>穿戴数据导入模拟：CSV / Mock Data 导入，生成 DailySnapshot 并更新趋势。</li>
        <li>硬件原型模拟：SOS、跌倒、设备未佩戴、低电量等事件进入 CareEvent。</li>
        <li>Agent Trace Panel：展示 request、response、Mock / Future QwenPaw 标签和 fallback。</li>
        <li>隐私授权与试点计划：展示角色权限、数据边界和菩提禅院 / 老人院推进路径。</li>
      </ul>
    </section>

    <section className="panel docs-section">
      <h2>Demo 剧本</h2>
      <ol>
        <li>从机构端查看 5 位长者风险热力图，说明陈伯初始为“需关注”。</li>
        <li>进入陈伯驾驶舱，展示个人基线、今日偏离和 Decision Trace。</li>
        <li>进入 `#/elder/E001/memory-intake`，粘贴陈伯历史资料，生成并确认初始照护记忆。</li>
        <li>返回驾驶舱，查看“初始照护记忆已建立”和高血压关注、跌倒风险关注、晚药易漏、粤语优先等标签。</li>
        <li>进入 `#/elder/E001/wearable-import`，导入 7 天穿戴示例数据，返回驾驶舱查看数据来源、完整度和趋势。</li>
        <li>打开 `#/hardware-simulator` 或 `#/demo-control`，触发 SOS、头晕、跌倒、设备未佩戴或离开安全区。</li>
        <li>系统展示未来接口 POST /api/events 与 POST /api/agent/analyze 的前端 Mock 日志。</li>
        <li>Agent Trace Panel 展示护工、家属、机构三端摘要，以及失败 fallback。</li>
        <li>护工端接单并完成处理，家属端显示“护工已收到提醒 / 正在跟进 / 已完成”。</li>
        <li>机构端统计更新未闭环高风险、今日曾高风险和已跟进高风险。</li>
        <li>打开 `#/privacy` 与 `#/pilot-plan`，展示授权边界和试点路径。</li>
      </ol>
    </section>

    <section className="panel docs-section">
      <h2>数据结构说明</h2>
      <p>
        Demo 使用 ElderProfile、ElderProfileDetail、ConsentStatus、ContactPerson、
        PersonalBaseline、DailySnapshot、MedicationPlan、MedicationDose、CareEvent、
        RiskResult、CareTask 和 AgentRoleSummaries 组织数据。v0.1.3 新增老人档案页和
        用药计划页，并保持 careLoopStatus / displayStatus 与 riskLevel 分层。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>风险规则说明</h2>
      <p>
        规则引擎先检查 SOS、跌倒、离开安全区和严重主诉等硬事件；没有硬事件时再判断
        数据完整度；之后按个人步数基线、睡眠基线、晚药确认、主动症状反馈和慢病标签
        计算日常偏离，并输出可解释原因和建议动作。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>事件流说明</h2>
      <pre>{`模拟数据 / 事件输入
  ↓
读取老人档案、用药计划和个人基线
  ↓
用药提醒 / 用药确认事件写入 CareEvent
  ↓
检查硬事件
  ↓
检查数据完整度
  ↓
计算日常偏离
  ↓
风险引擎输出 riskLevel
  ↓
deriveDisplayStatus 输出前台展示状态
  ↓
Mock AI Agent 生成三端摘要
  ↓
护工端生成任务
  ↓
家属端显示安心卡
  ↓
机构端更新热力图
  ↓
护工接单 / 查看 / 确认用药 / 完成处理
  ↓
三端同步更新`}</pre>
    </section>

    <section className="panel docs-section">
      <h2>页面说明</h2>
      <p>
        机构端负责群体风险排序，护工端负责待办处理，长者驾驶舱负责解释状态变化，
        老人档案页展示长期档案和授权状态，用药计划页展示提醒与确认记录，
        家属端负责温和同步，Demo 控制台负责路演推进。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>后续接入 QwenPaw / 硬件</h2>
      <p>
        陈伯驾驶舱已加入 Mock QwenPaw Agent IO 面板。后续可将 riskEngine 输出、事件摘要和老人基线发送给 QwenPaw 生成真实多角色摘要；
        硬件侧计划通过原型传感器模块或手环式原型，将心率趋势、步数、睡眠参考、
        佩戴时间、安全区状态和 SOS 事件映射为 DailySnapshot 与 CareEvent。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>仍是 Mock 的部分</h2>
      <ul className="insight-list">
        <li>Mock Backend → Future API：当前不请求服务器，后续替换 `mockBackendAdapter.ts`。</li>
        <li>Mock Agent → QwenPaw / LLM：当前不需要 API Key，后续替换 Agent adapter。</li>
        <li>CSV Import → Apple Health / Health Connect / Fitbit / Zepp：当前只解析示例 CSV。</li>
        <li>Hardware Simulator → ESP32 / nRF 原型机：当前由前端按钮生成事件。</li>
      </ul>
      <p className="trace-disclaimer">
        后端 API 占位见 `#/backend-contract`；硬件原型计划见 `#/hardware-simulator`；隐私授权见 `#/privacy`。
      </p>
    </section>

    <MedicalDisclaimer />
  </div>
);
