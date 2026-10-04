"use client";

import {
  getFinanceSummary,
  getOwnerFundingBlockReason,
  isFinanceIncome,
  OWNER_FUNDING_MILLIONS,
} from "@/game/finance/finances";
import type { PoliticalCoreState } from "@/game/political/types";

type Props = {
  state: PoliticalCoreState;
  round: number;
  onAction: (action: "OWNER_FUNDING" | "CUT_OPERATING_COSTS") => void;
};

function money(value: number) {
  return `€${value.toFixed(2)}m`;
}

export function FinancePanel({ state, round, onAction }: Props) {
  const finance = state.finance;
  const summary = getFinanceSummary(state, round);
  const ownerFundingReason = getOwnerFundingBlockReason(state);
  const transactions = [...finance.transactions].reverse().sort((a, b) => b.round - a.round);
  const income = finance.transactions.filter(isFinanceIncome).reduce((sum, item) => sum + item.amountMillions, 0);
  const expenses = finance.transactions.filter((item) => !isFinanceIncome(item)).reduce((sum, item) => sum + item.amountMillions, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Cash balance", money(summary.cashBalance)],
          ["Next round cash forecast", money(summary.projectedNextRoundCash)],
          ["Annual payroll / budget", `${money(summary.payroll)} / ${money(finance.payrollBudgetMillionsPerSeason)}`],
          ["Contract commitments", money(summary.commitments)],
        ].map(([title, value]) => (
          <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{title}</p>
            <p className="mt-3 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      {summary.cashBalance < 8 || summary.projectedNextRoundCash < 0 ? (
        <p className="rounded-xl border border-amber-900 bg-amber-950/20 p-4 text-sm text-amber-200">
          {summary.cashBalance < 0
            ? "The team has a cash deficit. Existing contractual payments continue; new deals must pass the budget check."
            : "Cash reserves are running low. Review upcoming payments before committing to a new deal."}
        </p>
      ) : null}

      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-lg font-semibold">Round cash flow</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Sponsor income", finance.sponsorIncomeMillionsPerRound],
            ["Owner contribution", finance.ownerIncomeMillionsPerRound],
            ["Operating costs", finance.operatingCostMillionsPerRound],
            ["Next round salaries", summary.nextSalary],
            ["Guarantees due next round", summary.nextGuarantees],
            ["Recurring net per round", summary.netPerRound],
          ].map(([title, value]) => (
            <div key={String(title)}>
              <dt className="text-zinc-500">{title}</dt>
              <dd className="mt-1 text-zinc-200">{money(Number(value))}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Salaries are paid over {finance.roundsPerSeason} rounds per season. Bonuses are paid when triggered.
          Remaining guaranteed pay is settled when a contract expires. Potential unpaid bonuses: {money(summary.possibleBonuses)}.
          Approved commitment limit: {money(finance.commitmentBudgetMillions)}.
        </p>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 p-5">
          <h3 className="font-semibold">Request emergency owner funding</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Receive {money(OWNER_FUNDING_MILLIONS)} once when cash falls below €8m.
            Your reputation falls by 8, owner trust in you by 10, and the owner gains 5 influence.
          </p>
          <button type="button" onClick={() => onAction("OWNER_FUNDING")} disabled={ownerFundingReason !== null}
            className="mt-4 rounded-lg border border-amber-800 px-4 py-2 text-sm text-amber-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600">
            Request owner funding
          </button>
          {ownerFundingReason ? <p className="mt-2 text-xs text-zinc-500">{ownerFundingReason}</p> : null}
        </article>
        <article className="rounded-2xl border border-zinc-800 p-5">
          <h3 className="font-semibold">Cut operating costs</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Reduce future operating costs by 20% to {money(finance.operatingCostMillionsPerRound * (finance.costCutsApplied ? 1 : 0.8))} per round.
            Technical leadership and race engineers gain 8 instability and 8 political fatigue.
          </p>
          <button type="button" onClick={() => onAction("CUT_OPERATING_COSTS")} disabled={finance.costCutsApplied || finance.operatingCostMillionsPerRound === 0}
            className="mt-4 rounded-lg border border-sky-800 px-4 py-2 text-sm text-sky-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600">
            {finance.costCutsApplied ? "Cost cuts applied" : "Apply operating cost cuts"}
          </button>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-lg font-semibold">Account ledger</h3>
        <p className="mt-2 text-xs text-zinc-500">
          Opening cash {money(finance.openingBalanceMillions)} after round {finance.openedAfterRound}
          {" · "}Income {money(income)} · Expenses {money(expenses)} · Settled through R{finance.settledThroughRound}
        </p>
        {transactions.length === 0 ? <p className="mt-4 text-sm text-zinc-500">The next round will book the first payments.</p> : (
          <div className="mt-4 max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500"><tr><th className="p-2">Round</th><th className="p-2">Booking</th><th className="p-2 text-right">Amount</th></tr></thead>
              <tbody>{transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-zinc-800">
                  <td className="p-2 text-zinc-500">{transaction.round}</td>
                  <td className="p-2 text-zinc-300">{transaction.description}</td>
                  <td className={`whitespace-nowrap p-2 text-right ${isFinanceIncome(transaction) ? "text-emerald-300" : "text-amber-300"}`}>
                    {isFinanceIncome(transaction) ? "+" : "−"}{money(transaction.amountMillions)}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
