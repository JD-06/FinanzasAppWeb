import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

// Shared domain types
export type IncomeType = 'Sueldo Base' | 'Vales de despensa' | 'Fondo ahorro empresa' | 'Premio asistencia' | 'Bono trimestral' | 'Prima vacacional' | 'freelance' | 'otro'
export type Frequency = 'monthly' | 'weekly' | 'quincenal' | 'yearly'

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
  status: 'pagado' | 'pendiente'
  is_msi: boolean
  msi_months: number
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

export interface RecurringExpense {
  id: string
  user_id: string
  name: string
  amount: number
  frequency: Frequency
  next_charge: string
  category_id?: string
  created_at: string
}

export interface RecurringIncome {
  id: string
  user_id: string
  name: string
  amount: number
  type: IncomeType
  frequency: Frequency
  next_date: string
  created_at: string
}
