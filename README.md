# CareBand Agent Demo v0.2

CareBand Agent Demo v0.2 是前端 Mock 落地驗證版。它不接真實後端、不接真實硬件、不接真實 QwenPaw API、不接真實 Apple Health / Health Connect / Fitbit / Zepp。它通過 mock data、mock adapter、狀態模擬和 API contract 展示未來系統如何接入真實服務。

Correct repository:

https://github.com/foxian-aaron/careband-agent-demo-v02

Public demo:

https://foxian-aaron.github.io/careband-agent-demo-v02/#/institution

Do not use the old v0.1 public link as the v0.2 demo:

https://foxian-aaron.github.io/careband-agent-demo/

## Important Boundaries

- 前端 Mock Demo
- 不接真實後端
- 不接真實硬件
- 不接真實 QwenPaw API
- 不接真實 Apple Health / Health Connect / Fitbit / Zepp
- 不使用 API Key
- 不做醫療診斷
- 所有 AI 輸出僅為照護風險提示，必須人工確認

## Demo Flow

The mock product chain is:

wearable / care event data -> DailySnapshot -> personal baseline -> deterministic riskEngine -> Mock Agent / future QwenPaw-compatible Agent response -> caregiver task -> family peace card -> institution visibility.

## 3-Minute Demo Path

1. Open `#/institution` to view multi-elder status, device status, and data completeness.
2. Open `#/elder/E001` to view Chen's dashboard, care memory tags, five-dimension status, and 7-day trend.
3. Open `#/elder/E001/memory-intake` to generate a mock initial care memory draft and confirm it manually.
4. Open `#/elder/E001/wearable-import` to import Mock Data or CSV sample data into DailySnapshot.
5. Use `#/demo-control` or `#/hardware-simulator` to trigger dizziness voice, SOS, fall, not-worn device, or geofence exit.
6. Review Agent Trace request / response / fallback, remembering it is a developer and judge demo view.
7. Open `#/caregiver` to accept and complete the task.
8. Open `#/family/E001` to see the gentle family-facing peace card.
9. Open `#/privacy` to review role permissions and data boundaries.
10. Open `#/pilot-plan` to review the Bodhi Chan / elderly home validation path.

Other simulator pages can be used for Q&A and do not need to be shown in the main pitch.

## Routes

- `#/institution`
- `#/elder/E001`
- `#/elder/E001/profile`
- `#/elder/E001/memory-intake`
- `#/elder/E001/wearable-import`
- `#/medication/E001`
- `#/caregiver`
- `#/family/E001`
- `#/demo-control`
- `#/backend-contract`
- `#/hardware-simulator`
- `#/privacy`
- `#/pilot-plan`
- `#/docs`

Unknown elder routes intentionally do not fall back to E001.

## Local Development

```bash
npm install
npm run dev
```

If `npm` is not available on the local machine PATH, use the bundled runtime or the existing local start script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

## Test And Build

```bash
npm test
npm run build
```

The GitHub Actions workflow is frontend-only. It runs `npm ci`, `npm test`, and `npm run build`, then deploys the static Vite build to GitHub Pages.

## Future Integration Points

- Mock Backend -> Future API contract only
- Mock Agent -> QwenPaw-compatible endpoint planned
- Mock/CSV wearable import -> future Apple Health / Health Connect / Fitbit / Zepp integration
- Hardware Simulator -> future ESP32 / nRF prototype event source

None of these are connected in the public v0.2 demo.
