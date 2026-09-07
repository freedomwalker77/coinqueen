/** MyVaultExchange's cut of each connected-seller sale, in basis points (1000 = 10%). */
export const PLATFORM_FEE_BPS = 1000;

export function applicationFeeCents(chargeCents: number) {
  const fee = Math.round((chargeCents * PLATFORM_FEE_BPS) / 10_000);
  return Math.min(Math.max(fee, 1), Math.max(chargeCents - 1, 0));
}

export function sellerPayoutCents(chargeCents: number) {
  return Math.max(0, chargeCents - applicationFeeCents(chargeCents));
}
