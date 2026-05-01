import "server-only";

import { broadcastSnapshot as fallbackSnapshot } from "@/lib/demo-data";
import { formatSnapshotTime, loadHzu18Snapshot } from "@/lib/hzu18";
import type { BroadcastSnapshot } from "@/lib/types";

export async function loadBroadcastSnapshot(): Promise<BroadcastSnapshot> {
  const liveSnapshot = await loadHzu18Snapshot();

  if (liveSnapshot) {
    return liveSnapshot;
  }

  return {
    ...fallbackSnapshot,
    dataSource: "fallback",
    snapshotTime: formatSnapshotTime(),
    notes: [
      "The HZU18 plugin API is unavailable, so the display is using local fallback data.",
      ...fallbackSnapshot.notes,
    ],
  };
}
