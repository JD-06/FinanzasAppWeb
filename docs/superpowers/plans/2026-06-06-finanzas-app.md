# IA Finanzas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal finance web app where a single user registers income, expenses, debts, and goals — and the system calculates everything automatically (no formulas, no spreadsheets).

**Architecture:** React SPA with Vite + TypeScript on the frontend, Supabase (PostgreSQL + Auth + realtime) as the full backend. A pure-TypeScript financial engine lives in `src/lib/finance/` and is called by React Query hooks. All DB mutations go through typed Supabase client functions in `src/lib/supabase/`.

**Tech Stack:** React 18, TypeScript 5, Vite, Tailwind CSS v3, shadcn/ui, Recharts, Supabase JS v2, React Query v5, React Router v6, Vitest, React Testing Library.

---

## File Map

```
src/
  lib/
    supabase/
      client.ts          # Supabase singleton + typed DB types
      incomes.ts         # CRUD for incomes table
      expenses.ts        # CRUD for expenses table
      debts.ts           # CRUD for debts table
      goals.ts           # CRUD for goals table
      categories.ts      # Read categories
      recurring.ts       # CRUD for recurring_expenses
    finance/
      engine.ts          # Pure financial calculations (no side effects)
      projections.ts     # 12/24/36-month projections
      simulator.ts       # "What if I pay extra?" logic
  hooks/
    useIncomes.ts
    useExpenses.ts
    useDebts.ts
    useGoals.ts
    useDashboard.ts
    useSimulator.ts
  components/
    ui/                  # shadcn generated components (do not edit)
    layout/
      AppShell.tsx       # Sidebar + outlet
      Sidebar.tsx
    dashboard/
      Dashboard.tsx
      StatCard.tsx
      MonthlyChart.tsx
    incomes/
      IncomesPage.tsx
      IncomeForm.tsx
      IncomeList.tsx
    expenses/
      ExpensesPage.tsx
      ExpenseForm.tsx
      ExpenseList.tsx
    debts/
      DebtsPage.tsx
      DebtForm.tsx
      DebtCard.tsx
    goals/
      GoalsPage.tsx
      GoalForm.tsx
      GoalCard.tsx
    simulator/
      SimulatorPage.tsx
      SimulatorResult.tsx
    settings/
      SettingsPage.tsx
  pages/
    LoginPage.tsx
  App.tsx
  main.tsx
supabase/
  migrations/
    001_initial_schema.sql
  seed.sql
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.example`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd "C:\Users\const\Desktop\IA Finanzas"
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install @supabase/supabase-js @tanstack/react-query react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```
Choose: TypeScript → yes, style → Default, base color → Slate, CSS variables → yes.

Then add needed components:
```bash
npx shadcn@latest add button card input label select textarea badge progress dialog sheet tabs
```

- [ ] **Step 4: Configure Tailwind — replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

```bash
npm install tailwindcss-animate
```

- [ ] **Step 5: Create `.env.example` and `.env.local`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Install Vitest + React Testing Library**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add to `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite + React + TS + Tailwind + shadcn + Supabase"
```

---

## Task 2: Supabase Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project. Copy the Project URL and anon key into `.env.local`.

- [ ] **Step 2: Write migration — `supabase/migrations/001_initial_schema.sql`**

```sql
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
```

- [ ] **Step 3: Run migration in Supabase SQL editor**

Copy the SQL above and run it in the Supabase Dashboard → SQL Editor.

- [ ] **Step 4: Seed categories — `supabase/seed.sql`**

```sql
insert into categories (name, icon, color) values
  ('Gasolina',  '⛽', '#F59E0B'),
  ('Super',     '🛒', '#10B981'),
  ('Internet',  '📡', '#3B82F6'),
  ('Luz',       '💡', '#EAB308'),
  ('Gas',       '🔥', '#EF4444'),
  ('Médicos',   '🏥', '#8B5CF6'),
  ('Deportes',  '🏋️', '#06B6D4'),
  ('Salidas',   '🍽️', '#EC4899'),
  ('Otros',     '📦', '#6B7280');
```

Run it in SQL Editor after the migration.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: supabase schema with RLS and category seed"
```

---

## Task 3: Supabase Client + Typed DB Functions

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/incomes.ts`
- Create: `src/lib/supabase/expenses.ts`
- Create: `src/lib/supabase/debts.ts`
- Create: `src/lib/supabase/goals.ts`
- Create: `src/lib/supabase/categories.ts`

- [ ] **Step 1: Create `src/lib/supabase/client.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

// Shared domain types
export type IncomeType = 'nomina' | 'bono' | 'vales' | 'freelance' | 'otro'
export type Frequency = 'monthly' | 'weekly' | 'yearly'

