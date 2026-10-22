// All amounts are gross, before investor taxes and trading/conversion costs.
export function incomeScenario(fund, budget) {
  if (!(budget > 0)) throw new Error('A positive investment budget is required');
  if (fund.method === 'shares') {
    if (!(fund.price > 0 && fund.payment > 0)) throw new Error('Invalid price or payment');
    const shares = Math.floor(budget / fund.price);
    const monthly = shares * fund.payment;
    return { shares, invested: shares * fund.price, remainder: budget - shares * fund.price, monthly, annual: monthly * 12, quarterly: monthly * 3 };
  }
  if (!(fund.annualBps > 0)) throw new Error('Invalid distribution rate');
  const annual = budget * fund.annualBps / 10000;
  return { monthly: annual / 12, annual, quarterly: annual / 4 };
}

export function capitalForIncome(fund, monthlyTarget) {
  if (!(monthlyTarget > 0)) throw new Error('A positive income target is required');
  if (fund.method === 'shares') return Math.ceil(monthlyTarget / fund.payment) * fund.price;
  return Math.ceil(monthlyTarget * 120000 / fund.annualBps);
}
