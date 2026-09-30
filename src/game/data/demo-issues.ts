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
        escalationDelta: -14,
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
        escalationDelta: 9,
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
        escalationDelta: -20,
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
        escalationDelta: 10,
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
        escalationDelta: 8,
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
        escalationDelta: -14,
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
        escalationDelta: -22,
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
        escalationDelta: 12,
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
  {
    id: "issue_varga_sporting_control",
    sourceEventId: "event_varga_strategy_review",
    title: "Who controls race-day sporting decisions?",
    summary:
      "Varga wants a clear mandate. Repeated intervention may protect short-term results but weakens the sporting chain of command.",
    category: "SPORTING",
    initiatorCharacterId: "char_varga",
    baseEscalation: 48,
    escalationThreshold: 74,
    actions: [
      {
        id: "clarify_varga_mandate",
        label: "Clarify Varga's mandate",
        description:
          "Give Varga defined race-day authority while retaining emergency escalation to the team principal.",
        escalationDelta: -14,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "trust", delta: 6 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_varga_sporting", delta: -3 }
        ],
      },
      {
        id: "keep_personal_sporting_control",
        label: "Keep personal control",
        description:
          "Reserve the right to overrule strategy directly when championship stakes are high.",
        escalationDelta: 8,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 2 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "resentment", delta: 8 }
        ],
        followUpIssueDefinitionId: "issue_owner_governance_chain",
      },
      {
        id: "back_varga_publicly",
        label: "Back Varga publicly",
        description:
          "Make the sporting director visibly accountable for race operations, including unpopular calls.",
        escalationDelta: -8,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_varga", delta: 3 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "loyalty", delta: 5 }
        ],
      },
    ],
  },
  {
    id: "issue_laurent_owner_review",
    sourceEventId: "event_laurent_owner_review",
    title: "Ownership wants clearer accountability",
    summary:
      "Laurent wants fewer surprises reaching the board. The question is whether oversight becomes governance or direct intervention.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 52,
    escalationThreshold: 76,
    actions: [
      {
        id: "define_owner_boundaries",
        label: "Define formal owner boundaries",
        description:
          "Agree on reporting and escalation rules without giving ownership operational sign-off.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: -3 }
        ],
      },
      {
        id: "accept_owner_signoff",
        label: "Accept owner sign-off",
        description:
          "Let Laurent approve major sporting and personnel exceptions before they are executed.",
        escalationDelta: -17,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "loyalty", delta: 6 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: -2 }
        ],
        followUpIssueDefinitionId: "issue_sporting_autonomy_chain",
      },
      {
        id: "resist_owner_intervention",
        label: "Resist operational intervention",
        description:
          "Protect team-principal authority and accept a more difficult board relationship.",
        escalationDelta: 11,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "resentment", delta: 9 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 3 }
        ],
      },
    ],
  },
  {
    id: "issue_salazar_sponsor_activation",
    sourceEventId: "event_salazar_activation_push",
    title: "Sponsor wants Moretti at the centre of the campaign",
    summary:
      "Salazar sees commercial value in Moretti's star status. Committing now could reshape sporting expectations inside the team.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 50,
    escalationThreshold: 73,
    actions: [
      {
        id: "negotiate_sponsor_scope",
        label: "Negotiate campaign scope",
        description:
          "Give the sponsor access to Moretti without tying commercial prominence to sporting priority.",
        escalationDelta: -10,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: -4 }
        ],
      },
      {
        id: "make_moretti_campaign_face",
        label: "Make Moretti the campaign face",
        description:
          "Maximise sponsor value now and accept that the paddock will read it as another sign of star-driver privilege.",
        escalationDelta: -15,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 3 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "loyalty", delta: 6 },
          { type: "GOAL_URGENCY_DELTA", goalId: "goal_keller_equal", delta: 6 }
        ],
        followUpIssueDefinitionId: "issue_staff_star_treatment",
      },
      {
        id: "reject_sponsor_pressure",
        label: "Reject sponsor pressure",
        description:
          "Keep sporting status separate from commercial demands even if the sponsor feels ignored.",
        escalationDelta: 10,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "resentment", delta: 8 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 5 }
        ],
        followUpIssueDefinitionId: "issue_owner_commercial_chain",
      },
    ],
  },
  {
    id: "issue_bellini_staff_protection",
    sourceEventId: "event_bellini_staff_fracture",
    title: "Race staff want protection from paddock politics",
    summary:
      "Bellini says engineers are becoming political proxies. The response will shape whether staff loyalty follows structure or personalities.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 46,
    escalationThreshold: 72,
    actions: [
      {
        id: "protect_staff_boundary",
        label: "Protect the staff boundary",
        description:
          "Tell drivers and management that engineers cannot be used as political intermediaries.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 6 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: -3 }
        ],
      },
      {
        id: "allow_driver_engineer_bloc",
        label: "Let Bellini stay close to Moretti",
        description:
          "Preserve the successful driver-engineer relationship even if it creates an informal political bloc.",
        escalationDelta: -7,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_moretti", metric: "loyalty", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 4 }
        ],
        followUpIssueDefinitionId: "issue_chen_staff_authority_chain",
      },
      {
        id: "order_staff_neutrality",
        label: "Order staff to stay neutral",
        description:
          "Use formal authority to shut down political involvement without addressing why staff feel exposed.",
        escalationDelta: 9,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "resentment", delta: 8 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 2 }
        ],
      },
    ],
  },
  {
    id: "issue_owner_governance_chain",
    title: "Laurent questions Hartmann's concentration of control",
    summary:
      "Varga's complaint reaches the CEO. Laurent now wants to know whether too many operational decisions depend on Hartmann personally.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 44,
    escalationThreshold: 75,
    actions: [
      {
        id: "owner_governance_review",
        label: "Accept a governance review",
        description: "Formalise decision rights before ownership imposes its own structure.",
        escalationDelta: -11,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 4 }
        ],
      },
      {
        id: "centralize_under_ceo",
        label: "Centralise exceptions under the CEO",
        description: "Trade autonomy for board confidence by escalating key exceptions to Laurent.",
        escalationDelta: -15,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: -2 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 5 }
        ],
        followUpIssueDefinitionId: "issue_sporting_autonomy_chain",
      }
    ],
  },
  {
    id: "issue_sporting_autonomy_chain",
    title: "Varga pushes back on owner sign-off",
    summary:
      "The sporting director argues that board approval on operational exceptions makes accountability impossible on race weekends.",
    category: "SPORTING",
    initiatorCharacterId: "char_varga",
    baseEscalation: 47,
    escalationThreshold: 74,
    actions: [
      {
        id: "protect_operational_autonomy",
        label: "Protect operational autonomy",
        description: "Keep owner reporting but return race-day authority to the sporting chain.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "resentment", delta: 3 }
        ],
      },
      {
        id: "keep_owner_override",
        label: "Keep the owner override",
        description: "Prioritise governance confidence over sporting autonomy.",
        escalationDelta: 8,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "resentment", delta: 7 }
        ],
      }
    ],
  },
  {
    id: "issue_staff_star_treatment",
    title: "Staff see commercial privilege becoming sporting privilege",
    summary:
      "Bellini warns that the sponsor campaign is being interpreted inside the garage as another signal that Moretti sits above normal team rules.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 43,
    escalationThreshold: 72,
    actions: [
      {
        id: "separate_commercial_and_sporting",
        label: "Separate commercial and sporting status",
        description: "Keep Moretti visible commercially while explicitly reaffirming equal sporting rules.",
        escalationDelta: -13,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "GOAL_URGENCY_DELTA", goalId: "goal_keller_equal", delta: -4 }
        ],
      },
      {
        id: "accept_star_treatment",
        label: "Accept star treatment",
        description: "Treat commercial and sporting hierarchy as part of the same star-driver strategy.",
        escalationDelta: 9,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 5 },
          { type: "GOAL_URGENCY_DELTA", goalId: "goal_keller_equal", delta: 7 }
        ],
      }
    ],
  },
  {
    id: "issue_owner_commercial_chain",
    title: "Laurent worries about sponsor confidence",
    summary:
      "After Hartmann rejects sponsor pressure, Laurent asks whether the team can afford a governance principle that creates commercial risk.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 45,
    escalationThreshold: 75,
    actions: [
      {
        id: "back_hartmann_commercially",
        label: "Ask Laurent to back the boundary",
        description: "Make ownership absorb the sponsor relationship while Hartmann protects sporting independence.",
        escalationDelta: -9,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 3 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 3 }
        ],
      },
      {
        id: "reopen_sponsor_concession",
        label: "Reopen a sponsor concession",
        description: "Reduce commercial risk by giving Salazar a narrower victory.",
        escalationDelta: -13,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "resentment", delta: -5 }
        ],
      }
    ],
  },
  {
    id: "issue_chen_staff_authority_chain",
    title: "Chen challenges the Moretti-Bellini bloc",
    summary:
      "Chen sees the driver-engineer relationship becoming an alternative power structure inside the technical organisation.",
    category: "TECHNICAL",
    initiatorCharacterId: "char_chen",
    baseEscalation: 51,
    escalationThreshold: 74,
    actions: [
      {
        id: "formalize_engineer_reporting",
        label: "Formalise Bellini's reporting line",
        description: "Protect the driver relationship but make technical accountability explicit under Chen.",
        escalationDelta: -12,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_chen_technical", delta: 3 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 2 }
        ],
      },
      {
        id: "protect_driver_engineer_independence",
        label: "Protect driver-engineer independence",
        description: "Keep Bellini close to Moretti even if Chen reads it as a challenge to technical authority.",
        escalationDelta: 10,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_moretti", delta: 2 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_chen_technical", delta: 5 }
        ],
      }
    ],
  },
  {
    id: "issue_contract_negotiation_stall",
    title: "Contract talks have stalled",
    summary:
      "A failed renewal process is now becoming a wider management problem. Ownership wants clarity before uncertainty spreads through the paddock.",
    category: "CONTRACT",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 54,
    escalationThreshold: 76,
    actions: [
      {
        id: "reopen_contract_channel",
        label: "Reopen the channel",
        description:
          "Give the negotiation another route without immediately improving the financial package.",
        escalationDelta: -10,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_laurent",
            toCharacterId: "char_hartmann",
            metric: "trust",
            delta: 3
          }
        ],
      },
      {
        id: "hold_contract_line_publicly",
        label: "Hold the line",
        description:
          "Signal that no individual can force the team into a deal, accepting higher exit risk.",
        escalationDelta: 9,
        effects: [
          {
            type: "CHARACTER_MOMENTUM_DELTA",
            characterId: "char_hartmann",
            delta: 2
          }
        ],
        followUpIssueDefinitionId: "issue_owner_contract_risk",
      },
    ],
  },
  {
    id: "issue_contract_release_precedent",
    title: "A new release clause changes the contract precedent",
    summary:
      "The renewal is signed, but ownership now worries that giving senior figures an easier exit route will shape every future negotiation.",
    category: "CONTRACT",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 40,
    escalationThreshold: 72,
    actions: [
      {
        id: "treat_release_as_exception",
        label: "Define it as a one-off exception",
        description:
          "Document the clause as a specific retention concession rather than a new team standard.",
        escalationDelta: -12,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_laurent",
            toCharacterId: "char_hartmann",
            metric: "trust",
            delta: 4
          }
        ],
      },
      {
        id: "accept_release_precedent",
        label: "Accept the new precedent",
        description:
          "Use flexible exit clauses as a deliberate retention tool, even if future negotiations become harder.",
        escalationDelta: 4,
        effects: [
          {
            type: "LEVERAGE_STRENGTH_DELTA",
            leverageId: "lev_laurent_owner",
            delta: 4
          }
        ],
      },
    ],
  },
  {
    id: "issue_owner_contract_risk",
    title: "Ownership questions the risk of losing key personnel",
    summary:
      "The hard contract line protects authority, but Laurent now wants a plan for the sporting and commercial cost of a possible departure.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 46,
    escalationThreshold: 74,
    actions: [
      {
        id: "prepare_replacement_plan",
        label: "Prepare a replacement plan",
        description:
          "Reduce dependency by planning alternatives rather than weakening the negotiating position.",
        escalationDelta: -11,
        effects: [
          {
            type: "RELATIONSHIP_DELTA",
            fromCharacterId: "char_laurent",
            toCharacterId: "char_hartmann",
            metric: "trust",
            delta: 4
          }
        ],
      },
      {
        id: "authorize_better_contract_terms",
        label: "Authorize better terms",
        description:
          "Give Hartmann more financial room for the next negotiating round.",
        escalationDelta: -14,
        effects: [
          {
            type: "LEVERAGE_STRENGTH_DELTA",
            leverageId: "lev_laurent_owner",
            delta: -3
          }
        ],
      },
    ],
  }
];
