import {
  createContext,
  type Dispatch,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { mockBaselines } from "../data/mockBaselines";
import { mockContacts } from "../data/mockContacts";
import { mockConsentPrivacyRecords } from "../data/mockConsentPrivacy";
import { mockDeviceRecords } from "../data/mockDeviceRecords";
import {
  mockEvents,
  mockOperationalStates,
  mockTasks,
} from "../data/mockEvents";
import { mockMedicationPlans } from "../data/mockMedicationPlans";
import { mockPilotPlanStatus } from "../data/mockPilotPlan";
import { mockProfileDetails } from "../data/mockProfileDetails";
import { mockProfiles } from "../data/mockProfiles";
import { mockSnapshots } from "../data/mockSnapshots";
import { mockTrends } from "../data/mockTrends";
import { mockWeeklySummaries } from "../data/mockWeeklySummaries";
import { generateAgentSummaries } from "../lib/agentFormatter";
import { buildAgentTrace } from "../lib/agentTrace";
import { deriveCareLoopStatus, deriveDisplayStatus } from "../lib/displayStatus";
import { calculateRisk } from "../lib/riskEngine";
import { latestWearableSnapshot } from "../lib/wearableImport";
import {
  getActiveTaskForElder as selectActiveTaskForElder,
  getLatestTaskForElder,
  getTaskHistoryForElder as selectTaskHistoryForElder,
} from "../lib/taskSelectors";
import type {
  AgentRoleSummaries,
  AgentMode,
  AgentTraceBundle,
  CareEvent,
  CareMemoryItem,
  CareTask,
  ContactPerson,
  DailySnapshot,
  DeviceRecord,
  ElderProfile,
  ElderProfileDetail,
  ElderTrend,
  InitialCareMemory,
  MedicationPlan,
  MockBackendLog,
  OperationalState,
  PersonalBaseline,
  PilotPlanStatus,
  RiskResult,
  ConsentPrivacyRecord,
  DeviceConnectionStatus,
  DeviceWearStatus,
  MemoryConfirmationStatus,
  WearableDailySnapshot,
  WearableDataSource,
  WearableImportRecord,
  WeeklySummary,
} from "../types";

const storageKey = "careband-agent-demo-state-v0.2";
const chenId = "E001";

export interface DemoState {
  profiles: Record<string, ElderProfile>;
  baselines: Record<string, PersonalBaseline>;
  snapshots: Record<string, DailySnapshot>;
  medicationPlans: Record<string, MedicationPlan>;
  contacts: Record<string, ContactPerson>;
  profileDetails: Record<string, ElderProfileDetail>;
  trends: Record<string, ElderTrend>;
  events: CareEvent[];
  tasks: CareTask[];
  operationalStates: Record<string, OperationalState>;
  initialCareMemoryByElderId: Record<string, InitialCareMemory>;
  memoryDraftsByElderId: Record<string, InitialCareMemory>;
  wearableImports: Record<string, WearableImportRecord[]>;
  deviceRecords: Record<string, DeviceRecord>;
  agentMode: AgentMode;
  agentTraces: Record<string, AgentTraceBundle>;
  mockBackendLogs: MockBackendLog[];
  consentRecords: Record<string, ConsentPrivacyRecord>;
  pilotPlanStatus: PilotPlanStatus;
  weeklySummaries: Record<string, WeeklySummary>;
}

export type DemoAction =
  | { type: "RESET_DEMO" }
  | { type: "TRIGGER_CHEN_DIZZINESS" }
  | { type: "CAREGIVER_ACCEPT_TASK" }
  | { type: "CAREGIVER_MARK_VIEWED" }
  | { type: "CONFIRM_EVENING_MEDICATION" }
  | { type: "COMPLETE_CARE_TASK" }
  | { type: "TRIGGER_SOS" }
  | { type: "SIMULATE_DATA_GAP" }
  | { type: "CREATE_MEMORY_DRAFT"; draft: InitialCareMemory }
  | {
      type: "CONFIRM_MEMORY_ITEM";
      elderId: string;
      itemId: string;
      status: MemoryConfirmationStatus;
      content?: string;
    }
  | { type: "SAVE_INITIAL_CARE_MEMORY"; elderId: string }
  | {
      type: "IMPORT_WEARABLE_DATA";
      elderId: string;
      source: WearableDataSource;
      snapshots: WearableDailySnapshot[];
    }
  | {
      type: "UPDATE_DEVICE_STATUS";
      elderId: string;
      patch: Partial<
        Pick<
          DeviceRecord,
          | "connectionStatus"
          | "wearStatus"
          | "batteryLevel"
          | "lastSyncAt"
          | "dataQuality"
          | "dataSource"
          | "todayWearTimeHours"
        >
      >;
    }
  | {
      type: "TRIGGER_HARDWARE_EVENT";
      elderId: string;
      eventType: CareEvent["eventType"];
    }
  | { type: "SIMULATE_VOICE_INPUT"; elderId: string; text: string }
  | { type: "SIMULATE_GEOFENCE_EXIT"; elderId: string }
  | {
      type: "SIMULATE_FALL_EVENT";
      elderId: string;
      stage: "fall_detected" | "no_response_after_fall";
    }
  | { type: "GENERATE_AGENT_SUMMARY"; trace: AgentTraceBundle }
  | { type: "SIMULATE_AGENT_FAILURE"; elderId: string }
  | { type: "FALLBACK_TO_RULE_SUMMARY"; trace: AgentTraceBundle }
  | {
      type: "UPDATE_CONSENT";
      elderId: string;
      field: keyof Omit<ConsentPrivacyRecord, "elderId" | "updatedAt">;
      value: boolean | ConsentPrivacyRecord["rawMedicalRecordRetention"];
    }
  | { type: "UPDATE_PILOT_STATUS"; status: PilotPlanStatus }
  | { type: "GENERATE_WEEKLY_SUMMARY"; summary: WeeklySummary }
  | { type: "ADD_BACKEND_LOG"; log: MockBackendLog };

interface DemoContextValue {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const toRecord = <T extends { elderId: string }>(items: T[]) =>
  items.reduce<Record<string, T>>((record, item) => {
    record[item.elderId] = item;
    return record;
  }, {});

const toContactRecord = (items: ContactPerson[]) =>
  items.reduce<Record<string, ContactPerson>>((record, item) => {
    record[item.contactId] = item;
    return record;
  }, {});

const toDeviceRecord = (items: DeviceRecord[]) =>
  items.reduce<Record<string, DeviceRecord>>((record, item) => {
    record[item.elderId] = item;
    return record;
  }, {});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const createInitialDemoState = (): DemoState => ({
  profiles: toRecord(clone(mockProfiles)),
  baselines: toRecord(clone(mockBaselines)),
  snapshots: toRecord(
    clone(mockSnapshots).map((snapshot: DailySnapshot) => ({
      ...snapshot,
      dataSource: "Mock Data" as const,
      dataQuality: snapshot.dataCompleteness,
    })),
  ),
  medicationPlans: toRecord(clone(mockMedicationPlans)),
  contacts: toContactRecord(clone(mockContacts)),
  profileDetails: toRecord(clone(mockProfileDetails)),
  trends: toRecord(clone(mockTrends)),
  events: clone(mockEvents),
  tasks: clone(mockTasks),
  operationalStates: clone(mockOperationalStates),
  initialCareMemoryByElderId: {},
  memoryDraftsByElderId: {},
  wearableImports: {},
  deviceRecords: toDeviceRecord(clone(mockDeviceRecords)),
  agentMode: "mock",
  agentTraces: {},
  mockBackendLogs: [],
  consentRecords: toRecord(clone(mockConsentPrivacyRecords)),
  pilotPlanStatus: clone(mockPilotPlanStatus),
  weeklySummaries: clone(mockWeeklySummaries),
});

const addEventOnce = (events: CareEvent[], event: CareEvent) =>
  events.some((existing) => existing.eventId === event.eventId)
    ? events
    : [...events, event];

const confirmEveningMedicationPlan = (
  plans: Record<string, MedicationPlan>,
  confirmedEventId = "EVT-E001-MED-PM-CONFIRMED",
) => {
  const plan = plans[chenId];
  if (!plan) return plans;

  return {
    ...plans,
    [chenId]: {
      ...plan,
      updatedAt: "2026-06-10T20:22:00+08:00",
      doses: plan.doses.map((dose) =>
        dose.label === "晚药"
          ? {
              ...dose,
              status: "confirmed" as const,
              confirmedAt: "20:22",
              confirmedBy: "护工A",
              confirmSource: "caregiver" as const,
              confirmedEventId,
            }
          : dose,
      ),
    },
  };
};

const nextTaskId = (tasks: CareTask[], baseId: string) => {
  if (!tasks.some((task) => task.taskId === baseId)) return baseId;
  return `${baseId}-${tasks.filter((task) => task.taskId.startsWith(baseId)).length + 1}`;
};

const upsertActiveTask = (tasks: CareTask[], elderId: string, task: CareTask) => {
  const activeTask = selectActiveTaskForElder(elderId, tasks);
  if (!activeTask) return [...tasks, task];
  return tasks.map((existing) =>
    existing.taskId === activeTask.taskId
      ? {
          ...existing,
          priority: task.priority,
          title: task.title,
          reason: task.reason,
          recommendedAction: task.recommendedAction,
          sourceEventId: task.sourceEventId,
          updatedAt: task.updatedAt,
        }
      : existing,
  );
};

const updateActiveTask = (
  tasks: CareTask[],
  elderId: string,
  updater: (task: CareTask) => CareTask,
) => {
  const activeTask = selectActiveTaskForElder(elderId, tasks);
  if (!activeTask) return tasks;
  return tasks.map((task) => (task.taskId === activeTask.taskId ? updater(task) : task));
};

const isoNow = () => new Date().toISOString();

const createBackendLog = (
  endpoint: string,
  method: MockBackendLog["method"],
  message: string,
  payloadPreview?: Record<string, unknown>,
): MockBackendLog => ({
  id: `LOG-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  endpoint,
  method,
  status: "mocked",
  message,
  createdAt: isoNow(),
  payloadPreview,
});

const appendBackendLog = (logs: MockBackendLog[], log: MockBackendLog) =>
  [log, ...logs].slice(0, 24);

const createEventId = (prefix: string, eventType: string) =>
  `EVT-${prefix}-${eventType}-${Date.now()}`;

const hardwareEventCopy: Partial<
  Record<
    CareEvent["eventType"],
    {
      title: string;
      severity: CareEvent["severity"];
      priority: CareTask["priority"];
      reason: string;
      recommendedAction: string;
      sourceType: CareTask["sourceType"];
    }
  >
> = {
  button_confirm: {
    title: "短按确认：老人已回应提醒",
    severity: "stable",
    priority: "low",
    reason: "设备按钮确认事件",
    recommendedAction: "记录已确认，无需额外处理。",
    sourceType: "hardware_event",
  },
  sos_long_press: {
    title: "长按求助：触发 SOS",
    severity: "urgent",
    priority: "urgent",
    reason: "长按 SOS 求助事件",
    recommendedAction: "立即通知护工和机构负责人，并按机构应急流程处理。",
    sourceType: "hardware_event",
  },
  sos_triple_press: {
    title: "连按 SOS：触发紧急求助",
    severity: "urgent",
    priority: "urgent",
    reason: "连按 SOS 求助事件",
    recommendedAction: "立即通知护工和机构负责人，并按机构应急流程处理。",
    sourceType: "hardware_event",
  },
  fall_detected: {
    title: "疑似跌倒，等待确认",
    severity: "high_risk",
    priority: "high",
    reason: "手环 IMU 模拟检测到疑似跌倒",
    recommendedAction: "请护工立即查看现场，并等待老人按钮确认。",
    sourceType: "hardware_event",
  },
  inactivity_after_fall: {
    title: "跌倒后长时间静止",
    severity: "high_risk",
    priority: "high",
    reason: "疑似跌倒后长时间静止",
    recommendedAction: "请护工立即确认老人位置和现场情况。",
    sourceType: "hardware_event",
  },
  no_response_after_fall: {
    title: "跌倒后 30 秒无回应",
    severity: "urgent",
    priority: "urgent",
    reason: "疑似跌倒后 30 秒无按钮回应",
    recommendedAction: "立即通知护工和机构负责人，并按机构应急流程处理。",
    sourceType: "hardware_event",
  },
  device_not_worn: {
    title: "设备未佩戴，数据不足",
    severity: "data_insufficient",
    priority: "low",
    reason: "设备未佩戴或佩戴状态异常",
    recommendedAction: "请先确认设备佩戴和同步，再判断是否需要进一步跟进。",
    sourceType: "data_insufficient",
  },
  device_low_battery: {
    title: "设备低电量",
    severity: "observation",
    priority: "low",
    reason: "设备电量偏低，可能影响连续监测",
    recommendedAction: "提醒护工在巡查时为设备充电。",
    sourceType: "hardware_event",
  },
  device_reconnected: {
    title: "设备已重新连接",
    severity: "stable",
    priority: "low",
    reason: "设备重新上线并完成同步",
    recommendedAction: "记录设备恢复，无需额外处理。",
    sourceType: "hardware_event",
  },
};

const buildTaskFromEvent = (
  tasks: CareTask[],
  elderId: string,
  event: CareEvent,
  copy: NonNullable<(typeof hardwareEventCopy)[CareEvent["eventType"]]>,
): CareTask => ({
  taskId: nextTaskId(tasks, `TASK-${elderId}-${event.eventType.toUpperCase()}`),
  elderId,
  sourceEventId: event.eventId,
  priority: copy.priority,
  title:
    copy.priority === "urgent"
      ? "陈伯触发紧急事件，需要立即响应"
      : copy.title,
  reason: copy.reason,
  recommendedAction: copy.recommendedAction,
  assignedTo: "护工A",
  status: copy.priority === "low" && event.eventType === "button_confirm" ? "completed" : "pending",
  sourceType: copy.sourceType,
  agentSummarySource: "mock",
  createdAt: event.timestamp,
  updatedAt: event.timestamp,
});

export const demoReducer = (state: DemoState, action: DemoAction): DemoState => {
  switch (action.type) {
    case "RESET_DEMO":
      return createInitialDemoState();
    case "TRIGGER_CHEN_DIZZINESS": {
      const existingActiveTask = selectActiveTaskForElder(chenId, state.tasks);
      const taskId = existingActiveTask?.taskId ?? nextTaskId(state.tasks, "TASK-E001-DIZZINESS");
      const voiceEvent: CareEvent = {
        eventId: "EVT-E001-DIZZINESS",
        elderId: chenId,
        eventType: "voice_symptom",
        timestamp: "2026-06-10T20:15:00+08:00",
        title: "语音反馈：我有点头晕",
        rawText: "我有点头晕",
        source: "demo",
        severity: "high_risk",
        payload: {
          symptomKeywords: ["头晕"],
        },
        status: "open",
        linkedTaskId: taskId,
        confidence: 0.94,
      };
      const notifyEvent: CareEvent = {
        eventId: "EVT-E001-NOTIFY-CAREGIVER",
        elderId: chenId,
        eventType: "system_risk_update",
        timestamp: "2026-06-10T20:16:00+08:00",
        title: "系统通知护工：陈伯需要立即查看",
        source: "system",
        severity: "high_risk",
        status: "open",
        linkedTaskId: taskId,
      };
      const highTask: CareTask = {
        taskId,
        elderId: chenId,
        sourceEventId: voiceEvent.eventId,
        priority: "high",
        title: "陈伯需要立即查看",
        reason: "头晕反馈 + 晚药未确认 + 活动明显下降",
        recommendedAction:
          "请护工立即查看，确认是否已进食和服药，并观察不适是否持续。",
        assignedTo: "护工A",
        status: "pending",
        sourceType: "voice_event",
        agentSummarySource: "mock",
        createdAt: "2026-06-10T20:16:00+08:00",
        updatedAt: "2026-06-10T20:16:00+08:00",
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            lastSyncedAt: "2026-06-10T20:16:00+08:00",
          },
        },
        events: addEventOnce(addEventOnce(state.events, voiceEvent), notifyEvent),
        tasks: upsertActiveTask(state.tasks, chenId, highTask),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "CAREGIVER_ACCEPT_TASK": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      if (!activeTask) return state;
      const acceptedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-ACCEPTED",
        elderId: chenId,
        eventType: "caregiver_accepted",
        timestamp: "2026-06-10T20:20:00+08:00",
        title: "护工A已接单，正在查看陈伯情况",
        source: "caregiver",
        severity: "attention",
        status: "acknowledged",
        linkedTaskId: activeTask.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:20:00+08:00",
      };

      return {
        ...state,
        events: addEventOnce(state.events, acceptedEvent),
        tasks: updateActiveTask(state.tasks, chenId, (task) => ({
          ...task,
          status: "in_progress",
          updatedAt: "2026-06-10T20:20:00+08:00",
        })),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "in_progress",
        },
      };
    }
    case "CAREGIVER_MARK_VIEWED": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      if (!activeTask) return state;
      const checkedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-CHECKED",
        elderId: chenId,
        eventType: "caregiver_checked",
        timestamp: "2026-06-10T20:21:00+08:00",
        title: "护工A已到场查看陈伯",
        source: "caregiver",
        severity: "attention",
        payload: {
          note: "护工A已到场查看陈伯",
        },
        status: "acknowledged",
        linkedTaskId: activeTask.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:21:00+08:00",
      };

      return {
        ...state,
        events: addEventOnce(state.events, checkedEvent),
        tasks: updateActiveTask(state.tasks, chenId, (task) => ({
          ...task,
          updatedAt: "2026-06-10T20:21:00+08:00",
        })),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "in_progress",
        },
      };
    }
    case "CONFIRM_EVENING_MEDICATION": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      const medicationEvent: CareEvent = {
        eventId: "EVT-E001-MED-PM-CONFIRMED",
        elderId: chenId,
        eventType: "medication_confirmed",
        timestamp: "2026-06-10T20:22:00+08:00",
        title: "晚药已确认",
        source: "caregiver",
        severity: "stable",
        payload: {
          medicationName: "晚药",
        },
        status: "resolved",
        linkedTaskId: activeTask?.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:22:00+08:00",
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            medicationEvening: "confirmed",
            lastSyncedAt: "2026-06-10T20:22:00+08:00",
          },
        },
        medicationPlans: confirmEveningMedicationPlan(state.medicationPlans),
        events: addEventOnce(state.events, medicationEvent),
        tasks: updateActiveTask(state.tasks, chenId, (task) => ({
          ...task,
          updatedAt: "2026-06-10T20:22:00+08:00",
        })),
      };
    }
    case "COMPLETE_CARE_TASK": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      const medicationEvent: CareEvent = {
        eventId: "EVT-E001-MED-PM-CONFIRMED",
        elderId: chenId,
        eventType: "medication_confirmed",
        timestamp: "2026-06-10T20:22:00+08:00",
        title: "晚药已确认",
        source: "caregiver",
        severity: "stable",
        payload: {
          medicationName: "晚药",
        },
        status: "resolved",
        linkedTaskId: activeTask?.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:22:00+08:00",
      };
      const note =
        "20:25 护工A已查看陈伯，已确认晚药，陈伯目前在房间休息，建议明早继续关注活动和睡眠。";
      const completedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-COMPLETED",
        elderId: chenId,
        eventType: "caregiver_completed",
        timestamp: "2026-06-10T20:25:00+08:00",
        title: "护工A已查看陈伯，已确认晚药，陈伯目前在房间休息",
        source: "caregiver",
        severity: "observation",
        payload: {
          note,
        },
        status: "resolved",
        linkedTaskId: activeTask?.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:25:00+08:00",
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            medicationEvening: "confirmed",
            locationZone: "房间 203",
            lastSyncedAt: "2026-06-10T20:25:00+08:00",
          },
        },
        medicationPlans: confirmEveningMedicationPlan(state.medicationPlans),
        events: addEventOnce(addEventOnce(state.events, medicationEvent), completedEvent),
        tasks: state.tasks.map((task) =>
          activeTask && task.taskId === activeTask.taskId
            ? {
                ...task,
                status: "completed",
                updatedAt: "2026-06-10T20:25:00+08:00",
                completedAt: "2026-06-10T20:25:00+08:00",
                note,
              }
            : task,
        ),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "follow_up",
        },
      };
    }
    case "TRIGGER_SOS": {
      const existingActiveTask = selectActiveTaskForElder(chenId, state.tasks);
      const taskId = existingActiveTask?.taskId ?? nextTaskId(state.tasks, "TASK-E001-SOS");
      const sosEvent: CareEvent = {
        eventId: "EVT-E001-SOS",
        elderId: chenId,
        eventType: "sos",
        timestamp: "2026-06-10T20:18:00+08:00",
        title: "SOS 测试事件",
        rawText: "SOS 求助",
        source: "demo",
        severity: "urgent",
        status: "open",
        linkedTaskId: taskId,
      };
      const urgentTask: CareTask = {
        taskId,
        elderId: chenId,
        sourceEventId: sosEvent.eventId,
        priority: "urgent",
        title: "陈伯触发 SOS，需要立即响应",
        reason: "SOS 求助事件",
        recommendedAction:
          "立即通知护工和机构负责人，并按机构应急流程处理。",
        assignedTo: "护工A",
        status: "pending",
        sourceType: "hardware_event",
        agentSummarySource: "mock",
        createdAt: "2026-06-10T20:18:00+08:00",
        updatedAt: "2026-06-10T20:18:00+08:00",
      };

      return {
        ...state,
        events: addEventOnce(state.events, sosEvent),
        tasks: upsertActiveTask(state.tasks, chenId, urgentTask),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "SIMULATE_DATA_GAP": {
      const dataGapEvent: CareEvent = {
        eventId: "EVT-E001-DATA-GAP",
        elderId: chenId,
        eventType: "system_risk_update",
        timestamp: "2026-06-10T20:30:00+08:00",
        title: "模拟数据不足：设备佩戴或同步需确认",
        source: "demo",
        severity: "data_insufficient",
        payload: {
          previousValue: state.snapshots[chenId].dataCompleteness,
          currentValue: 0.32,
        },
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            dataCompleteness: 0.32,
            wearTimeHours: 4.2,
            lastSyncedAt: "2026-06-10T20:30:00+08:00",
          },
        },
        events: addEventOnce(state.events, dataGapEvent),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "CREATE_MEMORY_DRAFT":
      return {
        ...state,
        memoryDraftsByElderId: {
          ...state.memoryDraftsByElderId,
          [action.draft.elderId]: action.draft,
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/memory/intake", "POST", "当前为前端 Mock：生成初始照护记忆草稿", {
            elder_id: action.draft.elderId,
            item_count: action.draft.items.length,
          }),
        ),
      };
    case "CONFIRM_MEMORY_ITEM": {
      const draft = state.memoryDraftsByElderId[action.elderId];
      if (!draft) return state;
      return {
        ...state,
        memoryDraftsByElderId: {
          ...state.memoryDraftsByElderId,
          [action.elderId]: {
            ...draft,
            updatedAt: isoNow(),
            items: draft.items.map((item): CareMemoryItem =>
              item.id === action.itemId
                ? {
                    ...item,
                    content: action.content ?? item.content,
                    confirmationStatus: action.status,
                    confirmedBy:
                      action.status === "confirmed" ? "Demo 操作员" : item.confirmedBy,
                    confirmedAt: action.status === "confirmed" ? isoNow() : item.confirmedAt,
                    updatedAt: isoNow(),
                  }
                : item,
            ),
          },
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog(
            `/api/memory/${action.itemId}/confirm`,
            "PATCH",
            "当前为前端 Mock：更新记忆条目确认状态",
            {
              memory_id: action.itemId,
              confirmation_status: action.status,
            },
          ),
        ),
      };
    }
    case "SAVE_INITIAL_CARE_MEMORY": {
      const draft = state.memoryDraftsByElderId[action.elderId];
      if (!draft) return state;
      const saved: InitialCareMemory = {
        ...draft,
        updatedAt: isoNow(),
        items: draft.items.filter((item) => item.confirmationStatus !== "rejected"),
      };
      const profile = state.profiles[action.elderId];
      const riskTags = Array.from(
        new Set([...(profile?.riskTags ?? []), ...saved.riskTags]),
      );
      return {
        ...state,
        profiles: profile
          ? {
              ...state.profiles,
              [action.elderId]: {
                ...profile,
                riskTags,
              },
            }
          : state.profiles,
        initialCareMemoryByElderId: {
          ...state.initialCareMemoryByElderId,
          [action.elderId]: saved,
        },
        memoryDraftsByElderId: {
          ...state.memoryDraftsByElderId,
          [action.elderId]: saved,
        },
      };
    }
    case "IMPORT_WEARABLE_DATA": {
      const latest = latestWearableSnapshot(action.snapshots);
      const previousImports = state.wearableImports[action.elderId] ?? [];
      const importRecord: WearableImportRecord = {
        importId: `IMP-${action.elderId}-${Date.now()}`,
        elderId: action.elderId,
        source: action.source,
        importedAt: isoNow(),
        rowCount: action.snapshots.length,
        snapshots: action.snapshots,
      };
      const currentSnapshot = state.snapshots[action.elderId];
      const currentDevice = state.deviceRecords[action.elderId];
      const trend = state.trends[action.elderId];
      const updatedTrend =
        trend && action.snapshots.length
          ? {
              ...trend,
              points: action.snapshots.slice(-7).map((point) => ({
                date: point.date.slice(5).replace("-", "/"),
                steps: point.steps,
                sleepHours: point.sleepDuration,
                medicationOnTimeRate:
                  currentSnapshot?.medicationEvening === "confirmed" ? 1 : 0.5,
                riskLevel:
                  point.dataQuality < 0.4
                    ? ("data_insufficient" as const)
                    : ("observation" as const),
              })),
            }
          : trend;

      return {
        ...state,
        wearableImports: {
          ...state.wearableImports,
          [action.elderId]: [importRecord, ...previousImports].slice(0, 5),
        },
        snapshots:
          latest && currentSnapshot
            ? {
                ...state.snapshots,
                [action.elderId]: {
                  ...currentSnapshot,
                  id: latest.id,
                  date: latest.date,
                  dataSource: action.source,
                  heartRate: latest.heartRateAvg,
                  restingHeartRate: latest.restingHeartRate,
                  stepsToday: latest.steps,
                  activeMinutes: latest.activeMinutes,
                  sleepDuration: latest.sleepDuration,
                  wearTimeHours: latest.wearTimeHours,
                  dataCompleteness: latest.dataQuality,
                  dataQuality: latest.dataQuality,
                  lastSyncedAt: latest.importedAt,
                  importedAt: latest.importedAt,
                },
              }
            : state.snapshots,
        trends:
          updatedTrend && trend
            ? {
                ...state.trends,
                [action.elderId]: updatedTrend,
              }
            : state.trends,
        deviceRecords:
          latest && currentDevice
            ? {
                ...state.deviceRecords,
                [action.elderId]: {
                  ...currentDevice,
                  connectionStatus: "online",
                  wearStatus: latest.wearTimeHours >= 6 ? "worn" : "not_worn",
                  lastSyncAt: latest.importedAt,
                  dataQuality: latest.dataQuality,
                  dataSource: action.source,
                  todayWearTimeHours: latest.wearTimeHours,
                },
              }
            : state.deviceRecords,
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/wearable/import", "POST", "当前为前端 Mock：穿戴数据导入完成", {
            elder_id: action.elderId,
            row_count: action.snapshots.length,
            data_source: action.source,
          }),
        ),
      };
    }
    case "UPDATE_DEVICE_STATUS": {
      const device = state.deviceRecords[action.elderId];
      if (!device) return state;
      return {
        ...state,
        deviceRecords: {
          ...state.deviceRecords,
          [action.elderId]: {
            ...device,
            ...action.patch,
          },
        },
      };
    }
    case "TRIGGER_HARDWARE_EVENT": {
      const copy = hardwareEventCopy[action.eventType];
      if (!copy) return state;
      const timestamp = isoNow();
      const device = state.deviceRecords[action.elderId];
      const event: CareEvent = {
        eventId: createEventId(action.elderId, action.eventType),
        elderId: action.elderId,
        eventType: action.eventType,
        timestamp,
        title: copy.title,
        rawText:
          action.eventType === "sos_long_press" || action.eventType === "sos_triple_press"
            ? "SOS 求助"
            : undefined,
        source: "hardware_simulator",
        severity: copy.severity,
        payload: {
          noResponseSeconds: action.eventType === "no_response_after_fall" ? 30 : undefined,
          deviceId: device?.deviceId,
          batteryLevel:
            action.eventType === "device_low_battery" ? 12 : device?.batteryLevel,
          sourceType: copy.sourceType,
        },
        status: copy.priority === "low" ? "acknowledged" : "open",
      };
      const shouldCreateTask = action.eventType !== "device_reconnected";
      const task = shouldCreateTask ? buildTaskFromEvent(state.tasks, action.elderId, event, copy) : undefined;
      const updatedDevice =
        device && action.eventType === "device_not_worn"
          ? {
              ...device,
              wearStatus: "not_worn" as DeviceWearStatus,
              dataQuality: 0.28,
              todayWearTimeHours: 2.5,
              lastSyncAt: timestamp,
            }
          : device && action.eventType === "device_low_battery"
            ? {
                ...device,
                batteryLevel: 12,
                lastSyncAt: timestamp,
              }
            : device && action.eventType === "device_reconnected"
              ? {
                  ...device,
                  connectionStatus: "online" as DeviceConnectionStatus,
                  wearStatus: "worn" as DeviceWearStatus,
                  dataQuality: 0.8,
                  todayWearTimeHours: Math.max(device.todayWearTimeHours, 12),
                  lastSyncAt: timestamp,
                }
              : device;
      const currentSnapshot = state.snapshots[action.elderId];
      const nextSnapshot =
        currentSnapshot && action.eventType === "device_not_worn"
          ? {
              ...currentSnapshot,
              dataCompleteness: 0.28,
              dataQuality: 0.28,
              wearTimeHours: 2.5,
              lastSyncedAt: timestamp,
            }
          : currentSnapshot && action.eventType === "device_reconnected"
            ? {
                ...currentSnapshot,
                dataCompleteness: 0.8,
                dataQuality: 0.8,
                wearTimeHours: Math.max(currentSnapshot.wearTimeHours, 12),
                lastSyncedAt: timestamp,
              }
            : currentSnapshot && action.eventType === "fall_detected"
              ? {
                  ...currentSnapshot,
                  fallDetected: true,
                  lastSyncedAt: timestamp,
                }
              : currentSnapshot;

      return {
        ...state,
        deviceRecords:
          updatedDevice && device
            ? {
                ...state.deviceRecords,
                [action.elderId]: updatedDevice,
              }
            : state.deviceRecords,
        snapshots:
          nextSnapshot && currentSnapshot
            ? {
                ...state.snapshots,
                [action.elderId]: nextSnapshot,
              }
            : state.snapshots,
        events: addEventOnce(state.events, task ? { ...event, linkedTaskId: task.taskId } : event),
        tasks: task ? upsertActiveTask(state.tasks, action.elderId, task) : state.tasks,
        operationalStates: {
          ...state.operationalStates,
          [action.elderId]: copy.priority === "low" ? "in_progress" : "pending",
        },
        mockBackendLogs: appendBackendLog(
          appendBackendLog(
            state.mockBackendLogs,
            createBackendLog("/api/events", "POST", "当前为前端 Mock：硬件事件已生成", {
              elder_id: action.elderId,
              event_type: action.eventType,
            }),
          ),
          createBackendLog("/api/agent/analyze", "POST", "当前为前端 Mock：事件将触发 Agent 分析", {
            elder_id: action.elderId,
            target_outputs: ["caregiver_summary", "family_summary", "institution_summary"],
          }),
        ),
      };
    }
    case "SIMULATE_VOICE_INPUT": {
      const text = action.text.trim();
      if (!text) return state;
      const isWandering = text.includes("找不到路") || text.includes("不知道在哪里");
      const isMedicationQuery = text.includes("吃什么药") || text.includes("药");
      const eventType: CareEvent["eventType"] = isWandering
        ? "wandering_help"
        : isMedicationQuery
          ? "medication_query"
          : "voice_symptom";
      const severity = isWandering ? "high_risk" : text.includes("胸口") ? "urgent" : "high_risk";
      const timestamp = isoNow();
      const taskId = nextTaskId(state.tasks, `TASK-${action.elderId}-VOICE`);
      const event: CareEvent = {
        eventId: createEventId(action.elderId, eventType),
        elderId: action.elderId,
        eventType,
        timestamp,
        title: `文字模拟语音：${text}`,
        rawText: text,
        source: "voice_simulator",
        severity,
        payload: {
          symptomKeywords: [text],
          safeZoneStatus: isWandering ? "outside" : undefined,
          sourceType: isWandering ? "location_event" : "voice_event",
        },
        status: "open",
        linkedTaskId: taskId,
        confidence: 0.92,
      };
      const task: CareTask = {
        taskId,
        elderId: action.elderId,
        sourceEventId: event.eventId,
        priority: severity === "urgent" ? "urgent" : "high",
        title: isWandering ? "陈伯位置需要立即确认" : "陈伯语音反馈需查看",
        reason: isWandering
          ? "老人表示找不到路，触发走失 / 地理围栏模拟"
          : `老人语音反馈：${text}`,
        recommendedAction: isWandering
          ? "请护工先确认老人所在区域，不展示精确轨迹。"
          : "请护工查看是否已进食和服药，并观察不适是否持续。",
        assignedTo: "护工A",
        status: "pending",
        sourceType: isWandering ? "location_event" : "voice_event",
        agentSummarySource: "mock",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const currentSnapshot = state.snapshots[action.elderId];
      return {
        ...state,
        snapshots:
          currentSnapshot && isWandering
            ? {
                ...state.snapshots,
                [action.elderId]: {
                  ...currentSnapshot,
                  locationZone: "长者中心二楼走廊外侧",
                  safeZoneStatus: "outside",
                  lastSyncedAt: timestamp,
                },
              }
            : state.snapshots,
        events: addEventOnce(state.events, event),
        tasks: upsertActiveTask(state.tasks, action.elderId, task),
        operationalStates: {
          ...state.operationalStates,
          [action.elderId]: "pending",
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/events", "POST", "当前为文字模拟语音输入，后续可接 ASR", {
            elder_id: action.elderId,
            event_type: eventType,
            raw_text: text,
          }),
        ),
      };
    }
    case "SIMULATE_GEOFENCE_EXIT": {
      const currentSnapshot = state.snapshots[action.elderId];
      const timestamp = isoNow();
      const taskId = nextTaskId(state.tasks, `TASK-${action.elderId}-GEOFENCE`);
      const event: CareEvent = {
        eventId: createEventId(action.elderId, "geofence_exit"),
        elderId: action.elderId,
        eventType: "geofence_exit",
        timestamp,
        title: "模拟离开安全区：长者中心二楼外侧",
        source: "hardware_simulator",
        severity: "high_risk",
        payload: {
          locationZone: "长者中心二楼外侧",
          safeZoneStatus: "outside",
          sourceType: "location_event",
        },
        status: "open",
        linkedTaskId: taskId,
      };
      const task: CareTask = {
        taskId,
        elderId: action.elderId,
        sourceEventId: event.eventId,
        priority: "high",
        title: "陈伯离开安全区，需确认位置",
        reason: "地理围栏模拟事件：离开安全区",
        recommendedAction: "请护工确认老人所在区域；家属端仅显示机构已收到提醒。",
        assignedTo: "护工A",
        status: "pending",
        sourceType: "location_event",
        agentSummarySource: "mock",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return {
        ...state,
        snapshots: currentSnapshot
          ? {
              ...state.snapshots,
              [action.elderId]: {
                ...currentSnapshot,
                locationZone: "长者中心二楼外侧",
                safeZoneStatus: "outside",
                lastSyncedAt: timestamp,
              },
            }
          : state.snapshots,
        events: addEventOnce(state.events, event),
        tasks: upsertActiveTask(state.tasks, action.elderId, task),
        operationalStates: {
          ...state.operationalStates,
          [action.elderId]: "pending",
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/events", "POST", "当前为前端 Mock：地理围栏事件已生成", {
            elder_id: action.elderId,
            event_type: "geofence_exit",
          }),
        ),
      };
    }
    case "SIMULATE_FALL_EVENT":
      return demoReducer(state, {
        type: "TRIGGER_HARDWARE_EVENT",
        elderId: action.elderId,
        eventType: action.stage,
      });
    case "GENERATE_AGENT_SUMMARY":
      return {
        ...state,
        agentTraces: {
          ...state.agentTraces,
          [action.trace.elderId]: action.trace,
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/agent/analyze", "POST", "当前为 Mock Agent：摘要已重新生成", {
            elder_id: action.trace.elderId,
            status: action.trace.status,
          }),
        ),
      };
    case "SIMULATE_AGENT_FAILURE": {
      const profile = state.profiles[action.elderId];
      if (!profile) return state;
      const events = getEventsForElder(state, action.elderId);
      const risk = getRiskForElder(state, action.elderId);
      const summaries = getAgentSummariesForElder(state, action.elderId);
      const trace = buildAgentTrace({
        profile,
        baseline: state.baselines[action.elderId],
        snapshot: state.snapshots[action.elderId],
        events,
        risk,
        summaries,
        initialCareMemory: state.initialCareMemoryByElderId[action.elderId],
        deviceRecord: state.deviceRecords[action.elderId],
        status: "failed",
      });
      return {
        ...state,
        agentTraces: {
          ...state.agentTraces,
          [action.elderId]: trace,
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/agent/analyze", "POST", "当前为前端 Mock：模拟 Agent 失败", {
            elder_id: action.elderId,
          }),
        ),
      };
    }
    case "FALLBACK_TO_RULE_SUMMARY":
      return {
        ...state,
        agentTraces: {
          ...state.agentTraces,
          [action.trace.elderId]: action.trace,
        },
        mockBackendLogs: appendBackendLog(
          state.mockBackendLogs,
          createBackendLog("/api/agent/analyze", "POST", "Agent 暂不可用，已 fallback 到规则摘要", {
            elder_id: action.trace.elderId,
          }),
        ),
      };
    case "UPDATE_CONSENT": {
      const record = state.consentRecords[action.elderId];
      if (!record) return state;
      return {
        ...state,
        consentRecords: {
          ...state.consentRecords,
          [action.elderId]: {
            ...record,
            [action.field]: action.value,
            updatedAt: isoNow(),
          },
        },
      };
    }
    case "UPDATE_PILOT_STATUS":
      return {
        ...state,
        pilotPlanStatus: action.status,
      };
    case "GENERATE_WEEKLY_SUMMARY":
      return {
        ...state,
        weeklySummaries: {
          ...state.weeklySummaries,
          [action.summary.elderId]: action.summary,
        },
      };
    case "ADD_BACKEND_LOG":
      return {
        ...state,
        mockBackendLogs: appendBackendLog(state.mockBackendLogs, action.log),
      };
    default:
      return state;
  }
};

const loadInitialState = () => {
  if (typeof window === "undefined") return createInitialDemoState();
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return createInitialDemoState();
  try {
    const parsed = JSON.parse(saved) as Partial<DemoState>;
    const initial = createInitialDemoState();
    return {
      ...initial,
      ...parsed,
      profiles: parsed.profiles ?? initial.profiles,
      baselines: parsed.baselines ?? initial.baselines,
      snapshots: parsed.snapshots ?? initial.snapshots,
      medicationPlans: parsed.medicationPlans ?? initial.medicationPlans,
      contacts: parsed.contacts ?? initial.contacts,
      profileDetails: parsed.profileDetails ?? initial.profileDetails,
      trends: parsed.trends ?? initial.trends,
      events: parsed.events ?? initial.events,
      tasks: parsed.tasks ?? initial.tasks,
      operationalStates: parsed.operationalStates ?? initial.operationalStates,
      initialCareMemoryByElderId:
        parsed.initialCareMemoryByElderId ?? initial.initialCareMemoryByElderId,
      memoryDraftsByElderId:
        parsed.memoryDraftsByElderId ?? initial.memoryDraftsByElderId,
      wearableImports: parsed.wearableImports ?? initial.wearableImports,
      deviceRecords: parsed.deviceRecords ?? initial.deviceRecords,
      agentMode: parsed.agentMode ?? initial.agentMode,
      agentTraces: parsed.agentTraces ?? initial.agentTraces,
      mockBackendLogs: parsed.mockBackendLogs ?? initial.mockBackendLogs,
      consentRecords: parsed.consentRecords ?? initial.consentRecords,
      pilotPlanStatus: parsed.pilotPlanStatus ?? initial.pilotPlanStatus,
      weeklySummaries: parsed.weeklySummaries ?? initial.weeklySummaries,
    };
  } catch {
    return createInitialDemoState();
  }
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(demoReducer, undefined, loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used inside DemoProvider");
  }
  return context;
};

export const getEventsForElder = (state: DemoState, elderId: string) =>
  state.events.filter((event) => event.elderId === elderId);

export const getTaskForElder = (state: DemoState, elderId: string) =>
  selectActiveTaskForElder(elderId, state.tasks) ??
  getLatestTaskForElder(elderId, state.tasks);

export const getActiveTaskForElder = (state: DemoState, elderId: string) =>
  selectActiveTaskForElder(elderId, state.tasks);

export const getTaskHistoryForElder = (state: DemoState, elderId: string) =>
  selectTaskHistoryForElder(elderId, state.tasks);

export const getRiskForElder = (
  state: DemoState,
  elderId: string,
): RiskResult =>
  calculateRisk({
    profile: state.profiles[elderId],
    baseline: state.baselines[elderId],
    snapshot: state.snapshots[elderId],
    events: getEventsForElder(state, elderId),
  });

export const getAgentSummariesForElder = (
  state: DemoState,
  elderId: string,
): AgentRoleSummaries => {
  const events = getEventsForElder(state, elderId);
  const risk = getRiskForElder(state, elderId);
  const careLoopStatus = deriveCareLoopStatus(elderId, state.tasks, events);
  const displayStatus = deriveDisplayStatus(risk, careLoopStatus);

  return generateAgentSummaries(
    state.profiles[elderId],
    state.baselines[elderId],
    state.snapshots[elderId],
    events,
    risk,
    careLoopStatus,
    displayStatus,
  );
};

export const getAgentTraceForElder = (
  state: DemoState,
  elderId: string,
): AgentTraceBundle => {
  const existing = state.agentTraces[elderId];
  if (existing) return existing;
  const events = getEventsForElder(state, elderId);
  const risk = getRiskForElder(state, elderId);
  const summaries = getAgentSummariesForElder(state, elderId);
  return buildAgentTrace({
    profile: state.profiles[elderId],
    baseline: state.baselines[elderId],
    snapshot: state.snapshots[elderId],
    events,
    risk,
    summaries,
    initialCareMemory: state.initialCareMemoryByElderId[elderId],
    deviceRecord: state.deviceRecords[elderId],
  });
};
