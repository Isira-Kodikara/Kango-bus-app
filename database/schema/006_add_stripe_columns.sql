-- Add Stripe columns to users table
ALTER TABLE users
ADD COLUMN stripe_customer_id VARCHAR(255) NULL,
ADD COLUMN default_payment_method_id VARCHAR(255) NULL;

CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
