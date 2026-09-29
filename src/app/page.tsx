import { SeasonFlowGame } from "@/components/political/SeasonFlowGame";
import { demoIssueDefinitions } from "@/game/data/demo-issues";
import { demoRoundEvents } from "@/game/data/demo-round-events";
import { demoSeasonSteps } from "@/game/data/demo-season";
import { demoState } from "@/game/data/demo-state";
import { validatePoliticalCoreState } from "@/game/political/validation";

export default function Home() {
  const validation = validatePoliticalCoreState(demoState);

  if (!validation.success) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">Political Core validation failed</h1>
        <pre className="mt-6 overflow-auto rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm">
          {JSON.stringify(validation.errors, null, 2)}
        </pre>
      </main>
    );
  }

  return (
    <SeasonFlowGame
      initialState={validation.data}
      steps={demoSeasonSteps}
      roundEvents={demoRoundEvents}
      issueDefinitions={demoIssueDefinitions}
    />
  );
}
