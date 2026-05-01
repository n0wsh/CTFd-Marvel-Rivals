import { ScoreboardPage } from "@/components/scoreboard/scoreboard-page";
import { loadBroadcastSnapshot } from "@/lib/ctfd";

export const dynamic = "force-dynamic";

export default async function Home() {
  const broadcastSnapshot = await loadBroadcastSnapshot();

  return <ScoreboardPage snapshot={broadcastSnapshot} />;
}
