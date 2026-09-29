import { demoConflictInput } from "@/game/data/demo-state";
import type { SeasonConflictStep } from "@/game/season/season-flow";

export const demoSeasonSteps: SeasonConflictStep[] = [
  {
    conflictId: "conflict_technical_direction",
    round: 14,
    input: demoConflictInput,
  },
  {
    conflictId: "conflict_driver_status",
    round: 15,
    input: {
      willingnessByCharacterId: {
        char_keller: 0.92,
        char_moretti: 0.9,
        char_hartmann: 0.82,
      },
      politicalCostA: 51,
      politicalCostB: 67,
      resentment: 61,
      leverageUsed: 34,
    },
  },
];
