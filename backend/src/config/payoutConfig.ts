export const PAYOUT_CONFIG = {
  MIN_PAYOUT_DIAMONDS: Number(process.env.MIN_PAYOUT_DIAMONDS) || 10000,
  DIAMONDS_TO_USD_RATE: Number(process.env.DIAMONDS_TO_USD_RATE) || 0.005,
  PAYOUT_FEE_USD: Number(process.env.PAYOUT_FEE_USD) || 0,
  PAYOUTS_ENABLED: process.env.PAYOUTS_ENABLED !== 'false',
};