export interface Income {
  id: string
  user_id: string
  amount: number
  date: string
  type: IncomeType
  notes: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Expense {
  id: string
  user_id: string
  category_id: string
  amount: number
  date: string
  payment_method: string
  notes: string | null
  created_at: string
  categories?: Category
}

export interface Debt {
  id: string
  user_id: string
  name: string
  balance: number
  monthly_payment: number
  interest_rate: number
  start_date: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  created_at: string
}
```

- [ ] **Step 2: Create `src/lib/supabase/incomes.ts`**

```ts
import { supabase } from './client'
import type { Income, IncomeType } from './client'

export async function getIncomes(userId: string): Promise<Income[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addIncome(payload: {
  user_id: string
  amount: number
  date: string
  type: IncomeType
  notes?: string
}): Promise<Income> {
  const { data, error } = await supabase.from('incomes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 3: Create `src/lib/supabase/expenses.ts`**

```ts
import { supabase } from './client'
import type { Expense } from './client'

export async function getExpenses(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(id, name, icon, color)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addExpense(payload: {
  user_id: string
  category_id: string
  amount: number
  date: string
  payment_method: string
  notes?: string
}): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').insert(payload).select('*, categories(id, name, icon, color)').single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Create `src/lib/supabase/debts.ts`**

```ts
import { supabase } from './client'
import type { Debt } from './client'

export async function getDebts(userId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addDebt(payload: Omit<Debt, 'id' | 'created_at'>): Promise<Debt> {
  const { data, error } = await supabase.from('debts').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateDebt(id: string, payload: Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>): Promise<Debt> {
  const { data, error } = await supabase.from('debts').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 5: Create `src/lib/supabase/goals.ts`**

```ts
import { supabase } from './client'
import type { Goal } from './client'

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addGoal(payload: Omit<Goal, 'id' | 'created_at'>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateGoal(id: string, payload: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 6: Create `src/lib/supabase/categories.ts`**

```ts
import { supabase } from './client'
import type { Category } from './client'

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: supabase client + typed CRUD functions for all entities"
```

---

## Task 4: Financial Engine (Pure Functions)

**Files:**
- Create: `src/lib/finance/engine.ts`
- Create: `src/lib/finance/projections.ts`
- Create: `src/lib/finance/simulator.ts`
- Create: `src/lib/finance/engine.test.ts`

- [ ] **Step 1: Write failing tests — `src/lib/finance/engine.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcFreeCashFlow,
  calcDebtPayoff,
  calcGoalMonthlySaving,
  calcGoalProgress,
} from './engine'

describe('calcMonthlyIncome', () => {
  it('sums income amounts for a given month', () => {
    const incomes = [
      { amount: 10000, date: '2026-06-01', type: 'nomina' },
      { amount: 5000, date: '2026-06-15', type: 'bono' },
      { amount: 3000, date: '2026-05-30', type: 'nomina' },
    ] as any
    expect(calcMonthlyIncome(incomes, 2026, 5)).toBe(10000 + 5000)
  })
})

describe('calcMonthlyExpenses', () => {
  it('sums expenses for a given month', () => {
    const expenses = [
      { amount: 500, date: '2026-06-03' },
      { amount: 200, date: '2026-06-10' },
      { amount: 100, date: '2026-07-01' },
    ] as any
    expect(calcMonthlyExpenses(expenses, 2026, 5)).toBe(700)
  })
})

describe('calcFreeCashFlow', () => {
  it('returns income minus expenses minus total debt payments', () => {
    expect(calcFreeCashFlow(20000, 8000, 4000)).toBe(8000)
  })
})

describe('calcDebtPayoff', () => {
  it('returns months to payoff with 0% interest', () => {
    const result = calcDebtPayoff(12000, 2000, 0)
    expect(result.months).toBe(6)
    expect(result.totalInterest).toBe(0)
  })

  it('calculates payoff months with interest', () => {
    const result = calcDebtPayoff(10000, 500, 0.02) // 2% monthly
    expect(result.months).toBeGreaterThan(20)
    expect(result.totalInterest).toBeGreaterThan(0)
  })

  it('returns Infinity when payment does not cover interest', () => {
    const result = calcDebtPayoff(10000, 100, 0.05)
    expect(result.months).toBe(Infinity)
  })
})

describe('calcGoalMonthlySaving', () => {
  it('divides remaining amount by months left', () => {
    const result = calcGoalMonthlySaving(60000, 12000, '2027-06-01', '2026-06-01')
    expect(result).toBeCloseTo(4000)
  })
})

describe('calcGoalProgress', () => {
  it('returns percentage 0-100', () => {
    expect(calcGoalProgress(30000, 60000)).toBe(50)
    expect(calcGoalProgress(60000, 60000)).toBe(100)
    expect(calcGoalProgress(0, 60000)).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/finance/engine.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/finance/engine.ts`**

```ts
import type { Income, Expense, Debt, Goal } from '../supabase/client'

// Returns 0-based month index (0 = January)
function sameMonth(date: string, year: number, month: number): boolean {
  const d = new Date(date + 'T00:00:00')
  return d.getFullYear() === year && d.getMonth() === month
}

export function calcMonthlyIncome(incomes: Income[], year: number, month: number): number {
  return incomes
    .filter(i => sameMonth(i.date, year, month))
    .reduce((sum, i) => sum + i.amount, 0)
}

export function calcMonthlyExpenses(expenses: Expense[], year: number, month: number): number {
  return expenses
    .filter(e => sameMonth(e.date, year, month))
    .reduce((sum, e) => sum + e.amount, 0)
}

export function calcFreeCashFlow(
  monthlyIncome: number,
  monthlyExpenses: number,
  totalDebtPayments: number
): number {
  return monthlyIncome - monthlyExpenses - totalDebtPayments
}

export interface DebtPayoffResult {
  months: number
  totalInterest: number
  payoffDate: Date
}

export function calcDebtPayoff(
  balance: number,
  monthlyPayment: number,
  monthlyRate: number
): DebtPayoffResult {
  if (monthlyRate === 0) {
    const months = Math.ceil(balance / monthlyPayment)
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)
    return { months, totalInterest: 0, payoffDate }
  }

  const interest = balance * monthlyRate
  if (monthlyPayment <= interest) {
    return { months: Infinity, totalInterest: Infinity, payoffDate: new Date(8640000000000000) }
  }

  let remaining = balance
  let months = 0
  let totalInterest = 0

  while (remaining > 0.01 && months < 600) {
    const monthInterest = remaining * monthlyRate
    totalInterest += monthInterest
    remaining = remaining + monthInterest - monthlyPayment
    months++
  }

  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + months)
  return { months, totalInterest, payoffDate }
}

export function calcGoalMonthlySaving(
  targetAmount: number,
  currentAmount: number,
  targetDate: string,
  today: string = new Date().toISOString().slice(0, 10)
): number {
  const target = new Date(targetDate + 'T00:00:00')
  const now = new Date(today + 'T00:00:00')
  const monthsLeft =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  if (monthsLeft <= 0) return targetAmount - currentAmount
  return (targetAmount - currentAmount) / monthsLeft
}

export function calcGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount === 0) return 100
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100))
}

export function calcTotalDebtPayments(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.monthly_payment, 0)
}

export function calcNetWorth(
  totalIncome: number,
  totalExpenses: number,
  totalDebts: number,
  totalSavings: number
): number {
  return totalSavings - totalDebts
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/finance/engine.test.ts
```
Expected: All PASS.

- [ ] **Step 5: Create `src/lib/finance/projections.ts`**

```ts
import type { Income, Expense, Debt } from '../supabase/client'
import { calcMonthlyIncome, calcMonthlyExpenses, calcDebtPayoff } from './engine'

export interface MonthProjection {
  month: string   // "YYYY-MM"
  income: number
  expenses: number
  debtPayments: number
  cashFlow: number
  cumulativeSavings: number
}

export function buildProjections(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  months: 12 | 24 | 36,
  annualInflation = 0.04,
  annualSalaryIncrease = 0.05
): MonthProjection[] {
  const today = new Date()
  const avgMonthlyIncome = calcMonthlyIncome(incomes, today.getFullYear(), today.getMonth())
  const avgMonthlyExpenses = calcMonthlyExpenses(expenses, today.getFullYear(), today.getMonth())
  const totalDebtPayments = debts.reduce((s, d) => s + d.monthly_payment, 0)

  const projections: MonthProjection[] = []
  let cumulativeSavings = 0

  for (let i = 0; i < months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1)
    const yearFraction = i / 12
    const income = avgMonthlyIncome * Math.pow(1 + annualSalaryIncrease, yearFraction)
    const expensesAdj = avgMonthlyExpenses * Math.pow(1 + annualInflation, yearFraction)
    const cashFlow = income - expensesAdj - totalDebtPayments
    cumulativeSavings += Math.max(0, cashFlow)

    projections.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      income: Math.round(income),
      expenses: Math.round(expensesAdj),
      debtPayments: Math.round(totalDebtPayments),
      cashFlow: Math.round(cashFlow),
      cumulativeSavings: Math.round(cumulativeSavings),
    })
  }

  return projections
}
```

- [ ] **Step 6: Create `src/lib/finance/simulator.ts`**

```ts
import type { Debt } from '../supabase/client'
import { calcDebtPayoff } from './engine'

export interface SimulatorInput {
  debt: Debt
  extraPayment: number
}

export interface SimulatorResult {
  baseMonths: number
  newMonths: number
  monthsSaved: number
  interestSaved: number
  newPayoffDate: Date
}

export function simulateExtraPayment(input: SimulatorInput): SimulatorResult {
  const { debt, extraPayment } = input
  const monthlyRate = debt.interest_rate / 12

  const base = calcDebtPayoff(debt.balance, debt.monthly_payment, monthlyRate)
  const newPayment = debt.monthly_payment + extraPayment
  const accelerated = calcDebtPayoff(debt.balance, newPayment, monthlyRate)

  return {
    baseMonths: base.months,
    newMonths: accelerated.months,
    monthsSaved: base.months === Infinity ? 0 : base.months - accelerated.months,
    interestSaved:
      base.totalInterest === Infinity ? 0 : base.totalInterest - accelerated.totalInterest,
    newPayoffDate: accelerated.payoffDate,
  }
}

export interface RentViabilityInput {
  freeCashFlow: number
  rentAmount: number
}

export interface RentViabilityResult {
  viable: boolean
  gap: number
  readyDate: Date | null
}

export function simulateRentViability(input: RentViabilityInput): RentViabilityResult {
  const { freeCashFlow, rentAmount } = input
  const gap = rentAmount - freeCashFlow

  if (freeCashFlow >= rentAmount) {
    return { viable: true, gap: 0, readyDate: new Date() }
  }

  // Estimate months assuming 5% monthly income growth
  let months = 0
  let currentFlow = freeCashFlow
  while (currentFlow < rentAmount && months < 120) {
    currentFlow *= 1.005
    months++
  }

  const readyDate = new Date()
  readyDate.setMonth(readyDate.getMonth() + months)

  return { viable: false, gap, readyDate: months < 120 ? readyDate : null }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/finance/
git commit -m "feat: financial engine with payoff, projections, and simulator"
```

---

## Task 5: Auth + React Query Setup

**Files:**
- Create: `src/hooks/useAuth.ts`
- Modify: `src/main.tsx`
- Create: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Create `src/hooks/useAuth.ts`**

```ts
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signUp, signOut }
}
```

- [ ] **Step 2: Create `src/pages/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await signIn(email, password)
      else await signUp(email, password)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {mode === 'login' ? '💰 Mis Finanzas' : 'Crear cuenta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? '¿Sin cuenta? Registrarme' : '¿Ya tengo cuenta? Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { App } from './App'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 4: Rewrite `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { IncomesPage } from '@/components/incomes/IncomesPage'
import { ExpensesPage } from '@/components/expenses/ExpensesPage'
import { DebtsPage } from '@/components/debts/DebtsPage'
import { GoalsPage } from '@/components/goals/GoalsPage'
import { SimulatorPage } from '@/components/simulator/SimulatorPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

export function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  if (!user) return <BrowserRouter><LoginPage /></BrowserRouter>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="ingresos" element={<IncomesPage />} />
          <Route path="gastos" element={<ExpensesPage />} />
          <Route path="deudas" element={<DebtsPage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: auth hook, login page, and routing scaffold"
```

---

## Task 6: Layout — AppShell + Sidebar

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create `src/components/layout/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',            label: 'Dashboard',   icon: '📊' },
  { to: '/ingresos',   label: 'Ingresos',     icon: '📈' },
  { to: '/gastos',     label: 'Gastos',       icon: '📉' },
  { to: '/deudas',     label: 'Deudas',       icon: '📚' },
  { to: '/metas',      label: 'Metas',        icon: '🎯' },
  { to: '/simulador',  label: 'Simulador',    icon: '🔮' },
  { to: '/configuracion', label: 'Config',   icon: '⚙️' },
]

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-card border-r flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">💰 Mis Finanzas</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: app shell with sidebar navigation"
```

---

## Task 7: React Query Hooks

**Files:**
- Create: `src/hooks/useIncomes.ts`
- Create: `src/hooks/useExpenses.ts`
- Create: `src/hooks/useDebts.ts`
- Create: `src/hooks/useGoals.ts`
- Create: `src/hooks/useDashboard.ts`

- [ ] **Step 1: Create `src/hooks/useIncomes.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getIncomes, addIncome, deleteIncome } from '@/lib/supabase/incomes'
import type { IncomeType } from '@/lib/supabase/client'

export function useIncomes() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user!.id

  const query = useQuery({
    queryKey: ['incomes', userId],
    queryFn: () => getIncomes(userId),
  })

  const add = useMutation({
    mutationFn: (payload: { amount: number; date: string; type: IncomeType; notes?: string }) =>
      addIncome({ ...payload, user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes', userId] }),
  })

  return { ...query, add, remove }
}
```

- [ ] **Step 2: Create `src/hooks/useExpenses.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getExpenses, addExpense, deleteExpense } from '@/lib/supabase/expenses'
import { getCategories } from '@/lib/supabase/categories'

export function useExpenses() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user!.id

  const query = useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => getExpenses(userId),
  })

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  })

  const add = useMutation({
    mutationFn: (payload: {
      category_id: string
      amount: number
      date: string
      payment_method: string
      notes?: string
    }) => addExpense({ ...payload, user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', userId] }),
  })

  return { ...query, categories: categories.data ?? [], add, remove }
}
```

- [ ] **Step 3: Create `src/hooks/useDebts.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getDebts, addDebt, updateDebt, deleteDebt } from '@/lib/supabase/debts'
import type { Debt } from '@/lib/supabase/client'

export function useDebts() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user!.id

  const query = useQuery({
    queryKey: ['debts', userId],
    queryFn: () => getDebts(userId),
  })

  const add = useMutation({
    mutationFn: (payload: Omit<Debt, 'id' | 'created_at'>) => addDebt(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>) =>
      updateDebt(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', userId] }),
  })

  return { ...query, add, update, remove }
}
```

- [ ] **Step 4: Create `src/hooks/useGoals.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/supabase/goals'
import type { Goal } from '@/lib/supabase/client'

export function useGoals() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user!.id

  const query = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => getGoals(userId),
  })

  const add = useMutation({
    mutationFn: (payload: Omit<Goal, 'id' | 'created_at'>) => addGoal(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>) =>
      updateGoal(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })

  return { ...query, add, update, remove }
}
```

- [ ] **Step 5: Create `src/hooks/useDashboard.ts`**

```ts
import { useMemo } from 'react'
import { useIncomes } from './useIncomes'
import { useExpenses } from './useExpenses'
import { useDebts } from './useDebts'
import { useGoals } from './useGoals'
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcFreeCashFlow,
  calcTotalDebtPayments,
} from '@/lib/finance/engine'

export function useDashboard() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const incomes = useIncomes()
  const expenses = useExpenses()
  const debts = useDebts()
  const goals = useGoals()

  const stats = useMemo(() => {
    const monthlyIncome = calcMonthlyIncome(incomes.data ?? [], year, month)
    const monthlyExpenses = calcMonthlyExpenses(expenses.data ?? [], year, month)
    const totalDebtPayments = calcTotalDebtPayments(debts.data ?? [])
    const freeCashFlow = calcFreeCashFlow(monthlyIncome, monthlyExpenses, totalDebtPayments)
    const totalDebt = (debts.data ?? []).reduce((s, d) => s + d.balance, 0)
    const totalSavings = (goals.data ?? []).reduce((s, g) => s + g.current_amount, 0)

    return { monthlyIncome, monthlyExpenses, totalDebtPayments, freeCashFlow, totalDebt, totalSavings }
  }, [incomes.data, expenses.data, debts.data, goals.data, year, month])

  const isLoading = incomes.isLoading || expenses.isLoading || debts.isLoading || goals.isLoading

  return {
    stats,
    incomes: incomes.data ?? [],
    expenses: expenses.data ?? [],
    debts: debts.data ?? [],
    goals: goals.data ?? [],
    isLoading,
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/
git commit -m "feat: react query hooks for all entities + dashboard aggregation"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `src/components/dashboard/StatCard.tsx`
- Create: `src/components/dashboard/MonthlyChart.tsx`
- Create: `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Create `src/components/dashboard/StatCard.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: string
  label: string
  value: string
  sub?: string
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'default'
}

const colorMap = {
  green:  'text-green-600',
  red:    'text-red-500',
  blue:   'text-blue-600',
  yellow: 'text-yellow-600',
  default: 'text-foreground',
}

export function StatCard({ icon, label, value, sub, color = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <span className="text-xl">{icon}</span>
          {label}
        </div>
        <p className={cn('text-3xl font-bold', colorMap[color])}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create `src/components/dashboard/MonthlyChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Income, Expense } from '@/lib/supabase/client'
