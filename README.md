# 智护环 CareBand Agent Demo v0.2

智护环 CareBand Agent Demo v0.2 是“落地验证版”前端 Demo。当前仍为 React + TypeScript + Vite 的静态页面，使用 mock data、mock adapter、规则引擎和 Mock AI Agent 展示未来产品如何工作；不接真实后端、真实硬件、真实穿戴设备、真实 QwenPaw API，也不需要 API Key。

核心链路：

长者档案 + 初始照护记忆 + 穿戴快照 + 设备状态 + 照护事件 → 风险引擎 → Mock Agent 三端摘要 → 护工任务闭环 → 家属端安心表达 → 机构端统计更新。

## 技术栈

- React + TypeScript + Vite
- 普通 CSS
- React `useReducer` + `localStorage`
- Hash Router，适合 GitHub Pages 静态部署
- 本地 TypeScript mock data
- Vitest

## 如何运行

```bash
npm install
npm run dev
```

打开终端提示的本地地址，默认进入 `#/institution`。

如果这台电脑没有系统 `npm`，可以运行项目自带脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

## 如何测试和构建

```bash
npm test
npm run build
```

## v0.2 新增功能

- 长者记忆初始化：`#/elder/E001/memory-intake`
- 穿戴数据导入模拟：`#/elder/E001/wearable-import`
- 后端接口占位：`#/backend-contract`
- Agent Trace Panel：陈伯驾驶舱和 Demo Control 内展示
- 硬件原型模拟：`#/hardware-simulator`
- 设备状态与数据完整度：机构端和老人驾驶舱展示
- 语音输入模拟：Demo Control / 硬件模拟器内展示
- 跌倒 / 走失 / 地理围栏模拟：Demo Control / 硬件模拟器内展示
- AI 周报 / 长期趋势观察：陈伯驾驶舱展示
- 授权与隐私页：`#/privacy`
- 试点计划页：`#/pilot-plan`

## 页面路径

- `#/institution`：机构端风险热力图
- `#/caregiver`：护工端待办处理
- `#/elder/E001`：陈伯状态驾驶舱
- `#/elder/E001/memory-intake`：长者记忆初始化
- `#/elder/E001/wearable-import`：穿戴数据导入
- `#/elder/E001/profile`：老人档案页
- `#/medication/E001`：用药计划 / 用药确认页
- `#/family/E001`：家属端安心卡
- `#/demo-control`：路演控制台
- `#/hardware-simulator`：硬件原型模拟
- `#/backend-contract`：后端接口占位
- `#/privacy`：授权与隐私
- `#/pilot-plan`：试点计划
- `#/docs`：项目说明页

## 主演示路径

1. 打开 `#/institution`，查看多老人状态、设备状态、数据完整度、数据来源和初始照护记忆是否建立。
2. 进入 `#/elder/E001`，查看陈伯状态驾驶舱：初始照护记忆未建立、动态基线建立中、当前为模拟数据。
3. 点击“导入历史资料”，进入 `#/elder/E001/memory-intake`。
4. 粘贴陈伯历史资料，点击“生成初始照护记忆草稿”。
5. 人工确认记忆条目并保存。
6. 返回陈伯驾驶舱，查看“初始照护记忆已建立”和高血压关注、跌倒风险关注、晚药易漏、粤语优先、夜间离床关注等标签。
7. 点击“穿戴数据导入”，导入陈伯 7 天穿戴示例数据。
8. 返回驾驶舱，查看数据来源、最近同步时间、数据完整度、7 日步数趋势和 7 日睡眠趋势。
9. 打开 `#/hardware-simulator` 或 `#/demo-control`，点击“长按 SOS”或在语音模拟中输入“我有点头晕”。
10. 查看 mock 后端日志，展示未来接口 `POST /api/events` 和 `POST /api/agent/analyze`。
11. 风险规则升级，陈伯状态变为高风险或紧急；Agent Trace Panel 展示 request、response、护工摘要、家属摘要和机构摘要。
12. 到 `#/caregiver` 接单、标记已查看、确认晚药并完成处理。
13. 到 `#/family/E001` 查看“护工已收到提醒 / 正在跟进 / 已完成”的温和安心表达。
14. 回到 `#/institution`，查看当前未闭环高风险减少、已跟进高风险增加；再打开 `#/privacy` 和 `#/pilot-plan` 展示数据边界与试点路径。

## 当前 Mock 与未来接入

- Mock Backend → Future API：`src/lib/mockBackendAdapter.ts`
- Mock Agent → QwenPaw / LLM：`AgentTracePanel` 与 `src/lib/agentTrace.ts`
- CSV Import → Apple Health / Health Connect / Fitbit / Zepp：`src/lib/wearableImport.ts`
- Hardware Simulator → ESP32 / nRF 原型机：`HardwareSimulator` 与 `VirtualCareBand`

未来后端接口占位包括：

- `GET /api/elders`
- `POST /api/snapshots`
- `POST /api/events`
- `POST /api/agent/analyze`
- `PATCH /api/tasks/:id`
- `POST /api/memory/intake`
- `PATCH /api/memory/:id/confirm`
- `POST /api/wearable/import`
- `GET /api/elders/:id/dashboard`
- `GET /api/institution/overview`

## 数据说明

Demo 包含 5 位老人：陈伯、李婆婆、黄叔、梁婆婆、吴伯。每位老人包含档案、档案详情、照护团队、授权状态、个人基线、今日快照、设备记录、用药计划、照护事件和 7 日趋势。风险结果不写死在页面中，而是由 `src/lib/riskEngine.ts` 动态计算。

## 医疗边界

本系统只做照护风险提示，不构成医疗诊断。AI 生成的初始照护记忆和 Agent 摘要必须人工确认；数据不足时不强行判断；家属端不展示精确位置轨迹和过多专业数据。
