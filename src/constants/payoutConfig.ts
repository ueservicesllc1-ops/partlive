export const PAYOUT_CONFIG = {
  BEANS_TO_USD_RATE: 0.003, // 1000 Beans = $3 USD
  MIN_PAYOUT_USD: 25, // Min withdrawal of $25 USD
  MIN_PAYOUT_BEANS: Math.ceil(25 / 0.003), // ~8334 Beans
  FIRST_PAYOUT_WAIT_DAYS: 15, // A host must be approved for 15 days before first payout
  PAYOUTS_MANUAL_MODE: true, // Requires admin review and manual processing
};
