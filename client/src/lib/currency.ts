export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
