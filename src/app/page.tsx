import { ConflictDecisionGame } from "@/components/political/ConflictDecisionGame";
import { demoConflictInput, demoState } from "@/game/data/demo-state";
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
    <ConflictDecisionGame
      initialState={validation.data}
      conflictInput={demoConflictInput}
      round={14}
    />
  );
}
