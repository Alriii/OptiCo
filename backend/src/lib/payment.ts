export type PaymentLike = {
  amount: string | number;
  reversesPaymentId: string | null;
};

export type PaymentBalance = {
  fee: number;
  paid: number;
  balance: number;
  state: "unpaid" | "partial" | "paid" | "overpaid";
};

/**
 * Reversal rows are positive amounts that point at the payment they undo,
 * so the effective paid total subtracts them without mutating history.
 */
export function calculatePaymentBalance(fee: string | number, payments: PaymentLike[]): PaymentBalance {
  const feeAmount = roundMoney(Number(fee));
  let paid = 0;

  for (const payment of payments) {
    const amount = roundMoney(Number(payment.amount));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    paid += payment.reversesPaymentId ? -amount : amount;
  }

  paid = roundMoney(paid);
  const balance = roundMoney(feeAmount - paid);
  let state: PaymentBalance["state"];

  if (paid <= 0) state = "unpaid";
  else if (balance > 0) state = "partial";
  else if (balance < 0) state = "overpaid";
  else state = "paid";

  return { fee: feeAmount, paid, balance, state };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
