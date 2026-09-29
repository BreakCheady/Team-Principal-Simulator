import type { IssueDefinition } from "@/game/issues/issues";

export const demoIssueDefinitions: IssueDefinition[] = [
  {
    id: "issue_upgrade_fallout",
    sourceEventId: "event_upgrade_failure",
    title: "Technical fallout after failed upgrade",
    summary:
      "Chen is under pressure and Moretti is openly frustrated. You can contain the disagreement before it becomes another authority battle.",
    category: "TECHNICAL",
    initiatorCharacterId: "char_moretti",
    baseEscalation: 42,
    escalationThreshold: 72,
    actions: [
      {
        id: "back_technical_process",
        label: "Back the technical process",
        description:
          "Publicly protect Chen's authority while acknowledging the failed package.",
        escalationDelta: -8,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "resentment",
            delta: 4,
          },
          {
            type: "CHARACTER_MOMENTUM_DELTA",
            characterId: "char_chen",
            delta: 2,
          },
        ],
      },
      {
        id: "mediate_technical_review",
        label: "Hold a private technical review",
        description:
          "Give Moretti a hearing while preserving Chen's final authority.",
        escalationDelta: -22,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_chen",
            metric: "resentment",
            delta: -8,
          },
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "trust",
            delta: 5,
          },
        ],
      },
      {
        id: "ignore_upgrade_fallout",
        label: "Let engineering handle it",
        description:
          "Take no political action and hope the frustration fades with the next result.",
        escalationDelta: 12,
        effects: [
          {
            type: "CHARACTER_FATIGUE_DELTA",
            characterId: "char_chen",
            delta: 4,
          },
        ],
      },
    ],
  },
  {
    id: "issue_media_pressure",
    sourceEventId: "event_moretti_media_campaign",
    title: "Moretti challenges the team in public",
    summary:
      "The story is now moving through the paddock. A measured response could contain it; silence may let Moretti define the narrative.",
    category: "MEDIA",
    initiatorCharacterId: "char_moretti",
    baseEscalation: 55,
    escalationThreshold: 70,
    actions: [
      {
        id: "private_media_meeting",
        label: "Call Moretti in privately",
        description:
          "Offer a direct conversation and ask him to stop escalating the dispute through the media.",
        escalationDelta: -45,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "trust",
            delta: 6,
          },
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "resentment",
            delta: -5,
          },
          {
            type: "LEVERAGE_STRENGTH_DELTA",
            leverageId: "lev_moretti_sponsor",
            delta: -5,
          },
        ],
      },
      {
        id: "public_media_rebuttal",
        label: "Publicly rebut the criticism",
        description:
          "Defend the team publicly and challenge Moretti's version of events.",
        escalationDelta: 12,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "resentment",
            delta: 10,
          },
          {
            type: "CHARACTER_MOMENTUM_DELTA",
            characterId: "char_hartmann",
            delta: 2,
          },
        ],
      },
      {
        id: "ignore_media_story",
        label: "Say nothing",
        description:
          "Avoid feeding the story, but give Moretti's camp space to control the narrative.",
        escalationDelta: 15,
        effects: [
          {
            type: "LEVERAGE_STRENGTH_DELTA",
            leverageId: "lev_moretti_sponsor",
            delta: 5,
          },
        ],
      },
    ],
    spawnedConflict: {
      id: "conflict_moretti_media_pressure",
      type: "MEDIA_CONFLICT",
      status: "ACTIVE",
      initiatorCharacterId: "char_moretti",
      issue:
        "Moretti's public criticism turns a sporting disagreement into a battle over who controls the team's public narrative.",
      stakes: 62,
      publicExposure: 84,
      factions: [
        {
          id: "faction_moretti_media",
          leaderCharacterId: "char_moretti",
          memberCharacterIds: ["char_moretti"],
          alliancePower: 0,
          legitimacy: 55,
          leverage: 0,
          friction: 7,
          momentum: 50,
        },
        {
          id: "faction_hartmann_media",
          leaderCharacterId: "char_hartmann",
          memberCharacterIds: ["char_hartmann"],
          alliancePower: 0,
          legitimacy: 76,
          leverage: 0,
          friction: 4,
          momentum: 50,
        },
      ],
      swingActorIds: ["char_chen", "char_keller"],
      roundStarted: 19,
      precedentIds: [],
    },
  },
  {
    id: "issue_contract_demands",
    sourceEventId: "event_moretti_contract_talks",
    title: "Moretti ties his contract to sporting guarantees",
    summary:
      "The renewal discussion is no longer only financial. Moretti wants sporting assurances and his transfer leverage is credible.",
    category: "CONTRACT",
    initiatorCharacterId: "char_moretti",
    baseEscalation: 60,
    escalationThreshold: 74,
    actions: [
      {
        id: "structured_contract_talks",
        label: "Open structured negotiations",
        description:
          "Discuss sporting expectations without granting a permanent number-one guarantee.",
        escalationDelta: -32,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "trust",
            delta: 5,
          },
          {
            type: "LEVERAGE_STRENGTH_DELTA",
            leverageId: "lev_moretti_transfer",
            delta: -4,
          },
        ],
      },
      {
        id: "offer_sporting_guarantees",
        label: "Offer limited sporting guarantees",
        description:
          "Reduce contract tension at the cost of strengthening Moretti's political position.",
        escalationDelta: -42,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "loyalty",
            delta: 7,
          },
          {
            type: "LEVERAGE_STRENGTH_DELTA",
            leverageId: "lev_moretti_transfer",
            delta: -8,
          },
          {
            type: "GOAL_URGENCY_DELTA",
            goalId: "goal_keller_equal",
            delta: 8,
          },
        ],
      },
      {
        id: "refuse_contract_pressure",
        label: "Refuse to negotiate under pressure",
        description:
          "Protect team authority and force Moretti's camp to decide whether the threat is real.",
        escalationDelta: 18,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_moretti",
            toCharacterId: "char_hartmann",
            metric: "resentment",
            delta: 8,
          },
          {
            type: "CHARACTER_MOMENTUM_DELTA",
            characterId: "char_hartmann",
            delta: 3,
          },
        ],
      },
    ],
    spawnedConflict: {
      id: "conflict_moretti_contract",
      type: "CONTRACT_DISPUTE",
      status: "ACTIVE",
      initiatorCharacterId: "char_moretti",
      issue:
        "Moretti ties his next contract to sporting guarantees and threatens to explore the market.",
      stakes: 79,
      publicExposure: 36,
      factions: [
        {
          id: "faction_moretti_contract",
          leaderCharacterId: "char_moretti",
          memberCharacterIds: ["char_moretti"],
          alliancePower: 0,
          legitimacy: 68,
          leverage: 0,
          friction: 5,
          momentum: 50,
        },
        {
          id: "faction_hartmann_contract",
          leaderCharacterId: "char_hartmann",
          memberCharacterIds: ["char_hartmann"],
          alliancePower: 0,
          legitimacy: 74,
          leverage: 0,
          friction: 5,
          momentum: 50,
        },
      ],
      swingActorIds: ["char_chen", "char_keller"],
      roundStarted: 20,
      precedentIds: ["precedent_driver_priority"],
    },
  },
];
