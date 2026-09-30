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
  },
  {
    id: "issue_contract_failed_owner_reaction",
    title: "Ownership demands a retention contingency",
    summary:
      "Failed contract talks expose the risk of losing a key figure. Laurent wants a replacement and succession plan before the uncertainty spreads.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 50,
    escalationThreshold: 75,
    actions: [
      {
        id: "build_retention_contingency",
        label: "Build a contingency plan",
        description:
          "Prepare replacement options and define the sporting cost of losing the negotiating party.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 4 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: -2 }
        ],
              consequenceHints: [
          "Owner trust rises",
          "Owner leverage falls",
          "Retention risk becomes manageable",
        ],
      },
      {
        id: "ask_owner_for_more_budget",
        label: "Ask for more budget",
        description:
          "Reopen the financial ceiling and accept greater owner involvement in the next negotiating round.",
        escalationDelta: -8,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 4 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "dependency", delta: 5 }
        ],
              consequenceHints: [
          "More room for the next deal",
          "Owner leverage rises",
          "Hartmann becomes more dependent on ownership",
        ],
      }
    ,
      {
        id: "reject_owner_retention_pressure",
        label: "Reject the retention panic",
        description:
          "Keep the board out of the negotiation and insist that the team can absorb a departure if necessary.",
        escalationDelta: 8,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 2 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "resentment", delta: 7 }
        ],
        consequenceHints: ["Hartmann authority rises", "Owner resentment rises", "No extra retention resources"],
      }
    ],
  },
  {
    id: "issue_contract_failed_sponsor_reaction",
    title: "Sponsor confidence drops after failed talks",
    summary:
      "Salazar worries that losing a high-profile figure will weaken future campaigns and wants commercial reassurance.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 48,
    escalationThreshold: 73,
    actions: [
      {
        id: "reassure_sponsor_continuity",
        label: "Reassure sponsor continuity",
        description:
          "Commit to a replacement marketing plan without promising a richer contract.",
        escalationDelta: -11,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "trust", delta: 4 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: -3 }
        ],
              consequenceHints: [
          "Sponsor trust rises",
          "Sponsor leverage falls",
          "Commercial continuity is protected",
        ],
      },
      {
        id: "use_sponsor_to_reopen_talks",
        label: "Use sponsor pressure to reopen talks",
        description:
          "Invite Salazar into the retention effort, giving commercial interests more influence over the negotiation.",
        escalationDelta: -6,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 6 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "dependency", delta: 5 }
        ],
              consequenceHints: [
          "Talks gain commercial pressure",
          "Sponsor leverage rises sharply",
          "Hartmann becomes more dependent on Salazar",
        ],
      }
    ,
      {
        id: "firewall_sponsor_from_contracts",
        label: "Keep contracts separate from sponsorship",
        description:
          "Draw a hard boundary between commercial value and employment negotiations.",
        escalationDelta: 5,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "resentment", delta: 6 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 1 }
        ],
        consequenceHints: ["Contract authority is protected", "Sponsor resentment rises", "Commercial help is unavailable"],
      }
    ],
  },
  {
    id: "issue_contract_failed_staff_reaction",
    title: "Staff read the failed talks as instability",
    summary:
      "Bellini says the garage now expects wider personnel changes and wants clarity before uncertainty affects day-to-day work.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 44,
    escalationThreshold: 71,
    actions: [
      {
        id: "brief_staff_on_continuity",
        label: "Brief the staff",
        description:
          "Explain the succession plan and protect the garage from contract speculation.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: -2 }
        ],
              consequenceHints: [
          "Staff trust rises",
          "Staff leverage falls",
          "Rumour pressure is contained",
        ],
      },
      {
        id: "keep_failed_talks_private",
        label: "Keep the details private",
        description:
          "Limit information internally and accept that staff may fill the gaps themselves.",
        escalationDelta: 7,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "resentment", delta: 6 }
        ],
              consequenceHints: [
          "Management secrecy is preserved",
          "Staff resentment rises",
          "Rumours remain uncontrolled",
        ],
      }
    ,
      {
        id: "give_staff_continuity_voice",
        label: "Give staff a continuity voice",
        description:
          "Bring Bellini into succession planning so the garage has representation in the transition.",
        escalationDelta: -8,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "loyalty", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 5 }
        ],
        consequenceHints: ["Staff loyalty rises", "Staff leverage rises", "Continuity planning becomes more collaborative"],
      }
    ],
  },
  {
    id: "issue_contract_hard_owner_reaction",
    title: "Ownership backs the discipline but questions the risk",
    summary:
      "A hard renewal protects cost control and authority, but Laurent wants to know whether Hartmann has pushed too close to losing a key asset.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 38,
    escalationThreshold: 70,
    actions: [
      {
        id: "defend_hard_contract_policy",
        label: "Defend the hard line",
        description:
          "Frame the deal as proof that the team can retain talent without surrendering financial discipline.",
        escalationDelta: -9,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "respect", delta: 5 }
        ],
              consequenceHints: [
          "Owner respect rises",
          "Hartmann keeps negotiating autonomy",
          "Retention risk remains accepted",
        ],
      },
      {
        id: "add_owner_review_gate",
        label: "Add owner review for future hard offers",
        description:
          "Keep the policy but give Laurent earlier oversight when a key renewal becomes confrontational.",
        escalationDelta: -13,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 4 }
        ],
              consequenceHints: [
          "Owner concern drops sharply",
          "Owner leverage rises",
          "Future negotiations lose autonomy",
        ],
      }
    ,
      {
        id: "offer_owner_risk_reporting",
        label: "Offer risk reporting, not veto power",
        description:
          "Give Laurent earlier information and scenario planning without granting formal approval rights.",
        escalationDelta: -7,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 3 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 1 }
        ],
        consequenceHints: ["Owner trust rises moderately", "Hartmann keeps final authority", "Some board concern remains"],
      }
    ],
  },
  {
    id: "issue_contract_hard_sponsor_reaction",
    title: "Sponsor worries the hard deal damages the relationship",
    summary:
      "Salazar sees the renewal as financially disciplined but fears the negotiating tone has weakened the star relationship behind future campaigns.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 46,
    escalationThreshold: 72,
    actions: [
      {
        id: "separate_sponsor_relationship",
        label: "Repair the commercial relationship",
        description:
          "Give the sponsor direct reassurance that a hard contract process does not mean reduced commercial commitment.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "trust", delta: 5 }
        ],
              consequenceHints: [
          "Sponsor trust rises",
          "Commercial relationship is insulated",
          "No new sponsor authority",
        ],
      },
      {
        id: "tell_sponsor_to_stay_out",
        label: "Keep the sponsor out",
        description:
          "Protect contract authority and accept a colder commercial relationship.",
        escalationDelta: 8,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "resentment", delta: 7 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 4 }
        ],
              consequenceHints: [
          "Contract authority stays clean",
          "Sponsor resentment rises",
          "Sponsor pressure strengthens",
        ],
      }
    ,
      {
        id: "trade_activation_access",
        label: "Trade activation access for support",
        description:
          "Give Salazar more commercial access in return for staying out of future contract negotiations.",
        escalationDelta: -8,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "loyalty", delta: 4 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 5 }
        ],
        consequenceHints: ["Sponsor loyalty rises", "Sponsor leverage rises", "Contract process remains formally independent"],
      }
    ],
  },
  {
    id: "issue_contract_hard_staff_reaction",
    title: "Staff see a tougher contract culture",
    summary:
      "Bellini says the hard renewal has been noticed across the team and could change how staff read their own security and bargaining position.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 42,
    escalationThreshold: 70,
    actions: [
      {
        id: "explain_contract_discipline",
        label: "Explain the policy",
        description:
          "Make clear that the hard line was specific to leverage and does not mean blanket pressure on staff.",
        escalationDelta: -11,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 4 }
        ],
              consequenceHints: [
          "Staff trust rises",
          "Hard-line precedent is narrowed",
          "No extra staff bargaining power",
        ],
      },
      {
        id: "embrace_tough_contract_culture",
        label: "Embrace the tougher culture",
        description:
          "Signal that future deals will also be hard-nosed, increasing authority but lowering staff comfort.",
        escalationDelta: 7,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 5 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "resentment", delta: 5 }
        ],
              consequenceHints: [
          "Management authority is reinforced",
          "Staff leverage rises defensively",
          "Staff resentment rises",
        ],
      }
    ,
      {
        id: "create_staff_contract_charter",
        label: "Create a staff contract charter",
        description:
          "Set minimum process standards for future staff renewals without promising richer deals.",
        escalationDelta: -7,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "loyalty", delta: 4 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 3 }
        ],
        consequenceHints: ["Staff loyalty rises", "Staff gains procedural leverage", "Future negotiations become more structured"],
      }
    ],
  },
  {
    id: "issue_contract_generous_owner_reaction",
    title: "Ownership questions the cost precedent",
    summary:
      "The generous renewal secures continuity, but Laurent worries that the package has reset expectations for every senior contract.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 47,
    escalationThreshold: 73,
    actions: [
      {
        id: "ringfence_generous_deal",
        label: "Ring-fence the deal",
        description:
          "Document the package as an exceptional retention decision rather than a new salary benchmark.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 4 }
        ],
              consequenceHints: [
          "Owner trust rises",
          "Cost precedent is contained",
          "Hartmann keeps budget autonomy",
        ],
      },
      {
        id: "accept_higher_retention_costs",
        label: "Accept higher retention costs",
        description:
          "Treat generous renewals as the price of stability, giving ownership more reason to monitor future deals.",
        escalationDelta: 5,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 5 }
        ],
              consequenceHints: [
          "Retention philosophy becomes more generous",
          "Owner leverage rises",
          "Future salary pressure increases",
        ],
      }
    ,
      {
        id: "tie_generosity_to_performance",
        label: "Tie future generosity to performance",
        description:
          "Keep this deal intact but require stronger performance triggers on future premium renewals.",
        escalationDelta: -7,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "respect", delta: 4 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 1 }
        ],
        consequenceHints: ["Owner respect rises", "Future premium deals need measurable returns", "Current contract remains untouched"],
      }
    ],
  },
  {
    id: "issue_contract_generous_sponsor_reaction",
    title: "Sponsor sees an opportunity in the generous renewal",
    summary:
      "Salazar views the richer deal as proof of long-term commitment and wants the renewed figure tied more closely to commercial activation.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 36,
    escalationThreshold: 69,
    actions: [
      {
        id: "limit_sponsor_linkage",
        label: "Limit commercial linkage",
        description:
          "Use the stability commercially without turning contract generosity into sponsor influence over sporting status.",
        escalationDelta: -10,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "trust", delta: 3 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: -2 }
        ],
              consequenceHints: [
          "Sponsor trust rises",
          "Sponsor leverage falls",
          "Sporting independence stays protected",
        ],
      },
      {
        id: "expand_sponsor_access",
        label: "Expand sponsor access",
        description:
          "Monetise the new stability by giving Salazar more access and activation rights.",
        escalationDelta: -13,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 5 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "loyalty", delta: 5 }
        ],
              consequenceHints: [
          "Sponsor loyalty rises strongly",
          "Sponsor leverage rises",
          "Commercial commitments expand",
        ],
      }
    ,
      {
        id: "sell_campaign_rights_only",
        label: "Sell campaign rights, not influence",
        description:
          "Offer more content and appearances while explicitly excluding sponsor input on sporting status.",
        escalationDelta: -8,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "trust", delta: 4 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: 2 }
        ],
        consequenceHints: ["Sponsor trust rises", "Commercial leverage rises slightly", "Sporting authority remains with the team"],
      }
    ],
  },
  {
    id: "issue_contract_generous_staff_reaction",
    title: "Staff question the new pay hierarchy",
    summary:
      "Bellini says a visibly generous renewal has changed expectations inside the garage about who is valued and how strongly.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 45,
    escalationThreshold: 71,
    actions: [
      {
        id: "explain_retention_value",
        label: "Explain the retention case",
        description:
          "Present the package as a role-specific retention decision and reinforce the wider staff structure.",
        escalationDelta: -11,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 4 }
        ],
              consequenceHints: [
          "Staff trust rises",
          "Pay precedent is narrowed",
          "No wider compensation review",
        ],
      },
      {
        id: "open_staff_reward_review",
        label: "Open a wider reward review",
        description:
          "Reduce resentment by reviewing staff rewards, at the cost of giving the staff bloc more bargaining leverage.",
        escalationDelta: -14,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 5 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "loyalty", delta: 4 }
        ],
              consequenceHints: [
          "Staff loyalty rises",
          "Staff leverage rises",
          "Wider pay expectations increase",
        ],
      }
    ,
      {
        id: "freeze_wider_pay_comparisons",
        label: "Freeze wider pay comparisons",
        description:
          "Treat the renewal as unrelated to staff compensation and refuse to reopen the wider reward structure.",
        escalationDelta: 6,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "resentment", delta: 6 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 1 }
        ],
        consequenceHints: ["Hartmann holds the cost line", "Staff resentment rises", "No additional staff bargaining power"],
      }
    ],
  }
];
