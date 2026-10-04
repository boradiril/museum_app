import "server-only";

/**
 * Payment provider interface (CLAUDE.md §3.4, §5.4). The checkout route only
 * depends on this, so the dummy provider can be swapped for Stripe later
 * without changing the unlock logic.
 */

export const TOUR_PRICE_CENTS = 499; // $4.99 placeholder (CLAUDE.md §3.4)
export const TOUR_CURRENCY = "usd";

export interface PaymentResult {
  provider: "dummy" | "stripe";
  reference: string;
  receiptEmail: string | null;
}

export interface PaymentProvider {
  charge(args: { itineraryId: string; userId: string; amountCents: number }): Promise<PaymentResult>;
}

/** Always succeeds, charges nothing. For building and testing the unlock flow only. */
const dummyProvider: PaymentProvider = {
  async charge({ itineraryId }) {
    return {
      provider: "dummy",
      reference: `dummy_${itineraryId}`,
      receiptEmail: null,
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "dummy";
  if (name === "dummy") return dummyProvider;
  throw new Error(`Unknown PAYMENT_PROVIDER: ${name}`);
}
