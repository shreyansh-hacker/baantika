// Baantika — Indian Currency Formatting Utilities
// All amounts are stored and transferred in paise (integer)
// 1 INR = 100 paise

/**
 * Convert paise to rupees (for display only)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees to paise (for storage)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format paise as Indian rupee string with proper Indian numbering system.
 * Examples:
 *   formatCurrency(125000) → "₹1,250.00"
 *   formatCurrency(12345678) → "₹1,23,456.78"
 *   formatCurrency(-50000) → "-₹500.00"
 *   formatCurrency(0) → "₹0.00"
 */
export function formatCurrency(paise: number, options?: { compact?: boolean; showSign?: boolean }): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  // Use Indian locale formatting
  let formatted: string;
  if (options?.compact && absPaise >= 10000) {
    // Compact: no decimals for amounts >= ₹100
    formatted = formatIndianNumber(Math.round(rupees));
  } else {
    // Full precision with 2 decimal places
    const wholePart = Math.floor(rupees);
    const decimalPart = absPaise % 100;
    formatted = `${formatIndianNumber(wholePart)}.${String(decimalPart).padStart(2, '0')}`;
  }

  const sign = isNegative ? '-' : options?.showSign && paise > 0 ? '+' : '';
  return `${sign}₹${formatted}`;
}

/**
 * Format number using Indian numbering system (lakhs, crores)
 * 1234567 → "12,34,567"
 */
function formatIndianNumber(num: number): string {
  const str = String(num);
  if (str.length <= 3) {
    return str;
  }

  // Last 3 digits
  const lastThree = str.slice(-3);
  const remaining = str.slice(0, -3);

  // Add commas every 2 digits for the remaining part
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${formattedRemaining},${lastThree}`;
}

/**
 * Format a compact currency for summaries
 * formatCompactCurrency(125000) → "₹1,250"
 * formatCompactCurrency(-50000) → "-₹500"
 */
export function formatCompactCurrency(paise: number): string {
  return formatCurrency(paise, { compact: true });
}

/**
 * Format currency with explicit sign for balance display
 * formatBalanceCurrency(15000) → "+₹150.00"
 * formatBalanceCurrency(-15000) → "-₹150.00"
 * formatBalanceCurrency(0) → "₹0.00"
 */
export function formatBalanceCurrency(paise: number): string {
  return formatCurrency(paise, { showSign: true });
}

/**
 * Parse a rupee string input to paise
 * Handles "1250", "1,250", "1250.50", etc.
 * Returns null if invalid
 */
export function parseRupeesToPaise(input: string): number | null {
  // Remove ₹ symbol and commas
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (cleaned === '' || cleaned === '.') {
    return null;
  }

  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return null;
  }

  // Round to 2 decimal places and convert to paise
  return Math.round(num * 100);
}

/**
 * Validate if an amount in paise is valid for an expense
 */
export function isValidExpenseAmount(paise: number): boolean {
  return (
    Number.isInteger(paise) &&
    paise > 0 &&
    paise <= 1_000_000_00 // Max ₹10,00,000 (10 lakh)
  );
}
