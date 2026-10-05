import type { RoundEventDefinition } from "@/game/season/round-events";

export const demoRoundEvents: RoundEventDefinition[] = [
  {
    id: "event_keller_breakthrough",
    type: "RACE_RESULT",
    title: "Keller gelingt der Durchbruch",
    summary:
      "Keller schlägt Moretti aus eigener Stärke. Sein Selbstvertrauen wächst und die Frage nach Gleichbehandlung lässt sich immer schwerer ignorieren.",
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
    title: "Morettis Form lässt nach",
    summary:
      "Eine Serie schwächerer Wochenenden bremst Morettis sportliche Dynamik und erhöht den Druck rund um seinen bevorzugten Status.",
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
    title: "Großes Upgrade scheitert",
    summary:
      "Ein viel beachtetes Technikpaket bleibt hinter den Erwartungen. Chen gerät intern unter Druck, während Moretti die technische Richtung immer offener kritisiert.",
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
    title: "Moretti erhöht den Mediendruck",
    summary:
      "Moretti stellt öffentlich infrage, ob das Team vollständig hinter ihm steht. Der Sponsorendruck wächst und Hartmanns Handlungsspielraum wird kleiner.",
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
    title: "Moretti verschärft die Vertragsgespräche",
    summary:
      "Morettis Umfeld signalisiert, dass sportliche Garantien ebenso wichtig werden wie das Gehalt. Die Wechselandrohung wird glaubwürdig genug für einen formellen Vertragskonflikt.",
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
    title: "Varga stellt Eingriffe in die Rennleitung infrage",
    summary:
      "Elena Varga warnt, dass wiederholte spontane Eingriffe von oben die sportliche Befehlskette untergraben.",
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
    title: "Laurent verlangt eine Überprüfung der Führungsstruktur",
    summary:
      "Sophie Laurent fordert klarere Verantwortlichkeiten, nachdem mehrere öffentliche und sportliche Konflikte die Eigentümerebene erreichen.",
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
    title: "Salazar drängt auf eine Sponsor-Kampagne mit Moretti",
    summary:
      "Victor Salazar will Moretti für eine große kommerzielle Kampagne einsetzen, obwohl dessen politische Stellung im Team ungeklärt ist.",
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
    title: "Bellini fragt, wer das Rennteam schützt",
    summary:
      "Marco Bellini sagt, dass Ingenieure und Rennpersonal in Fahrer- und Führungspolitik hineingezogen werden, ohne klaren Schutz durch die Teamleitung.",
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
    title: "Moretti erreicht vier Siege, während Vanguard auf Rang vier abrutscht",
    summary: "Moretti erreicht vier Siege und Rang zwei in der Fahrerwertung, während Vanguard in der Teamwertung auf Rang vier abrutscht. Die Vertragszentrale berücksichtigt die durch diese Ergebnisse aktivierten Boni und Klauseln.",
    round: 22,
    effects: [],
    contractPerformance: [
      { characterId: "char_moretti", snapshot: {
        wins: 4, driverChampionshipPosition: 2, teamChampionshipPosition: 4,
      } },
    ],
  }
];
