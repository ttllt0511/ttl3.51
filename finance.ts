
import { Expense, Currency, LocationCategory } from '../types';
import { MOCK_RATES } from '../constants';

interface SettlementRecord {
  twd: number;
  jpy: number;
}

export const getFriendList = (expenses: Expense[]): string[] => {
  const people = new Set<string>(['我', '小明', '阿華']);
  expenses.forEach(e => {
    if (e.payer) people.add(e.payer);
    if (e.splitWith && Array.isArray(e.splitWith)) {
      e.splitWith.forEach(p => people.add(p));
    }
  });
  return Array.from(people);
};

export const calculateTotals = (expenses: Expense[]): Record<string, number> => {
  return expenses.reduce((acc, curr) => {
    acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);
};

export const calculateSettlement = (expenses: Expense[], friends: string[]): Record<string, SettlementRecord> => {
  const balances: Record<string, SettlementRecord> = {};
  friends.forEach(f => {
    balances[f] = { twd: 0, jpy: 0 };
  });

  expenses.forEach(exp => {
    const isTWD = exp.currency === Currency.TWD;
    const amount = exp.amount;
    
    // Payer gets positive balance (owed money)
    if (!balances[exp.payer]) balances[exp.payer] = { twd: 0, jpy: 0 };
    if (isTWD) balances[exp.payer].twd += amount;
    else balances[exp.payer].jpy += amount;
    
    // Participants get negative balance (owe money)
    const participants = exp.splitWith.length > 0 ? exp.splitWith : [exp.payer];
    const perPersonAmount = amount / participants.length;
    
    participants.forEach(p => {
      if (!balances[p]) balances[p] = { twd: 0, jpy: 0 };
      if (isTWD) balances[p].twd -= perPersonAmount;
      else balances[p].jpy -= perPersonAmount;
    });
  });
  return balances;
};

export const prepareChartData = (expenses: Expense[]) => {
  const categoryGroups: Record<string, number> = {};
  
  expenses.forEach(exp => {
    const cat = exp.category || LocationCategory.OTHER;
    // Normalize to TWD for chart proportions ONLY
    const val = exp.currency === Currency.TWD ? exp.amount : exp.amount * MOCK_RATES[Currency.JPY]; 
    categoryGroups[cat] = (categoryGroups[cat] || 0) + val;
  });

  return Object.entries(categoryGroups).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);
};
