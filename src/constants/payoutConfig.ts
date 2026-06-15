export const PAYOUT_CONFIG = {
  BEANS_TO_USD_RATE: 0.003, // 1000 Beans = $3 USD
  MIN_PAYOUT_USD: 20, // Min withdrawal of $20 USD
  MIN_PAYOUT_BEANS: Math.ceil(20 / 0.003), // ~6667 Beans
  FIRST_PAYOUT_WAIT_DAYS: 15, // A host must be approved for 15 days before first payout
  PAYOUTS_MANUAL_MODE: true, // Requires admin review and manual processing
};
