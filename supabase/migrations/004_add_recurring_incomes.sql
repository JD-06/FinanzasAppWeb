-- Recurring incomes
create table recurring_incomes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('nomina','bono','vales','freelance','otro')),
  frequency text not null check (frequency in ('monthly','weekly','yearly')),
  next_date date not null,
  created_at timestamptz default now()
);

alter table recurring_incomes enable row level security;
create policy "Users see own recurring incomes" on recurring_incomes for all using (auth.uid() = user_id);
