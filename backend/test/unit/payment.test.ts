import { describe, expect, it } from "vitest";
import { calculatePaymentBalance, roundMoney } from "@/lib/payment";

describe("Payment Balance & Reversals Calculation", () => {
  it("calculates unpaid state when no payments recorded", () => {
    const result = calculatePaymentBalance("1500.00", []);
    expect(result.fee).toBe(1500);
    expect(result.paid).toBe(0);
    expect(result.balance).toBe(1500);
    expect(result.state).toBe("unpaid");
  });

  it("calculates partial payment state", () => {
    const result = calculatePaymentBalance(1500, [
      { amount: "500.00", reversesPaymentId: null },
    ]);
    expect(result.fee).toBe(1500);
    expect(result.paid).toBe(500);
    expect(result.balance).toBe(1000);
    expect(result.state).toBe("partial");
  });

  it("calculates fully paid state", () => {
    const result = calculatePaymentBalance("1500.00", [
      { amount: 500, reversesPaymentId: null },
      { amount: "1000.00", reversesPaymentId: null },
    ]);
    expect(result.paid).toBe(1500);
    expect(result.balance).toBe(0);
    expect(result.state).toBe("paid");
  });

  it("calculates overpaid state", () => {
    const result = calculatePaymentBalance(1000, [
      { amount: 1200, reversesPaymentId: null },
    ]);
    expect(result.paid).toBe(1200);
    expect(result.balance).toBe(-200);
    expect(result.state).toBe("overpaid");
  });

  it("applies payment reversals without mutating history", () => {
    const payments = [
      { amount: "1500.00", reversesPaymentId: null },
      // Reversal of the 1500 payment
      { amount: "1500.00", reversesPaymentId: "orig-payment-1" },
    ];
    const result = calculatePaymentBalance("1500.00", payments);
    expect(result.paid).toBe(0);
    expect(result.balance).toBe(1500);
    expect(result.state).toBe("unpaid");
  });

  it("handles decimal precision safely with roundMoney", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1234.567)).toBe(1234.57);
  });
});
