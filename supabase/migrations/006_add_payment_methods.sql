-- Add payment method to expenses to track wallet balances
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'efectivo';
ALTER TABLE recurring_expenses ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'efectivo';
