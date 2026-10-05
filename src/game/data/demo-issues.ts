import type { IssueDefinition } from "@/game/issues/issues";

export const demoIssueDefinitions: IssueDefinition[] = [
  {
    id: "issue_upgrade_fallout",
    sourceEventId: "event_upgrade_failure",
    title: "Technische Folgen nach dem gescheiterten Upgrade",
    summary:
      "Chen steht unter Druck und Moretti zeigt offen seine Unzufriedenheit. Du kannst den Konflikt eindämmen, bevor daraus ein weiterer Machtkampf wird.",
    category: "TECHNICAL",
    initiatorCharacterId: "char_moretti",
    baseEscalation: 42,
    escalationThreshold: 72,
    actions: [
      {
        id: "back_technical_process",
        label: "Den technischen Prozess stützen",
        description:
          "Schütze Chens Autorität öffentlich und erkenne gleichzeitig das gescheiterte Paket an.",
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
        label: "Interne Technikbesprechung ansetzen",
        description:
          "Höre Moretti an, ohne Chens letzte Entscheidungsgewalt anzutasten.",
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
        label: "Technikabteilung entscheiden lassen",
        description:
          "Greife politisch nicht ein und hoffe, dass die Frustration mit dem nächsten Ergebnis nachlässt.",
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
    title: "Moretti greift das Team öffentlich an",
    summary:
      "Die Geschichte verbreitet sich im Paddock. Eine besonnene Reaktion kann sie eindämmen; Schweigen könnte Moretti die Deutungshoheit überlassen.",
    category: "MEDIA",
    initiatorCharacterId: "char_moretti",
    baseEscalation: 55,
    escalationThreshold: 70,
    actions: [
      {
        id: "private_media_meeting",
        label: "Moretti zu einem vertraulichen Gespräch bitten",
        description:
          "Biete ein direktes Gespräch an und fordere ihn auf, den Konflikt nicht weiter über die Medien zu verschärfen.",
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
        label: "Kritik öffentlich zurückweisen",
        description:
          "Verteidige das Team öffentlich und widersprich Morettis Darstellung.",
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
        label: "Nicht reagieren",
        description:
          "Vermeide zusätzliche Aufmerksamkeit, gib Morettis Umfeld damit aber Raum, die Darstellung zu bestimmen.",
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
    title: "Moretti knüpft seinen Vertrag an sportliche Garantien",
    summary:
      "Die Verlängerung ist nicht mehr nur eine finanzielle Frage. Moretti fordert sportliche Zusagen und seine Wechselposition ist glaubwürdig.",
    category: "CONTRACT",
    initiatorCharacterId: "char_moretti",
    baseEscalation: 60,
    escalationThreshold: 74,
    actions: [
      {
        id: "structured_contract_talks",
        label: "Strukturierte Verhandlungen eröffnen",
        description:
          "Besprich sportliche Erwartungen, ohne dauerhaft eine Nummer-eins-Garantie zu geben.",
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
        label: "Begrenzte sportliche Garantien anbieten",
        description:
          "Senke die Vertragsspannung, stärkst damit aber Morettis politische Position.",
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
        label: "Verhandlungen unter Druck ablehnen",
        description:
          "Schütze die Autorität des Teams und zwinge Morettis Umfeld zu zeigen, ob die Drohung ernst gemeint ist.",
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
    title: "Wer kontrolliert die sportlichen Entscheidungen am Renntag?",
    summary:
      "Varga verlangt ein klares Mandat. Wiederholte Eingriffe können kurzfristig Ergebnisse schützen, schwächen aber die sportliche Befehlskette.",
    category: "SPORTING",
    initiatorCharacterId: "char_varga",
    baseEscalation: 48,
    escalationThreshold: 74,
    actions: [
      {
        id: "clarify_varga_mandate",
        label: "Vargas Mandat klarstellen",
        description:
          "Gib Varga klar definierte Autorität am Renntag, behalte aber eine Eskalation zum Teamchef für Notfälle bei.",
        escalationDelta: -14,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "trust", delta: 6 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_varga_sporting", delta: -3 }
        ],
      },
      {
        id: "keep_personal_sporting_control",
        label: "Persönliche Kontrolle behalten",
        description:
          "Behalte dir vor, die Strategie bei wichtigen Meisterschaftssituationen direkt zu überstimmen.",
        escalationDelta: 8,
        effects: [
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: 2 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "resentment", delta: 8 }
        ],
        followUpIssueDefinitionId: "issue_owner_governance_chain",
      },
      {
        id: "back_varga_publicly",
        label: "Varga öffentlich unterstützen",
        description:
          "Mache die Sportdirektorin sichtbar für den Rennbetrieb verantwortlich, auch für unpopuläre Entscheidungen.",
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
    title: "Eigentümerseite verlangt klarere Verantwortlichkeiten",
    summary:
      "Laurent will weniger Überraschungen im Vorstand. Die Frage ist, ob Kontrolle zu klarer Führung oder direkter Einmischung wird.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 52,
    escalationThreshold: 76,
    actions: [
      {
        id: "define_owner_boundaries",
        label: "Formale Grenzen für die Eigentümerseite festlegen",
        description:
          "Vereinbare Berichts- und Eskalationsregeln, ohne der Eigentümerseite operative Freigaberechte zu geben.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: -3 }
        ],
      },
      {
        id: "accept_owner_signoff",
        label: "Freigabe durch Eigentümer akzeptieren",
        description:
          "Lass Laurent größere sportliche und personelle Ausnahmen vor der Umsetzung genehmigen.",
        escalationDelta: -17,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "loyalty", delta: 6 },
          { type: "CHARACTER_MOMENTUM_DELTA", characterId: "char_hartmann", delta: -2 }
        ],
        followUpIssueDefinitionId: "issue_sporting_autonomy_chain",
      },
      {
        id: "resist_owner_intervention",
        label: "Operative Einmischung abwehren",
        description:
          "Schütze die Autorität des Teamchefs und akzeptiere dafür ein schwierigeres Verhältnis zum Vorstand.",
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
    title: "Sponsor will Moretti ins Zentrum der Kampagne stellen",
    summary:
      "Salazar sieht kommerziellen Wert in Morettis Starstatus. Eine Zusage könnte die sportlichen Erwartungen innerhalb des Teams verändern.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 50,
    escalationThreshold: 73,
    actions: [
      {
        id: "negotiate_sponsor_scope",
        label: "Umfang der Kampagne verhandeln",
        description:
          "Gib dem Sponsor Zugang zu Moretti, ohne kommerzielle Präsenz mit sportlichem Vorrang zu verknüpfen.",
        escalationDelta: -10,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_salazar_sponsor", delta: -4 }
        ],
      },
      {
        id: "make_moretti_campaign_face",
        label: "Moretti zum Gesicht der Kampagne machen",
        description:
          "Maximiere den Sponsorwert und akzeptiere, dass der Paddock dies als weiteres Zeichen für Sonderrechte des Starfahrers deutet.",
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
        label: "Sponsorendruck zurückweisen",
        description:
          "Halte sportlichen Status und kommerzielle Forderungen getrennt, auch wenn sich der Sponsor übergangen fühlt.",
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
    title: "Rennpersonal verlangt Schutz vor Paddock-Politik",
    summary:
      "Bellini warnt, dass Ingenieure zu politischen Stellvertretern werden. Deine Reaktion entscheidet, ob Loyalität künftig Strukturen oder Personen folgt.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 46,
    escalationThreshold: 72,
    actions: [
      {
        id: "protect_staff_boundary",
        label: "Grenzen für das Personal schützen",
        description:
          "Stelle gegenüber Fahrern und Management klar, dass Ingenieure nicht als politische Vermittler benutzt werden dürfen.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 6 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: -3 }
        ],
      },
      {
        id: "allow_driver_engineer_bloc",
        label: "Bellini weiter eng mit Moretti arbeiten lassen",
        description:
          "Erhalte die erfolgreiche Fahrer-Ingenieur-Beziehung, auch wenn dadurch ein informeller politischer Block entsteht.",
        escalationDelta: -7,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_moretti", metric: "loyalty", delta: 5 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_bellini_staff", delta: 4 }
        ],
        followUpIssueDefinitionId: "issue_chen_staff_authority_chain",
      },
      {
        id: "order_staff_neutrality",
        label: "Personal zur Neutralität verpflichten",
        description:
          "Nutze formale Autorität, um politische Beteiligung zu unterbinden, ohne die Ursachen der Unsicherheit zu lösen.",
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
    title: "Laurent hinterfragt Hartmanns Machtkonzentration",
    summary:
      "Vargas Beschwerde erreicht die Geschäftsführung. Laurent will wissen, ob zu viele operative Entscheidungen persönlich von Hartmann abhängen.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 44,
    escalationThreshold: 75,
    actions: [
      {
        id: "owner_governance_review",
        label: "Überprüfung der Führungsstruktur akzeptieren",
        description: "Formalisiere Entscheidungsrechte, bevor die Eigentümerseite eine eigene Struktur vorgibt.",
        escalationDelta: -11,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 4 }
        ],
      },
      {
        id: "centralize_under_ceo",
        label: "Ausnahmen bei der Geschäftsführung bündeln",
        description: "Tausche Autonomie gegen Vertrauen des Vorstands, indem wichtige Ausnahmen an Laurent eskaliert werden.",
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
    title: "Varga wehrt sich gegen Eigentümerfreigaben",
    summary:
      "Die Sportdirektorin argumentiert, dass Vorstandsfreigaben bei operativen Ausnahmen klare Verantwortung am Rennwochenende unmöglich machen.",
    category: "SPORTING",
    initiatorCharacterId: "char_varga",
    baseEscalation: 47,
    escalationThreshold: 74,
    actions: [
      {
        id: "protect_operational_autonomy",
        label: "Operative Autonomie schützen",
        description: "Behalte die Berichterstattung an die Eigentümerseite bei, gib die Renntag-Autorität aber an die sportliche Linie zurück.",
        escalationDelta: -12,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "resentment", delta: 3 }
        ],
      },
      {
        id: "keep_owner_override",
        label: "Eingriffsrecht des Eigentümers beibehalten",
        description: "Priorisiere Vertrauen in die Führungsstruktur gegenüber sportlicher Autonomie.",
        escalationDelta: 8,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_varga", toCharacterId: "char_hartmann", metric: "resentment", delta: 7 }
        ],
      }
    ],
  },
  {
    id: "issue_staff_star_treatment",
    title: "Personal sieht kommerzielle Sonderrechte als sportliche Sonderrechte",
    summary:
      "Bellini warnt, dass die Sponsor-Kampagne in der Garage als weiteres Signal verstanden wird, dass für Moretti andere Regeln gelten.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 43,
    escalationThreshold: 72,
    actions: [
      {
        id: "separate_commercial_and_sporting",
        label: "Kommerziellen und sportlichen Status trennen",
        description: "Halte Moretti kommerziell sichtbar, bekräftige aber ausdrücklich gleiche sportliche Regeln.",
        escalationDelta: -13,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 5 },
          { type: "GOAL_URGENCY_DELTA", goalId: "goal_keller_equal", delta: -4 }
        ],
      },
      {
        id: "accept_star_treatment",
        label: "Starbehandlung akzeptieren",
        description: "Behandle kommerzielle und sportliche Hierarchie als Teil derselben Starfahrer-Strategie.",
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
    title: "Laurent sorgt sich um das Vertrauen des Sponsors",
    summary:
      "Nachdem Hartmann den Sponsorendruck zurückweist, fragt Laurent, ob sich das Team ein Führungsprinzip leisten kann, das kommerzielle Risiken erzeugt.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 45,
    escalationThreshold: 75,
    actions: [
      {
        id: "back_hartmann_commercially",
        label: "Laurent um Rückendeckung bitten",
        description: "Lass die Eigentümerseite die Sponsorbeziehung auffangen, während Hartmann die sportliche Unabhängigkeit schützt.",
        escalationDelta: -9,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_laurent", toCharacterId: "char_hartmann", metric: "trust", delta: 3 },
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_laurent_owner", delta: 3 }
        ],
      },
      {
        id: "reopen_sponsor_concession",
        label: "Sponsorenzugeständnis erneut prüfen",
        description: "Reduziere das kommerzielle Risiko mit einem begrenzten Zugeständnis an Salazar.",
        escalationDelta: -13,
        effects: [
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_salazar", toCharacterId: "char_hartmann", metric: "resentment", delta: -5 }
        ],
      }
    ],
  },
  {
    id: "issue_chen_staff_authority_chain",
    title: "Chen stellt den Moretti-Bellini-Block infrage",
    summary:
      "Chen sieht in der Fahrer-Ingenieur-Beziehung eine alternative Machtstruktur innerhalb der Technikabteilung.",
    category: "TECHNICAL",
    initiatorCharacterId: "char_chen",
    baseEscalation: 51,
    escalationThreshold: 74,
    actions: [
      {
        id: "formalize_engineer_reporting",
        label: "Bellinis Berichtslinie formalisieren",
        description: "Schütze die Fahrerbeziehung, stelle aber die technische Verantwortung unter Chen klar.",
        escalationDelta: -12,
        effects: [
          { type: "LEVERAGE_STRENGTH_DELTA", leverageId: "lev_chen_technical", delta: 3 },
          { type: "RELATIONSHIP_DELTA", fromCharacterId: "char_bellini", toCharacterId: "char_hartmann", metric: "trust", delta: 2 }
        ],
      },
      {
        id: "protect_driver_engineer_independence",
        label: "Unabhängigkeit von Fahrer und Ingenieur schützen",
        description: "Halte Bellini eng bei Moretti, auch wenn Chen dies als Angriff auf seine technische Autorität versteht.",
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
    title: "Vertragsgespräche stecken fest",
    summary:
      "Die gescheiterte Verlängerung wird zu einem größeren Managementproblem. Die Eigentümerseite verlangt Klarheit, bevor sich die Unsicherheit im Paddock ausbreitet.",
    category: "CONTRACT",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 54,
    escalationThreshold: 76,
    actions: [
      {
        id: "reopen_contract_channel",
        label: "Gesprächskanal wieder öffnen",
        description:
          "Eröffne einen neuen Verhandlungsweg, ohne das finanzielle Paket sofort zu verbessern.",
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
        label: "Position halten",
        description:
          "Signalisiere, dass niemand das Team zu einem Vertrag zwingen kann, und akzeptiere ein höheres Abgangsrisiko.",
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
    title: "Eine neue Ausstiegsklausel verändert den Vertragsstandard",
    summary:
      "Die Verlängerung ist unterschrieben, aber die Eigentümerseite fürchtet, dass ein leichterer Ausstieg für Führungspersonen künftige Verhandlungen prägt.",
    category: "CONTRACT",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 40,
    escalationThreshold: 72,
    actions: [
      {
        id: "treat_release_as_exception",
        label: "Als einmalige Ausnahme festhalten",
        description:
          "Dokumentiere die Klausel als gezieltes Zugeständnis zur Bindung und nicht als neuen Teamstandard.",
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
        label: "Neuen Standard akzeptieren",
        description:
          "Nutze flexible Ausstiegsklauseln bewusst zur Bindung, auch wenn künftige Verhandlungen schwieriger werden.",
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
    title: "Eigentümerseite hinterfragt das Risiko, Schlüsselpersonal zu verlieren",
    summary:
      "Die harte Vertragslinie schützt Autorität, doch Laurent verlangt einen Plan für die sportlichen und kommerziellen Folgen eines möglichen Abgangs.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 46,
    escalationThreshold: 74,
    actions: [
      {
        id: "prepare_replacement_plan",
        label: "Nachfolgeplan vorbereiten",
        description:
          "Reduziere Abhängigkeit durch Alternativen, statt die Verhandlungsposition zu schwächen.",
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
        label: "Bessere Konditionen freigeben",
        description:
          "Gib Hartmann mehr finanziellen Spielraum für die nächste Verhandlungsrunde.",
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
    title: "Eigentümerseite verlangt einen Plan zur Personalbindung",
    summary:
      "Gescheiterte Vertragsgespräche zeigen das Risiko, eine Schlüsselfigur zu verlieren. Laurent verlangt einen Ersatz- und Nachfolgeplan, bevor sich die Unsicherheit ausbreitet.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 50,
    escalationThreshold: 75,
    actions: [
      {
        id: "build_retention_contingency",
        label: "Notfallplan erstellen",
        description:
          "Bereite Ersatzoptionen vor und beziffere die sportlichen Kosten eines Abgangs.",
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
        label: "Mehr Budget anfordern",
        description:
          "Öffne die finanzielle Obergrenze erneut und akzeptiere stärkere Einbindung der Eigentümerseite.",
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
        label: "Panik um Personalbindung zurückweisen",
        description:
          "Halte den Vorstand aus der Verhandlung heraus und bestehe darauf, dass das Team einen Abgang verkraften kann.",
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
    title: "Sponsorvertrauen sinkt nach gescheiterten Gesprächen",
    summary:
      "Salazar fürchtet, dass der Verlust einer prominenten Person künftige Kampagnen schwächt, und verlangt kommerzielle Sicherheit.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 48,
    escalationThreshold: 73,
    actions: [
      {
        id: "reassure_sponsor_continuity",
        label: "Kontinuität gegenüber dem Sponsor zusichern",
        description:
          "Sage einen alternativen Marketingplan zu, ohne einen besseren Vertrag zu versprechen.",
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
        label: "Sponsorendruck nutzen, um Gespräche neu zu öffnen",
        description:
          "Binde Salazar in die Bindungsbemühungen ein und gib kommerziellen Interessen damit mehr Einfluss auf die Verhandlung.",
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
        label: "Verträge und Sponsoring trennen",
        description:
          "Ziehe eine klare Grenze zwischen kommerziellem Wert und Vertragsverhandlungen.",
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
    title: "Personal deutet gescheiterte Gespräche als Instabilität",
    summary:
      "Bellini sagt, dass die Garage nun größere Personalveränderungen erwartet, und fordert Klarheit, bevor die Unsicherheit den Alltag beeinflusst.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 44,
    escalationThreshold: 71,
    actions: [
      {
        id: "brief_staff_on_continuity",
        label: "Personal informieren",
        description:
          "Erkläre den Nachfolgeplan und schütze die Garage vor Vertragsspekulationen.",
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
        label: "Details vertraulich halten",
        description:
          "Begrenze interne Informationen und akzeptiere, dass das Personal die Lücken selbst füllt.",
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
        label: "Personal an der Kontinuitätsplanung beteiligen",
        description:
          "Binde Bellini in die Nachfolgeplanung ein, damit die Garage im Übergang vertreten ist.",
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
    title: "Eigentümerseite unterstützt die Disziplin, hinterfragt aber das Risiko",
    summary:
      "Eine harte Verlängerung schützt Kostenkontrolle und Autorität, doch Laurent will wissen, ob Hartmann zu nah am Verlust einer Schlüsselfigur war.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 38,
    escalationThreshold: 70,
    actions: [
      {
        id: "defend_hard_contract_policy",
        label: "Harte Linie verteidigen",
        description:
          "Stelle den Vertrag als Beweis dar, dass das Team Talent halten kann, ohne finanzielle Disziplin aufzugeben.",
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
        label: "Eigentümerprüfung bei künftigen harten Angeboten einführen",
        description:
          "Behalte die Linie bei, gib Laurent aber früheren Einblick, wenn eine wichtige Verlängerung konfrontativ wird.",
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
        label: "Risikoberichte statt Vetorecht anbieten",
        description:
          "Gib Laurent frühere Informationen und Szenarioplanung, ohne formale Freigaberechte einzuräumen.",
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
    title: "Sponsor fürchtet Beziehungsschäden durch den harten Vertrag",
    summary:
      "Salazar hält die Verlängerung finanziell für diszipliniert, fürchtet aber, dass der Verhandlungston die Starbeziehung für künftige Kampagnen beschädigt hat.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 46,
    escalationThreshold: 72,
    actions: [
      {
        id: "separate_sponsor_relationship",
        label: "Kommerzielle Beziehung reparieren",
        description:
          "Versichere dem Sponsor direkt, dass ein harter Vertragsprozess kein geringeres kommerzielles Engagement bedeutet.",
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
        label: "Sponsor heraushalten",
        description:
          "Schütze die Vertragsautorität und akzeptiere eine kühlere kommerzielle Beziehung.",
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
        label: "Aktivierungszugang gegen Unterstützung tauschen",
        description:
          "Gib Salazar mehr kommerziellen Zugang, wenn er sich aus künftigen Vertragsverhandlungen heraushält.",
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
    title: "Personal erkennt eine härtere Vertragskultur",
    summary:
      "Bellini sagt, die harte Verlängerung sei im ganzen Team bemerkt worden und könne die Wahrnehmung von Sicherheit und Verhandlungsmacht verändern.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 42,
    escalationThreshold: 70,
    actions: [
      {
        id: "explain_contract_discipline",
        label: "Vorgehen erklären",
        description:
          "Stelle klar, dass die harte Linie aus der konkreten Verhandlungsmacht entstand und keinen allgemeinen Druck auf das Personal bedeutet.",
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
        label: "Härtere Kultur annehmen",
        description:
          "Signalisiere, dass künftige Verträge ebenfalls hart geführt werden, was Autorität stärkt, aber das Sicherheitsgefühl des Personals senkt.",
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
        label: "Vertragsleitlinien für Personal schaffen",
        description:
          "Lege Mindeststandards für künftige Personalverlängerungen fest, ohne bessere Konditionen zu versprechen.",
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
    title: "Eigentümerseite hinterfragt den Kostenstandard",
    summary:
      "Die großzügige Verlängerung sichert Kontinuität, doch Laurent fürchtet, dass das Paket die Erwartungen für alle Führungsverträge neu setzt.",
    category: "OWNER",
    initiatorCharacterId: "char_laurent",
    baseEscalation: 47,
    escalationThreshold: 73,
    actions: [
      {
        id: "ringfence_generous_deal",
        label: "Vertrag als Ausnahme abgrenzen",
        description:
          "Dokumentiere das Paket als außergewöhnliche Bindungsentscheidung und nicht als neuen Gehaltsmaßstab.",
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
        label: "Höhere Kosten zur Personalbindung akzeptieren",
        description:
          "Betrachte großzügige Verlängerungen als Preis für Stabilität und gib der Eigentümerseite damit mehr Grund, künftige Verträge zu überwachen.",
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
        label: "Künftige Großzügigkeit an Leistung koppeln",
        description:
          "Lass diesen Vertrag unverändert, verlange aber stärkere Leistungsbedingungen bei künftigen Premiumverlängerungen.",
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
    title: "Sponsor sieht Chance in der großzügigen Verlängerung",
    summary:
      "Salazar sieht den besseren Vertrag als Beleg langfristiger Bindung und will die verlängerte Person stärker an kommerzielle Aktivitäten knüpfen.",
    category: "SPONSOR",
    initiatorCharacterId: "char_salazar",
    baseEscalation: 36,
    escalationThreshold: 69,
    actions: [
      {
        id: "limit_sponsor_linkage",
        label: "Kommerzielle Verknüpfung begrenzen",
        description:
          "Nutze die Stabilität kommerziell, ohne Vertragsgroßzügigkeit in Sponsoreneinfluss auf den sportlichen Status umzuwandeln.",
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
        label: "Sponsorzugang ausweiten",
        description:
          "Nutze die neue Stabilität wirtschaftlich, indem Salazar mehr Zugang und Aktivierungsrechte erhält.",
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
        label: "Kampagnenrechte verkaufen, keinen Einfluss",
        description:
          "Biete mehr Inhalte und Auftritte, schließe Sponsoreneinfluss auf den sportlichen Status aber ausdrücklich aus.",
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
    title: "Personal hinterfragt die neue Gehaltshierarchie",
    summary:
      "Bellini sagt, die sichtbar großzügige Verlängerung habe in der Garage die Erwartungen daran verändert, wer wie stark wertgeschätzt wird.",
    category: "STAFF",
    initiatorCharacterId: "char_bellini",
    baseEscalation: 45,
    escalationThreshold: 71,
    actions: [
      {
        id: "explain_retention_value",
        label: "Bindungsentscheidung erklären",
        description:
          "Stelle das Paket als rollenspezifische Bindungsentscheidung dar und stärke die übrige Personalstruktur.",
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
        label: "Breitere Vergütungsprüfung eröffnen",
        description:
          "Senke Unmut durch eine Prüfung der Personalvergütung, gib dem Personalblock dadurch aber mehr Verhandlungsmacht.",
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
        label: "Breitere Gehaltsvergleiche blockieren",
        description:
          "Behandle die Verlängerung unabhängig von der Personalvergütung und lehne eine erneute Öffnung der Vergütungsstruktur ab.",
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
