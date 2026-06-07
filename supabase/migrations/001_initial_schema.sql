-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories (seeded, not user-created)
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text not null,
  color text not null
);

-- Incomes
create table incomes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  type text not null check (type in ('nomina','bono','vales','freelance','otro')),
  notes text,
  created_at timestamptz default now()
);

-- Expenses
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) not null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  payment_method text not null default 'efectivo',
  notes text,
  created_at timestamptz default now()
);

-- Debts
create table debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  balance numeric(12, 2) not null check (balance >= 0),
  monthly_payment numeric(12, 2) not null check (monthly_payment > 0),
  interest_rate numeric(5, 4) not null default 0,
  start_date date not null,
  created_at timestamptz default now()
);

-- Goals
create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz default now()
);

-- Recurring expenses
create table recurring_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('monthly','weekly','yearly')),
  next_charge date not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table debts enable row level security;
alter table goals enable row level security;
alter table recurring_expenses enable row level security;

create policy "Users see own incomes" on incomes for all using (auth.uid() = user_id);
create policy "Users see own expenses" on expenses for all using (auth.uid() = user_id);
create policy "Users see own debts" on debts for all using (auth.uid() = user_id);
create policy "Users see own goals" on goals for all using (auth.uid() = user_id);
create policy "Users see own recurring" on recurring_expenses for all using (auth.uid() = user_id);
create policy "Anyone reads categories" on categories for select using (true);
