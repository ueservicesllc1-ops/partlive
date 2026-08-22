# PartyLive Production Readiness Checklist — Phase 17 Real Payments

This document outlines the mandatory compliance, security, financial, and technical gates that **MUST** be verified and approved before switching PartyLive from Sandbox to Production Real Payments.

---

## 1. Apple App Store In-App Purchases (IAP)

- [ ] **App Store Connect Product Configuration**:
  - `com.partylive.coins.100` ($0.99 USD)
  - `com.partylive.coins.500` ($4.99 USD)
  - `com.partylive.coins.1000` ($9.99 USD)
  - `com.partylive.coins.5000` ($44.99 USD)
  - `com.partylive.coins.10000` ($84.99 USD)
  - `com.partylive.vip.monthly` ($9.99 USD/mo)
- [ ] **Shared Secret Configured**:
  - `APPLE_IAP_SHARED_SECRET` set in environment variables.
- [ ] **Server Notifications URL**:
  - `https://api.partylive.app/api/webhooks/apple` configured in App Store Connect.
- [ ] **Sandbox Testing Completed**:
  - Test user purchase, restore, cancellation, and refund.

---

## 2. Google Play Billing

- [ ] **Google Play Console Product Catalog**:
  - In-App Products configured matching App Store pricing.
  - Subscriptions configured with base plans.
- [ ] **Service Account Credentials**:
  - `GOOGLE_PLAY_CLIENT_EMAIL` & `GOOGLE_PLAY_PRIVATE_KEY` set with `androidpublisher` scope.
  - `GOOGLE_PLAY_PACKAGE_NAME` set to `com.partylive.app`.
- [ ] **Real-Time Developer Notifications**:
  - Google Cloud Pub/Sub topic created and linked to Google Play Console.
  - Webhook push endpoint `https://api.partylive.app/api/webhooks/google?token=XXX` configured.

---

## 3. Financial Integrity & Auditing

- [ ] **Idempotency Verification**:
  - Duplicate purchase tokens rejected via `processedPurchaseTokens` Firestore collection.
- [ ] **No Client-Side Financial Writes**:
  - Firestore Security Rules enforce `allow write: if false` on `wallets`, `walletTransactions`, `purchaseOrders`, `hostPayouts`, and `paymentLedger`.
- [ ] **Daily Financial Reconciliation**:
  - Automated cron job running `reconcileDailyFinancials()`.
  - Alert trigger for `DIAMOND_GIFT_MISMATCH` or `PAYMENT_UNRECONCILED`.
- [ ] **Chargeback & Dispute Reserve**:
  - Wallet lock triggered automatically on chargeback notification (`recordChargeback`).

---

## 4. Host Creator Payouts & KYC

- [ ] **KYC Provider Integration**:
  - Identity verification provider (Veriff/Jumio/Stripe Identity) configured.
  - Minimum payout threshold ($50 USD / 5,000 Diamonds) enforced.
- [ ] **Payout Provider Production Setup**:
  - Production API keys for PayPal/Bank Transfer/Payoneer/Binance.
- [ ] **Maker/Checker Double Approval**:
  - Admin Control Center enforces two-person sign-off for payouts exceeding $500 USD.

---

## 5. Security & Antifraud

- [ ] **Purchase Velocity Limits**:
  - Daily purchase velocity cap per account to block stolen card testing.
- [ ] **Fraud Score Gating**:
  - Accounts with high fraud score automatically placed on `Payout Hold`.
- [ ] **Audit Trail**:
  - All admin financial adjustments logged in `auditLogs` with actor ID and timestamp.

---

## Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| Finance Lead | | PENDING | |
| Lead Developer | | PENDING | |
| Security Lead | | PENDING | |
