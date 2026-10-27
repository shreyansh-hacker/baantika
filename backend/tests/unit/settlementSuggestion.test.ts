import { computeSettlementSuggestions } from '../../src/modules/balances/service';

describe('Settlement Suggestion Algorithm (Greedy Minimum Transfers)', () => {
  it('returns empty list when all balances are zero', () => {
    const balances = [
      { userId: 'u1', displayName: 'Aarav', netBalancePaise: 0 },
      { userId: 'u2', displayName: 'Diya', netBalancePaise: 0 },
    ];
    const suggestions = computeSettlementSuggestions(balances);
    expect(suggestions).toHaveLength(0);
  });

  it('computes 1 transfer for a 2-person group', () => {
    // u1 paid for u2: u1 is +5000, u2 is -5000
    const balances = [
      { userId: 'u1', displayName: 'Aarav', netBalancePaise: 5000 },
      { userId: 'u2', displayName: 'Diya', netBalancePaise: -5000 },
    ];
    const suggestions = computeSettlementSuggestions(balances);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toEqual({
      fromUserId: 'u2',
      fromDisplayName: 'Diya',
      toUserId: 'u1',
      toDisplayName: 'Aarav',
      amountPaise: 5000,
    });
  });

  it('computes 2 transfers for a 3-person group where one person paid for all', () => {
    // u1 paid ₹900 (90000 paise) split equally
    // u1 is +60000, u2 is -30000, u3 is -30000
    const balances = [
      { userId: 'u1', displayName: 'Aarav', netBalancePaise: 60000 },
      { userId: 'u2', displayName: 'Diya', netBalancePaise: -30000 },
      { userId: 'u3', displayName: 'Kabir', netBalancePaise: -30000 },
    ];
    const suggestions = computeSettlementSuggestions(balances);

    expect(suggestions).toHaveLength(2);
    // Both transfers must go to u1
    expect(suggestions.every((s) => s.toUserId === 'u1')).toBe(true);

    const totalTransferred = suggestions.reduce((acc, s) => acc + s.amountPaise, 0);
    expect(totalTransferred).toBe(60000);
  });

  it('correctly resolves complex multi-creditor and multi-debtor group', () => {
    // u1: +40000, u2: +20000, u3: -30000, u4: -30000
    // Sum = +60000 - 60000 = 0
    const balances = [
      { userId: 'u1', displayName: 'Aarav', netBalancePaise: 40000 },
      { userId: 'u2', displayName: 'Diya', netBalancePaise: 20000 },
      { userId: 'u3', displayName: 'Kabir', netBalancePaise: -30000 },
      { userId: 'u4', displayName: 'Ananya', netBalancePaise: -30000 },
    ];
    const suggestions = computeSettlementSuggestions(balances);

    // Sum of suggested transfers must equal sum of positive balances
    const totalTransferred = suggestions.reduce((acc, s) => acc + s.amountPaise, 0);
    expect(totalTransferred).toBe(60000);

    // Check each debtor pays their full debt
    const debtPaidByU3 = suggestions
      .filter((s) => s.fromUserId === 'u3')
      .reduce((acc, s) => acc + s.amountPaise, 0);
    expect(debtPaidByU3).toBe(30000);

    const debtPaidByU4 = suggestions
      .filter((s) => s.fromUserId === 'u4')
      .reduce((acc, s) => acc + s.amountPaise, 0);
    expect(debtPaidByU4).toBe(30000);

    // Check each creditor receives their full credit
    const creditReceivedByU1 = suggestions
      .filter((s) => s.toUserId === 'u1')
      .reduce((acc, s) => acc + s.amountPaise, 0);
    expect(creditReceivedByU1).toBe(40000);

    const creditReceivedByU2 = suggestions
      .filter((s) => s.toUserId === 'u2')
      .reduce((acc, s) => acc + s.amountPaise, 0);
    expect(creditReceivedByU2).toBe(20000);
  });
});
