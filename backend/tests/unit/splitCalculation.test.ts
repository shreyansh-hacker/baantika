import { calculateSplits } from '../../src/modules/expenses/service';
import { ValidationError } from '../../src/lib/errors';

describe('Expense Split Calculation Engine', () => {
  describe('EQUAL Split', () => {
    it('splits ₹1,000 (100000 paise) equally among 3 people with deterministic remainder distribution', () => {
      // 100,000 / 3 = 33,333 base + 1 remainder paise
      // Sorted userIds: u1, u2, u3
      const splits = calculateSplits(100000, 'EQUAL', [
        { userId: 'u3' },
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      expect(splits).toHaveLength(3);
      // u1 gets 33334, u2 gets 33333, u3 gets 33333
      expect(splits.find((s) => s.userId === 'u1')?.amountPaise).toBe(33334);
      expect(splits.find((s) => s.userId === 'u2')?.amountPaise).toBe(33333);
      expect(splits.find((s) => s.userId === 'u3')?.amountPaise).toBe(33333);

      // Invariant: sum of shares must equal total paise exactly
      const sum = splits.reduce((acc, s) => acc + s.amountPaise, 0);
      expect(sum).toBe(100000);
    });

    it('splits ₹100 (10000 paise) equally among 2 people without remainder', () => {
      const splits = calculateSplits(10000, 'EQUAL', [
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      expect(splits.find((s) => s.userId === 'u1')?.amountPaise).toBe(5000);
      expect(splits.find((s) => s.userId === 'u2')?.amountPaise).toBe(5000);
      expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(10000);
    });

    it('splits ₹10 (1000 paise) equally among 7 people with remainder 6', () => {
      // 1000 / 7 = 142 base, remainder = 6
      // First 6 get 143, 7th gets 142
      const participants = Array.from({ length: 7 }, (_, i) => ({ userId: `user-${i + 1}` }));
      const splits = calculateSplits(1000, 'EQUAL', participants);

      const sum = splits.reduce((acc, s) => acc + s.amountPaise, 0);
      expect(sum).toBe(1000);

      const count143 = splits.filter((s) => s.amountPaise === 143).length;
      const count142 = splits.filter((s) => s.amountPaise === 142).length;
      expect(count143).toBe(6);
      expect(count142).toBe(1);
    });

    it('handles single participant equal split', () => {
      const splits = calculateSplits(5000, 'EQUAL', [{ userId: 'solo-user' }]);
      expect(splits[0].amountPaise).toBe(5000);
    });
  });

  describe('EXACT Split', () => {
    it('accepts exact splits that match total amount exactly', () => {
      const splits = calculateSplits(15000, 'EXACT', [
        { userId: 'u1', amountPaise: 7500 },
        { userId: 'u2', amountPaise: 5000 },
        { userId: 'u3', amountPaise: 2500 },
      ]);

      expect(splits).toHaveLength(3);
      expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(15000);
    });

    it('rejects exact splits when sum does not equal total amount', () => {
      expect(() =>
        calculateSplits(15000, 'EXACT', [
          { userId: 'u1', amountPaise: 7000 },
          { userId: 'u2', amountPaise: 5000 },
          { userId: 'u3', amountPaise: 2000 }, // sum = 14000 != 15000
        ])
      ).toThrow(ValidationError);
    });

    it('rejects exact split with non-positive or missing amount', () => {
      expect(() =>
        calculateSplits(10000, 'EXACT', [
          { userId: 'u1', amountPaise: 10000 },
          { userId: 'u2', amountPaise: 0 },
        ])
      ).toThrow(ValidationError);
    });
  });

  describe('PERCENTAGE Split', () => {
    it('calculates standard percentages accurately', () => {
      const splits = calculateSplits(100000, 'PERCENTAGE', [
        { userId: 'u1', percentage: 50 },
        { userId: 'u2', percentage: 30 },
        { userId: 'u3', percentage: 20 },
      ]);

      expect(splits.find((s) => s.userId === 'u1')?.amountPaise).toBe(50000);
      expect(splits.find((s) => s.userId === 'u2')?.amountPaise).toBe(30000);
      expect(splits.find((s) => s.userId === 'u3')?.amountPaise).toBe(20000);
      expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(100000);
    });

    it('handles 33.33% / 33.33% / 33.34% with largest-remainder allocation', () => {
      const splits = calculateSplits(10000, 'PERCENTAGE', [
        { userId: 'u1', percentage: 33.33 },
        { userId: 'u2', percentage: 33.33 },
        { userId: 'u3', percentage: 33.34 },
      ]);

      const sum = splits.reduce((acc, s) => acc + s.amountPaise, 0);
      expect(sum).toBe(10000);
      expect(splits.find((s) => s.userId === 'u3')?.amountPaise).toBe(3334);
    });

    it('rejects percentages that do not sum to 100%', () => {
      expect(() =>
        calculateSplits(10000, 'PERCENTAGE', [
          { userId: 'u1', percentage: 40 },
          { userId: 'u2', percentage: 40 }, // total = 80% != 100%
        ])
      ).toThrow(ValidationError);
    });
  });

  describe('SHARES Split', () => {
    it('calculates weighted shares accurately', () => {
      // 1 : 2 : 3 on ₹600 (60000 paise)
      // Total shares = 6. u1=10000, u2=20000, u3=30000
      const splits = calculateSplits(60000, 'SHARES', [
        { userId: 'u1', shares: 1 },
        { userId: 'u2', shares: 2 },
        { userId: 'u3', shares: 3 },
      ]);

      expect(splits.find((s) => s.userId === 'u1')?.amountPaise).toBe(10000);
      expect(splits.find((s) => s.userId === 'u2')?.amountPaise).toBe(20000);
      expect(splits.find((s) => s.userId === 'u3')?.amountPaise).toBe(30000);
      expect(splits.reduce((acc, s) => acc + s.amountPaise, 0)).toBe(60000);
    });

    it('distributes remainder paise correctly when shares have fractions', () => {
      // 1 : 1 : 1 on 1000 paise -> 334, 333, 333
      const splits = calculateSplits(1000, 'SHARES', [
        { userId: 'u1', shares: 1 },
        { userId: 'u2', shares: 1 },
        { userId: 'u3', shares: 1 },
      ]);

      const sum = splits.reduce((acc, s) => acc + s.amountPaise, 0);
      expect(sum).toBe(1000);
    });

    it('rejects zero or negative shares', () => {
      expect(() =>
        calculateSplits(1000, 'SHARES', [
          { userId: 'u1', shares: 0 },
          { userId: 'u2', shares: 1 },
        ])
      ).toThrow(ValidationError);
    });
  });

  describe('Validation Edge Cases', () => {
    it('rejects empty participant list', () => {
      expect(() => calculateSplits(1000, 'EQUAL', [])).toThrow(ValidationError);
    });

    it('rejects duplicate participant user IDs', () => {
      expect(() =>
        calculateSplits(1000, 'EQUAL', [{ userId: 'u1' }, { userId: 'u1' }])
      ).toThrow(ValidationError);
    });
  });
});
