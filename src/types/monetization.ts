export interface PlatformMonetizationConfig {
  beansToUsdRate: number; // 0.003 (1000 Beans = $3 USD)
  minPayoutUsd: number; // $20
  firstPayoutWaitDays: number; // 15 days
  payoutsManualMode: boolean; // true
}
