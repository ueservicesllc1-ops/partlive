export const PAYOUT_CONFIG = {
  BEANS_TO_USD_RATE: 0.003, // 1000 Beans = $3 USD
  MIN_PAYOUT_USD: 20, // Min withdrawal of $20 USD
  MIN_PAYOUT_BEANS: Math.ceil(20 / 0.003), // ~6667 Beans
  PAYOUT_FEE_USD: Number(process.env.PAYOUT_FEE_USD) || 0,
  PAYOUTS_ENABLED: process.env.PAYOUTS_ENABLED !== 'false',
  FIRST_PAYOUT_WAIT_DAYS: 15,
  PAYOUTS_MANUAL_MODE: true,
};
