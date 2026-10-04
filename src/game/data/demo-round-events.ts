import type { RoundEventDefinition } from "@/game/season/round-events";

export const demoRoundEvents: RoundEventDefinition[] = [
  {
    id: "event_keller_breakthrough",
    type: "RACE_RESULT",
    title: "Keller delivers a breakthrough result",
    summary:
      "Keller beats Moretti on merit. His confidence rises and the equality question becomes harder to ignore.",
    round: 16,
    contractPerformance: [
      { characterId: "char_keller", snapshot: { points: 145, podiums: 3 } },
    ],
    effects: [
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_keller",
        delta: 5,
      },
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_moretti",
        delta: -2,
      },
      {
        type: "GOAL_URGENCY_DELTA",
        goalId: "goal_keller_equal",
        delta: 10,
      },
      {
        type: "RELATIONSHIP_DELTA",
        fromCharacterId: "char_keller",
        toCharacterId: "char_moretti",
        metric: "resentment",
        delta: 6,
      },
    ],
    conflictTriggers: [
      {
        id: "trigger_driver_status",
        all: [
          {
            type: "GOAL_URGENCY_AT_LEAST",
            goalId: "goal_keller_equal",
            value: 85,
          },
          {
            type: "CHARACTER_MOMENTUM_AT_LEAST",
            characterId: "char_keller",
            value: 5,
          },
        ],
        activateConflictId: "conflict_driver_status",
      },
    ],
  },
  {
    id: "event_moretti_form_slump",
    type: "PERFORMANCE_SWING",
    title: "Moretti's form drops",
    summary:
      "A run of weaker weekends reduces Moretti's sporting momentum and increases pressure around his privileged status.",
    round: 17,
    effects: [
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_moretti",
        delta: -6,
      },
      {
        type: "CHARACTER_INSTABILITY_DELTA",
        characterId: "char_moretti",
        delta: 8,
      },
      {
        type: "GOAL_URGENCY_DELTA",
        goalId: "goal_moretti_title",
        delta: 5,
      },
    ],
  },
  {
    id: "event_upgrade_failure",
    type: "TECHNICAL_PROBLEM",
    title: "Major upgrade fails",
    summary:
      "A high-profile technical package underperforms. Chen absorbs institutional pressure while Moretti becomes more critical of the technical direction.",
    round: 18,
    effects: [
      {
        type: "CHARACTER_MOMENTUM_DELTA",
        characterId: "char_chen",
        delta: -5,
      },
      {
        type: "CHARACTER_FATIGUE_DELTA",
        characterId: "char_chen",
        delta: 9,
      },
      {
        type: "CHARACTER_INSTABILITY_DELTA",
        characterId: "char_chen",
        delta: 7,
      },
      {
        type: "RELATIONSHIP_DELTA",
        fromCharacterId: "char_moretti",
        toCharacterId: "char_chen",
        metric: "resentment",
        delta: 9,
      },
      {
        type: "GOAL_URGENCY_DELTA",
        goalId: "goal_moretti_tech",
        delta: 10,
      },
    ],
  },
  {
    id: "event_moretti_media_campaign",
    type: "MEDIA_EVENT",
    title: "Moretti turns up the media pressure",
    summary:
      "Moretti publicly questions whether the team is fully backing him. Sponsor pressure increases and Hartmann's room to manoeuvre narrows.",
    round: 19,
    effects: [
      {
        type: "LEVERAGE_STRENGTH_DELTA",
        leverageId: "lev_moretti_sponsor",
        delta: 8,
      },
      {
        type: "RELATIONSHIP_DELTA",
        fromCharacterId: "char_moretti",
        toCharacterId: "char_hartmann",
        metric: "resentment",
        delta: 8,
      },
      {
        type: "CHARACTER_INSTABILITY_DELTA",
        characterId: "char_hartmann",
        delta: 5,
      },
    ],

  },
  {
    id: "event_moretti_contract_talks",
    type: "CONTRACT_TALK",
    title: "Moretti escalates contract talks",
    summary:
      "Moretti's camp signals that sporting guarantees will matter as much as salary. The transfer threat becomes credible enough to create a formal contract dispute.",
    round: 20,
    effects: [
      {
        type: "LEVERAGE_STRENGTH_DELTA",
        leverageId: "lev_moretti_transfer",
        delta: 8,
      },
      {
        type: "CHARACTER_FATIGUE_DELTA",
        characterId: "char_hartmann",
        delta: 6,
      },
      {
        type: "RELATIONSHIP_DELTA",
        fromCharacterId: "char_moretti",
        toCharacterId: "char_hartmann",
        metric: "dependency",
        delta: 5,
      },
    ],

  },
  {
    id: "event_varga_strategy_review",
    type: "SPORTING_EVENT",
    title: "Varga challenges race-control interference",
    summary:
      "Elena Varga warns that repeated ad-hoc intervention from above is undermining the sporting chain of command.",
    round: 21,
    effects: [
      { type: "GOAL_URGENCY_DELTA", goalId: "goal_varga_sporting", delta: 8 },
      { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "resentment", delta: 6 },
      { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_varga_sporting", delta: 4 }
    ],
  },
  {
    id: "event_laurent_owner_review",
    type: "OWNER_EVENT",
    title: "Laurent demands a governance review",
    summary:
      "Sophie Laurent wants clearer accountability after several public and sporting disputes begin to reach ownership.",
    round: 22,
    effects: [
      { type: "GOAL_URGENCY_DELTA", goalId: "goal_laurent_authority", delta: 8 },
      { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 3 },
      { type: "CHARACTER_FATIGUE_DELTA", characterId: "char_hartmann", delta: 4 }
    ],
  },
  {
    id: "event_salazar_activation_push",
    type: "SPONSOR_EVENT",
    title: "Salazar pushes for a Moretti-led sponsor campaign",
    summary:
      "Victor Salazar wants the team to commit Moretti to a major commercial activation while the driver's political status remains unsettled.",
    round: 23,
    effects: [
      { type: "GOAL_URGENCY_DELTA", goalId: "goal_salazar_moretti", delta: 9 },
      { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 5 },
      { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "dependency", delta: 5 }
    ],
  },
  {
    id: "event_bellini_staff_fracture",
    type: "STAFF_EVENT",
    title: "Bellini questions who protects the race team",
    summary:
      "Marco Bellini says engineers and race staff are being pulled into driver and management politics without clear protection from leadership.",
    round: 24,
    effects: [
      { type: "GOAL_URGENCY_DELTA", goalId: "goal_bellini_engineering", delta: 10 },
      { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 5 },
      { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "resentment", delta: 7 }
    ],
  },
  {
    id: "event_round_22_contract_results",
    type: "RACE_RESULT",
    title: "Moretti reaches four wins as Vanguard slips to fourth",
    summary: "Moretti reaches four wins and second in the drivers' standings, while Vanguard slips to fourth in the team championship. The Contract Room reflects the bonuses and clauses unlocked by these results.",
    round: 22,
    effects: [],
    contractPerformance: [
      { characterId: "char_moretti", snapshot: {
        wins: 4, driverChampionshipPosition: 2, teamChampionshipPosition: 4,
      } },
    ],
  }
];
