import type { WearableDataSource } from "../types";
import { StatusPill } from "./StatusPill";

interface WearableDataSourceBadgeProps {
  source?: WearableDataSource;
}

export const WearableDataSourceBadge = ({ source = "Mock Data" }: WearableDataSourceBadgeProps) => {
  const future = ["Apple Health", "Android Health Connect", "Fitbit", "Zepp / Amazfit"].includes(
    source,
  );
  const suffix = future ? "（Future Integration · 未接入真實服務）" : "（Mock only）";
  return (
    <StatusPill
      label={`${source}${suffix}`}
      tone={future ? "observation" : "stable"}
    />
  );
};
