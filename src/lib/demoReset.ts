import type { Dispatch } from "react";
import type { DemoAction } from "../store/demoStore";

export const demoStorageKey = "careband-agent-demo-state-v0.2";

export const resetLocalDemoState = (dispatch: Dispatch<DemoAction>) => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(demoStorageKey);
  }
  dispatch({ type: "RESET_DEMO" });
};

export const confirmAndResetLocalDemoState = (dispatch: Dispatch<DemoAction>) => {
  const message =
    "此操作只會清除本瀏覽器中的前端 Mock Demo 狀態，不會影響任何真實後端或真實資料。";
  if (typeof window === "undefined" || window.confirm(message)) {
    resetLocalDemoState(dispatch);
  }
};