import { calcMonthlyIncome, calcMonthlyExpenses } from '@/lib/finance/engine'

interface Props {
  incomes: Income[]
  expenses: Expense[]
}

function last6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('es', { month: 'short' }) })
  }
  return months
}

export function MonthlyChart({ incomes, expenses }: Props) {
  const data = last6Months().map(({ year, month, label }) => ({
    mes: label,
    Ingresos: calcMonthlyIncome(incomes, year, month),
    Gastos: calcMonthlyExpenses(expenses, year, month),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString('es')}`} />
        <Legend />
        <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Create `src/components/dashboard/Dashboard.tsx`**

```tsx
import { useDashboard } from '@/hooks/useDashboard'
import { StatCard } from './StatCard'
import { MonthlyChart } from './MonthlyChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcGoalProgress } from '@/lib/finance/engine'
import { Progress } from '@/components/ui/progress'

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function Dashboard() {
  const { stats, incomes, expenses, goals, isLoading } = useDashboard()

  if (isLoading) return <p className="text-muted-foreground">Calculando...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon="💰" label="Flujo libre" value={fmt(stats.freeCashFlow)} color={stats.freeCashFlow >= 0 ? 'green' : 'red'} />
        <StatCard icon="📈" label="Ingresos del mes" value={fmt(stats.monthlyIncome)} color="green" />
        <StatCard icon="📉" label="Gastos del mes" value={fmt(stats.monthlyExpenses)} color="red" />
        <StatCard icon="🏦" label="Ahorros" value={fmt(stats.totalSavings)} color="blue" />
        <StatCard icon="📚" label="Total deudas" value={fmt(stats.totalDebt)} color="yellow" />
        <StatCard icon="💳" label="Pagos mensuales deuda" value={fmt(stats.totalDebtPayments)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Últimos 6 meses</CardTitle></CardHeader>
        <CardContent>
          <MonthlyChart incomes={incomes} expenses={expenses} />
        </CardContent>
      </Card>

      {goals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Mis metas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {goals.map(g => {
              const pct = calcGoalProgress(g.current_amount, g.target_amount)
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{fmt(g.current_amount)}</span>
                    <span>{fmt(g.target_amount)}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: dashboard with stat cards, bar chart, and goal progress"
```

---

## Task 9: Ingresos Page

**Files:**
- Create: `src/components/incomes/IncomeForm.tsx`
- Create: `src/components/incomes/IncomeList.tsx`
- Create: `src/components/incomes/IncomesPage.tsx`

- [ ] **Step 1: Create `src/components/incomes/IncomeForm.tsx`**

```tsx
import { useState } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import type { IncomeType } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TYPES: { value: IncomeType; label: string }[] = [
  { value: 'nomina',    label: 'Nómina' },
  { value: 'bono',      label: 'Bono' },
  { value: 'vales',     label: 'Vales' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'otro',      label: 'Otro' },
]

export function IncomeForm() {
  const { add } = useIncomes()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<IncomeType>('nomina')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({ amount: Number(amount), date, type, notes: notes || undefined })
    setAmount('')
    setNotes('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Monto</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={v => setType(v as IncomeType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Input placeholder="Quincena, bono anual..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending}>
        {add.isPending ? 'Guardando...' : '+ Registrar ingreso'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/components/incomes/IncomeList.tsx`**

```tsx
import { useIncomes } from '@/hooks/useIncomes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Income } from '@/lib/supabase/client'

const TYPE_LABEL: Record<string, string> = {
  nomina: 'Nómina', bono: 'Bono', vales: 'Vales', freelance: 'Freelance', otro: 'Otro',
}

export function IncomeList() {
  const { data: incomes = [], remove } = useIncomes()

  if (incomes.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">Sin ingresos registrados.</p>

  return (
    <ul className="space-y-2">
      {incomes.map((income: Income) => (
        <li key={income.id} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium">${income.amount.toLocaleString('es-MX')}</p>
            <p className="text-xs text-muted-foreground">{income.date}</p>
            {income.notes && <p className="text-xs text-muted-foreground">{income.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{TYPE_LABEL[income.type]}</Badge>
            <Button variant="ghost" size="sm" onClick={() => remove.mutate(income.id)}>✕</Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Create `src/components/incomes/IncomesPage.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IncomeForm } from './IncomeForm'
import { IncomeList } from './IncomeList'

export function IncomesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📈 Ingresos</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Registrar ingreso</CardTitle></CardHeader>
          <CardContent><IncomeForm /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Historial</CardTitle></CardHeader>
          <CardContent><IncomeList /></CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/incomes/
git commit -m "feat: incomes page with form and history list"
```

---

## Task 10: Gastos Page

**Files:**
- Create: `src/components/expenses/ExpenseForm.tsx`
- Create: `src/components/expenses/ExpenseList.tsx`
- Create: `src/components/expenses/ExpensesPage.tsx`

- [ ] **Step 1: Create `src/components/expenses/ExpenseForm.tsx`**

```tsx
import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAYMENT_METHODS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia']

export function ExpenseForm() {
  const { add, categories } = useExpenses()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({ amount: Number(amount), date, category_id: categoryId, payment_method: paymentMethod, notes: notes || undefined })
    setAmount('')
    setNotes('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Monto</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Método de pago</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Input placeholder="Supermercado Walmart..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending || !categoryId}>
        {add.isPending ? 'Guardando...' : '+ Registrar gasto'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/components/expenses/ExpenseList.tsx`**

```tsx
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import type { Expense } from '@/lib/supabase/client'

export function ExpenseList() {
  const { data: expenses = [], remove } = useExpenses()

  if (expenses.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">Sin gastos registrados.</p>

  return (
    <ul className="space-y-2">
      {expenses.map((e: Expense) => (
        <li key={e.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">{e.categories?.icon}</span>
            <div>
              <p className="font-medium">${e.amount.toLocaleString('es-MX')}</p>
              <p className="text-xs text-muted-foreground">{e.categories?.name} · {e.date} · {e.payment_method}</p>
              {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => remove.mutate(e.id)}>✕</Button>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Create `src/components/expenses/ExpensesPage.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📉 Gastos</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Registrar gasto</CardTitle></CardHeader>
          <CardContent><ExpenseForm /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Historial</CardTitle></CardHeader>
          <CardContent><ExpenseList /></CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/
git commit -m "feat: expenses page with category selector and history"
```

---

## Task 11: Deudas Page

**Files:**
- Create: `src/components/debts/DebtForm.tsx`
- Create: `src/components/debts/DebtCard.tsx`
- Create: `src/components/debts/DebtsPage.tsx`

- [ ] **Step 1: Create `src/components/debts/DebtForm.tsx`**

```tsx
import { useState } from 'react'
import { useDebts } from '@/hooks/useDebts'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DebtForm() {
  const { add } = useDebts()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [monthly, setMonthly] = useState('')
  const [rate, setRate] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({
      user_id: user!.id,
      name,
      balance: Number(balance),
      monthly_payment: Number(monthly),
      interest_rate: Number(rate) / 100,
      start_date: startDate,
    })
    setName(''); setBalance(''); setMonthly(''); setRate('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Nombre de la deuda</Label>
        <Input placeholder="Tarjeta Banamex..." value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Saldo actual ($)</Label>
          <Input type="number" min="0" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Pago mensual ($)</Label>
          <Input type="number" min="0" step="0.01" value={monthly} onChange={e => setMonthly(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tasa anual (%)</Label>
          <Input type="number" min="0" step="0.1" placeholder="24.5" value={rate} onChange={e => setRate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Fecha inicio</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending}>
        {add.isPending ? 'Guardando...' : '+ Agregar deuda'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/components/debts/DebtCard.tsx`**

```tsx
import type { Debt } from '@/lib/supabase/client'
import { calcDebtPayoff } from '@/lib/finance/engine'
import { useDebts } from '@/hooks/useDebts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props { debt: Debt }

export function DebtCard({ debt }: Props) {
  const { remove } = useDebts()
  const monthlyRate = debt.interest_rate / 12
  const payoff = calcDebtPayoff(debt.balance, debt.monthly_payment, monthlyRate)

  const payoffLabel = payoff.months === Infinity
    ? 'Pago insuficiente'
    : `${payoff.months} meses (${payoff.payoffDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })})`

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{debt.name}</h3>
          <Button variant="ghost" size="sm" onClick={() => remove.mutate(debt.id)}>✕</Button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Saldo</span>
          <span className="font-medium text-right">${debt.balance.toLocaleString('es-MX')}</span>
          <span className="text-muted-foreground">Pago mensual</span>
          <span className="font-medium text-right">${debt.monthly_payment.toLocaleString('es-MX')}</span>
          <span className="text-muted-foreground">Tasa anual</span>
          <span className="font-medium text-right">{(debt.interest_rate * 100).toFixed(1)}%</span>
          <span className="text-muted-foreground">Liquidación</span>
          <span className="font-medium text-right text-xs">{payoffLabel}</span>
          {payoff.totalInterest > 0 && payoff.totalInterest !== Infinity && (
            <>
              <span className="text-muted-foreground">Intereses totales</span>
              <span className="font-medium text-right text-red-500">${Math.round(payoff.totalInterest).toLocaleString('es-MX')}</span>
            </>
          )}
        </div>
        {payoff.months === Infinity && (
          <Badge variant="destructive" className="text-xs">El pago mensual no cubre los intereses</Badge>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create `src/components/debts/DebtsPage.tsx`**

```tsx
import { useDebts } from '@/hooks/useDebts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DebtForm } from './DebtForm'
import { DebtCard } from './DebtCard'

export function DebtsPage() {
  const { data: debts = [], isLoading } = useDebts()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📚 Deudas</h2>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader><CardTitle className="text-base">Agregar deuda</CardTitle></CardHeader>
          <CardContent><DebtForm /></CardContent>
        </Card>
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Cargando...</p>}
          {!isLoading && debts.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin deudas registradas.</p>}
          {debts.map(d => <DebtCard key={d.id} debt={d} />)}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/debts/
git commit -m "feat: debts page with payoff calculator per debt"
```

---

## Task 12: Metas Page

**Files:**
- Create: `src/components/goals/GoalForm.tsx`
- Create: `src/components/goals/GoalCard.tsx`
- Create: `src/components/goals/GoalsPage.tsx`

- [ ] **Step 1: Create `src/components/goals/GoalForm.tsx`**

```tsx
import { useState } from 'react'
import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GoalForm() {
  const { add } = useGoals()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('0')
  const [targetDate, setTargetDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({
      user_id: user!.id,
      name,
      target_amount: Number(target),
      current_amount: Number(current),
      target_date: targetDate || null,
    })
    setName(''); setTarget(''); setCurrent('0'); setTargetDate('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Nombre de la meta</Label>
        <Input placeholder="Fondo de emergencia..." value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Meta ($)</Label>
          <Input type="number" min="0" step="0.01" value={target} onChange={e => setTarget(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Ahorrado hasta hoy ($)</Label>
          <Input type="number" min="0" step="0.01" value={current} onChange={e => setCurrent(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Fecha objetivo (opcional)</Label>
        <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending}>
        {add.isPending ? 'Guardando...' : '+ Agregar meta'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/components/goals/GoalCard.tsx`**

```tsx
import type { Goal } from '@/lib/supabase/client'
import { calcGoalProgress, calcGoalMonthlySaving } from '@/lib/finance/engine'
import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Props { goal: Goal }

export function GoalCard({ goal }: Props) {
  const { remove, update } = useGoals()
  const pct = calcGoalProgress(goal.current_amount, goal.target_amount)
  const remaining = goal.target_amount - goal.current_amount

  const monthlySaving = goal.target_date
    ? calcGoalMonthlySaving(goal.target_amount, goal.current_amount, goal.target_date)
    : null

  function handleAddSaving() {
    const input = window.prompt('¿Cuánto quieres agregar a esta meta?')
    const amount = Number(input)
    if (!input || isNaN(amount) || amount <= 0) return
    update.mutate({ id: goal.id, current_amount: goal.current_amount + amount })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{goal.name}</h3>
          <Button variant="ghost" size="sm" onClick={() => remove.mutate(goal.id)}>✕</Button>
        </div>
        <Progress value={pct} className="h-3" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">${goal.current_amount.toLocaleString('es-MX')}</span>
          <span className="font-bold text-primary">{pct}%</span>
          <span className="text-muted-foreground">${goal.target_amount.toLocaleString('es-MX')}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Falta: ${remaining.toLocaleString('es-MX')}</p>
          {monthlySaving !== null && (
            <p>Ahorra <strong>${Math.ceil(monthlySaving).toLocaleString('es-MX')}/mes</strong> para llegar a tiempo</p>
          )}
          {goal.target_date && <p>Fecha objetivo: {goal.target_date}</p>}
        </div>
        <Button size="sm" variant="outline" className="w-full" onClick={handleAddSaving}>
          + Agregar ahorro
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create `src/components/goals/GoalsPage.tsx`**

```tsx
import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalForm } from './GoalForm'
import { GoalCard } from './GoalCard'

export function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🎯 Metas</h2>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader><CardTitle className="text-base">Nueva meta</CardTitle></CardHeader>
          <CardContent><GoalForm /></CardContent>
        </Card>
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Cargando...</p>}
          {!isLoading && goals.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin metas registradas.</p>}
          {goals.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/goals/
git commit -m "feat: goals page with progress bars and monthly saving calculator"
```

---

## Task 13: Simulador Page

**Files:**
- Create: `src/components/simulator/SimulatorPage.tsx`
- Create: `src/hooks/useSimulator.ts`

- [ ] **Step 1: Create `src/hooks/useSimulator.ts`**

```ts
import { useState } from 'react'
import { useDebts } from './useDebts'
import { simulateExtraPayment, simulateRentViability } from '@/lib/finance/simulator'
import { useDashboard } from './useDashboard'
import type { SimulatorResult } from '@/lib/finance/simulator'

export function useSimulator() {
  const { data: debts = [] } = useDebts()
  const { stats } = useDashboard()
  const [selectedDebtId, setSelectedDebtId] = useState<string>('')
  const [extraPayment, setExtraPayment] = useState(0)
  const [rentAmount, setRentAmount] = useState(0)

  const selectedDebt = debts.find(d => d.id === selectedDebtId) ?? null

  const debtResult: SimulatorResult | null = selectedDebt && extraPayment > 0
    ? simulateExtraPayment({ debt: selectedDebt, extraPayment })
    : null

  const rentResult = rentAmount > 0
    ? simulateRentViability({ freeCashFlow: stats.freeCashFlow, rentAmount })
    : null

  return {
    debts,
    selectedDebtId, setSelectedDebtId,
    extraPayment, setExtraPayment,
    rentAmount, setRentAmount,
    debtResult,
    rentResult,
  }
}
```

- [ ] **Step 2: Create `src/components/simulator/SimulatorPage.tsx`**

```tsx
import { useSimulator } from '@/hooks/useSimulator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export function SimulatorPage() {
  const {
    debts,
    selectedDebtId, setSelectedDebtId,
    extraPayment, setExtraPayment,
    rentAmount, setRentAmount,
    debtResult,
    rentResult,
  } = useSimulator()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🔮 Simulador</h2>

      {/* Debt payoff simulator */}
      <Card>
        <CardHeader><CardTitle className="text-base">¿Qué pasa si pago extra a una deuda?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Deuda</Label>
              <Select value={selectedDebtId} onValueChange={setSelectedDebtId}>
                <SelectTrigger><SelectValue placeholder="Selecciona una deuda..." /></SelectTrigger>
                <SelectContent>
                  {debts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pago extra mensual ($)</Label>
              <Input type="number" min="0" step="100" value={extraPayment || ''} onChange={e => setExtraPayment(Number(e.target.value))} />
            </div>
          </div>

          {debtResult && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Resultado:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Sin pago extra</span>
                <span>{debtResult.baseMonths === Infinity ? '∞' : `${debtResult.baseMonths} meses`}</span>
                <span className="text-muted-foreground">Con pago extra</span>
                <span className="text-green-600 font-bold">{debtResult.newMonths} meses</span>
                <span className="text-muted-foreground">Meses ahorrados</span>
                <span className="text-green-600 font-bold">{debtResult.monthsSaved}</span>
                <span className="text-muted-foreground">Intereses ahorrados</span>
                <span className="text-green-600 font-bold">${Math.round(debtResult.interestSaved).toLocaleString('es-MX')}</span>
                <span className="text-muted-foreground">Liquidarías en</span>
                <span>{debtResult.newPayoffDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          )}

          {debts.length === 0 && (
            <p className="text-muted-foreground text-sm">Primero registra una deuda en la sección Deudas.</p>
          )}
        </CardContent>
      </Card>

      {/* Rent viability simulator */}
      <Card>
        <CardHeader><CardTitle className="text-base">¿Ya puedo pagar renta?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 max-w-xs">
            <Label>Renta mensual a considerar ($)</Label>
            <Input type="number" min="0" step="100" value={rentAmount || ''} onChange={e => setRentAmount(Number(e.target.value))} />
          </div>

          {rentResult && (
            <div className={`rounded-lg p-4 space-y-2 ${rentResult.viable ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <Badge variant={rentResult.viable ? 'default' : 'destructive'} className="text-sm">
                {rentResult.viable ? '✅ SÍ puedes' : '❌ Todavía no'}
              </Badge>
              {rentResult.viable ? (
                <p className="text-sm">Tu flujo libre cubre la renta. Puedes comenzar cuando quieras.</p>
              ) : (
                <div className="text-sm space-y-1">
                  <p>Necesitas <strong>${rentResult.gap.toLocaleString('es-MX')}</strong> más de flujo libre al mes.</p>
                  {rentResult.readyDate && (
                    <p>Estimado: podrías estar listo en <strong>{rentResult.readyDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</strong></p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/simulator/ src/hooks/useSimulator.ts
git commit -m "feat: simulator — debt extra payment and rent viability"
```

---

## Task 14: Settings Page

**Files:**
- Create: `src/components/settings/SettingsPage.tsx`

- [ ] **Step 1: Create `src/components/settings/SettingsPage.tsx`**

```tsx
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Configuración</h2>
      <Card>
        <CardHeader><CardTitle className="text-base">Cuenta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Button variant="destructive" onClick={signOut}>Cerrar sesión</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/settings/
git commit -m "feat: settings page with account info"
```

---

## Task 15: Final Wiring + Build Check

**Files:**
- Verify: `src/App.tsx` (all imports resolve)
- Run: build + tests

- [ ] **Step 1: Run type check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```
Expected: All tests PASS.

- [ ] **Step 3: Run build**

```bash
npm run build
```
Expected: `dist/` created with no errors.

- [ ] **Step 4: Run dev server and verify manually**

```bash
npm run dev
```
Open http://localhost:5173 — verify:
- Login page renders.
- After login, dashboard shows.
- Sidebar navigates to all 6 sections.
- Add one income, one expense, one debt, one goal.
- Dashboard stat cards update.
- Simulator shows debt result when extra payment is entered.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: final wiring, build verified, all tests pass"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|---|---|
| Dashboard con 6 tarjetas | Task 8 (StatCard × 6) |
| Ingresos con 5 tipos | Tasks 9, 3 (IncomeType enum) |
| Gastos con 9 categorías | Tasks 2 (seed), 10 |
| Deudas con fecha liquidación e intereses | Tasks 11, 4 (calcDebtPayoff) |
| Metas con progreso y ahorro mensual | Tasks 12, 4 (calcGoalMonthlySaving) |
| Simulador pago extra | Task 13 (simulateExtraPayment) |
| Simulador viabilidad de renta | Task 13 (simulateRentViability) |
| Proyecciones 12/24/36 meses | Task 4 (projections.ts — disponible para uso futuro en Simulador) |
| Gráfica últimos 6 meses | Task 8 (MonthlyChart) |
| Login / Auth | Tasks 5 |
| RLS por usuario | Task 2 |
| Sin fórmulas — solo preguntas simples | Todos los forms |
| Configuración | Task 14 |

### Placeholder Scan
No hay TBD, TODO, ni pasos sin código concreto.

### Type Consistency
- `IncomeType` definido en `client.ts`, usado en `incomes.ts` y `IncomeForm.tsx` ✓
- `calcDebtPayoff` firma `(balance, monthlyPayment, monthlyRate)` consistente en `engine.ts`, `DebtCard.tsx`, `simulator.ts` ✓
- `calcGoalMonthlySaving` firma `(targetAmount, currentAmount, targetDate, today?)` consistente en `engine.ts` y `GoalCard.tsx` ✓
