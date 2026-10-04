import { describe, expect, it } from "vitest";
import { demoState } from "../../src/game/data/demo-state";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { advanceContractsForRound, evaluateContractPerformance, exerciseContractOption } from "../../src/game/contracts/contracts";
import { acceptNegotiationCounter, startContractNegotiation, submitNegotiationOffer } from "../../src/game/contracts/negotiations";
import {
  assessContractBudget, cutOperatingCosts, getCashBalance, getFinanceSummary,
  requestOwnerFunding, settleTeamFinancesThroughRound,
} from "../../src/game/finance/finances";
import { createTeamFinance } from "../../src/game/finance/defaults";
import { advanceRoundFlow, createRoundFlowState, takeRoundFinanceAction } from "../../src/game/season/round-flow";
import { validatePoliticalCoreState } from "../../src/game/political/validation";

describe("team finances", () => {
  it("books income, costs and salaries once with a reconcilable cash balance", () => {
    const original = structuredClone(demoState);
    const settled = settleTeamFinancesThroughRound(demoState, 16);
    expect(demoState).toEqual(original);
    expect(settled.finance.transactions).toHaveLength(7);
    expect(settled.finance.transactions.filter((item) => item.category === "SALARY")).toHaveLength(4);
    expect(getCashBalance(settled)).toBe(16.4375);
    expect(settled.contracts[0].salaryPaidMillions).toBe(21.333333);
    expect(settleTeamFinancesThroughRound(settled, 16)).toEqual(settled);
    expect(() => settleTeamFinancesThroughRound(settled, 15)).toThrow(/backwards/);
  });

  it("settles skipped rounds while respecting contract start and end dates", () => {
    const state = structuredClone(demoState);
    state.contracts = [state.contracts[0]];
    state.contracts[0].startRound = 17;
    state.contracts[0].endRound = 18;
    state.contracts[0].guaranteedSalaryMillions = 0;
    state.contracts[0].salaryPaidMillions = 0;
    const result = settleTeamFinancesThroughRound(state, 19);
    expect(result.finance.transactions.filter((item) => item.category === "SALARY").map((item) => item.round))
      .toEqual([17, 18]);
    expect(result.finance.transactions.filter((item) => item.category === "SPONSOR_INCOME")).toHaveLength(4);
    expect(result.finance.settledThroughRound).toBe(19);
  });

  it("charges a performance bonus immediately and does not charge it twice", () => {
    const first = evaluateContractPerformance(demoState, "contract_moretti_2026", { wins: 4 }, 22);
    expect(getCashBalance(first.nextState)).toBe(15.5);
    const repeated = evaluateContractPerformance(first.nextState, "contract_moretti_2026", { wins: 5 }, 23);
    expect(repeated.nextState.finance.transactions.filter((item) => item.category === "PERFORMANCE_BONUS")).toHaveLength(1);
    expect(getCashBalance(repeated.nextState)).toBe(15.5);
    const flow = advanceRoundFlow(createRoundFlowState(demoState, demoRoundEvents, 15), demoRoundEvents);
    expect(getCashBalance(flow.political)).toBe(15.2375);
  });

  it("pays the outstanding guaranteed minimum once at expiry", () => {
    const state = structuredClone(demoState);
    state.contracts[0].endRound = 16;
    state.contracts[0].guaranteedSalaryMillions = 25;
    const result = advanceContractsForRound(state, 17);
    const payments = result.finance.transactions.filter((item) => item.category === "GUARANTEE_SETTLEMENT");
    expect(payments).toHaveLength(1);
    expect(payments[0].amountMillions).toBe(3.666667);
    expect(result.contracts[0].salaryPaidMillions).toBe(25);
    expect(result.contracts[0].status).toBe("EXPIRED");
    const next = advanceContractsForRound(result, 18);
    expect(next.finance.transactions.filter((item) => item.category === "GUARANTEE_SETTLEMENT")).toHaveLength(1);
  });

  it("settles old salary terms before a renewal changes future payments", () => {
    const session = startContractNegotiation(demoState, "contract_moretti_2026", 16);
    const offer = { salaryMillionsPerSeason: 40, guaranteedSalaryMillions: 70,
      extensionRounds: 24, releaseClauseMillions: null, performanceBonusMillions: 2 };
    const accepted = acceptNegotiationCounter(demoState, { ...session, status: "COUNTERED", counterOffer: offer }, 16);
    const next = settleTeamFinancesThroughRound(accepted.political, 17);
    const salaries = next.finance.transactions.filter((item) => item.category === "SALARY" && item.contractId === "contract_moretti_2026");
    expect(salaries.map((item) => item.amountMillions)).toEqual([1.333333, 1.666667]);
    expect(accepted.political.contracts[0].performanceTriggers.some((trigger) => trigger.amountMillions === 2 && trigger.metric === "WINS")).toBe(true);
    expect(getCashBalance(evaluateContractPerformance(next, "contract_moretti_2026", { wins: 4 }, 17).nextState))
      .toBeCloseTo(getCashBalance(next) - 4.5, 6);
  });

  it("honours unpaid guarantees on a terminated contract without continuing its salary", () => {
    const state = structuredClone(demoState);
    state.contracts[0].status = "TERMINATED";
    state.contracts[0].guaranteedSalaryMillions = 25;
    expect(getFinanceSummary(state, 15).nextGuarantees).toBe(5);
    const result = settleTeamFinancesThroughRound(state, 16);
    expect(result.finance.transactions.filter((item) => item.contractId === state.contracts[0].id).map((item) => item.category))
      .toEqual(["GUARANTEE_SETTLEMENT"]);
    expect(result.contracts[0].salaryPaidMillions).toBe(25);
  });

  it("blocks an over-budget team offer without changing cash or negotiation state", () => {
    const state = structuredClone(demoState);
    state.finance.payrollBudgetMillionsPerSeason = 49;
    const session = startContractNegotiation(state, "contract_moretti_2026", 16);
    const original = structuredClone(state);
    expect(() => submitNegotiationOffer(state, session, session.characterDemand, 16)).toThrow(/Annual payroll/);
    expect(state).toEqual(original);
    expect(session.status).toBe("OPEN");
    expect(() => acceptNegotiationCounter(state, { ...session, status: "COUNTERED", counterOffer: session.characterDemand }, 16))
      .toThrow(/Annual payroll/);
  });

  it("checks both guarantee exposure and next-round liquidity", () => {
    const state = structuredClone(demoState);
    const contract = state.contracts[0];
    const terms = { salaryMillionsPerSeason: 32, guaranteedSalaryMillions: 1000, endRound: 50 };
    expect(assessContractBudget(state, contract.id, terms, 16).reason).toMatch(/commitment budget/);
    state.finance.openingBalanceMillions = 0;
    state.finance.sponsorIncomeMillionsPerRound = 0;
    state.finance.ownerIncomeMillionsPerRound = 0;
    expect(assessContractBudget(state, contract.id, { ...terms, guaranteedSalaryMillions: 64 }, 16).reason)
      .toMatch(/insufficient cash/);
  });

  it("includes a revived contract in payroll when assessing an old counteroffer", () => {
    const state = structuredClone(demoState);
    state.contracts[0].status = "EXPIRED";
    const assessment = assessContractBudget(state, state.contracts[0].id, {
      salaryMillionsPerSeason: 100, guaranteedSalaryMillions: 64, endRound: 50,
    }, 27);
    expect(assessment.payroll).toBeGreaterThan(100);
    expect(assessment.reason).toMatch(/Annual payroll/);
  });

  it("blocks an unaffordable team option without exercising it", () => {
    const state = structuredClone(demoState);
    state.finance = createTeamFinance(22);
    state.finance.openingBalanceMillions = 0;
    state.finance.payrollBudgetMillionsPerSeason = 49;
    state.contracts[0].options[0].available = true;
    expect(() => exerciseContractOption(state, state.contracts[0].id, state.contracts[0].options[0].id, 23))
      .toThrow(/Annual payroll/);
    expect(state.contracts[0].options[0].exercised).toBe(false);
    expect(state.finance.transactions).toEqual([]);
  });

  it("keeps mandatory payments running when cash becomes negative", () => {
    const state = structuredClone(demoState);
    state.finance.openingBalanceMillions = 0;
    const next = settleTeamFinancesThroughRound(state, 16);
    expect(getCashBalance(next)).toBe(-1.5625);
    expect(next.contracts[0].salaryPaidMillions).toBeGreaterThan(state.contracts[0].salaryPaidMillions);
    expect(validatePoliticalCoreState(next).success).toBe(true);
  });

  it("grants owner funding once with persistent political costs", () => {
    const state = structuredClone(demoState);
    state.finance.openingBalanceMillions = 7;
    const original = structuredClone(state);
    const funded = requestOwnerFunding(state, 15);
    expect(getCashBalance(funded)).toBe(27);
    expect(state).toEqual(original);
    const principal = funded.characters.find((item) => item.role === "TEAM_PRINCIPAL")!;
    expect(principal.dynamic.institutionalReputation).toBe(state.characters.find((item) => item.id === principal.id)!.dynamic.institutionalReputation - 8);
    expect(funded.relationships.find((item) => item.id === "rel_laurent_hartmann")!.trust)
      .toBe(state.relationships.find((item) => item.id === "rel_laurent_hartmann")!.trust - 10);
    expect(() => requestOwnerFunding(funded, 16)).toThrow(/already been used/);
    expect(() => requestOwnerFunding(demoState, 15)).toThrow(/below €8m/);
  });

  it("cuts future costs once and affects staff politics", () => {
    const initial = advanceRoundFlow(createRoundFlowState(demoState, demoRoundEvents, 15), demoRoundEvents);
    const result = takeRoundFinanceAction(initial, "CUT_OPERATING_COSTS");
    expect(result.political.finance.transactions).toEqual(initial.political.finance.transactions);
    expect(result.political.finance.operatingCostMillionsPerRound).toBe(1.84);
    const chen = result.political.characters.find((item) => item.role === "TECHNICAL_DIRECTOR")!;
    expect(chen.dynamic.politicalFatigue).toBe(initial.political.characters.find((item) => item.id === chen.id)!.dynamic.politicalFatigue + 8);
    const next = settleTeamFinancesThroughRound(result.political, 17);
    expect(next.finance.transactions.find((item) => item.category === "OPERATING_COST" && item.round === 17)!.amountMillions).toBe(1.84);
    expect(getFinanceSummary(result.political, 16).netPerRound).toBe(-1.1025);
    expect(() => cutOperatingCosts(result.political)).toThrow(/already been applied/);
  });

  it("rejects broken finance records at the validation boundary", () => {
    const state = settleTeamFinancesThroughRound(demoState, 16);
    const duplicate = structuredClone(state);
    duplicate.finance.transactions.push(duplicate.finance.transactions[0]);
    expect(validatePoliticalCoreState(duplicate).success).toBe(false);
    const unknown = structuredClone(state);
    unknown.finance.transactions.find((item) => item.category === "SALARY")!.contractId = "contract_unknown";
    expect(validatePoliticalCoreState(unknown).success).toBe(false);
    const invalid = structuredClone(state);
    invalid.finance.transactions[0].amountMillions = Infinity;
    expect(validatePoliticalCoreState(invalid).success).toBe(false);
    const unpaid = structuredClone(state);
    unpaid.contracts[0].salaryPaidMillions = 0;
    expect(validatePoliticalCoreState(unpaid).success).toBe(false);
  });
});
