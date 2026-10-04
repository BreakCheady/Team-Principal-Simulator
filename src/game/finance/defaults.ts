export function createTeamFinance(openedAfterRound = 0) {
  return {
    openedAfterRound,
    settledThroughRound: openedAfterRound,
    openingBalanceMillions: 18,
    sponsorIncomeMillionsPerRound: 2,
    ownerIncomeMillionsPerRound: 0.75,
    operatingCostMillionsPerRound: 2.3,
    roundsPerSeason: 24,
    payrollBudgetMillionsPerSeason: 70,
    commitmentBudgetMillions: 180,
    ownerFundingUsed: false,
    costCutsApplied: false,
    transactions: [],
  };
}
