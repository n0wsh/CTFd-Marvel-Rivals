import { ScoreboardPage } from "@/components/scoreboard/scoreboard-page";
import { loadBroadcastSnapshot } from "@/lib/ctfd";

export const dynamic = "force-dynamic";

export default async function ResultPage() {
  const resultSnapshot = await loadBroadcastSnapshot("result");

  return <ScoreboardPage mode="result" snapshot={resultSnapshot} />;
}
