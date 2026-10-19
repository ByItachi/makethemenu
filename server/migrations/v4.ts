// Idempotent migration for v4: billing tables (subscriptions, payments, payment methods, coupons, webhook events).
// Safe to run repeatedly; never drops or alters existing data. Take a DB backup first.
// Run: npm run db:migrate-v4
import "../env";
import mysql from "mysql2/promise";

const TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    plan_code VARCHAR(32) NOT NULL,
    \`interval\` VARCHAR(16) NOT NULL DEFAULT 'monthly',
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    pending_plan_code VARCHAR(32) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscription_restaurant (restaurant_id),
    CONSTRAINT fk_sub_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    CONSTRAINT fk_sub_plan FOREIGN KEY (plan_code) REFERENCES plans(code)
  )`,
  `CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    provider VARCHAR(32) NOT NULL,
    token VARCHAR(128) NOT NULL,
    brand VARCHAR(32) NULL,
    last4 VARCHAR(4) NULL,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pm_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  )`,
  `CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    percent_off INT NULL,
    amount_off DECIMAL(10,2) NULL,
    valid_until TIMESTAMP NULL,
    max_redemptions INT NULL,
    redemptions INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    subscription_id INT NULL,
    kind VARCHAR(16) NOT NULL,
    plan_code VARCHAR(32) NOT NULL,
    \`interval\` VARCHAR(16) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    coupon_id INT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    provider VARCHAR(32) NOT NULL,
    provider_ref VARCHAR(128) NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    attempts INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP NULL,
    failure_reason VARCHAR(255) NULL,
    invoice_no VARCHAR(32) NULL UNIQUE,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_restaurant (restaurant_id),
    CONSTRAINT fk_pay_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    CONSTRAINT fk_pay_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    CONSTRAINT fk_pay_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id)
  )`,
  `CREATE TABLE IF NOT EXISTS webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    event_id VARCHAR(128) NOT NULL,
    type VARCHAR(64) NOT NULL,
    received_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_webhook_event (provider, event_id)
  )`,
];

export async function migrateV4(url: string): Promise<void> {
  const conn = await mysql.createConnection(url);
  try {
    for (const sql of TABLES) await conn.query(sql);
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop()!)) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  migrateV4(url)
    .then(() => console.log("v4 migration tamam"))
    .catch((e) => {
      console.error("migration hatası:", e?.code ?? e?.message);
      process.exit(1);
    });
}
