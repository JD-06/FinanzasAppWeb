# 💰 FinanzasApp Web

Aplicación web personal de finanzas para llevar el control de ingresos, gastos, deudas y metas de ahorro. Diseñada con mobile-first y dark mode.

## ✨ Características

- **Dashboard** — resumen de saldos, flujo por periodo, historial gráfico y exportación de informes
- **Ingresos** — registro de nómina con desglose de prestaciones (vales, fondo de ahorro, bono trimestral, prima vacacional) y generación retroactiva de pagos
- **Gastos** — historial con categorías, filtros por periodo y soporte para meses sin intereses (MSI)
- **Ingresos / Gastos programados** — se registran automáticamente el día que vencen al abrir la app
- **Deudas** — seguimiento de saldos con cálculo de fecha estimada de liquidación
- **Metas de ahorro** — progreso visual hacia cada objetivo
- **Simulador** — proyecciones de flujo libre y liquidación de deudas
- **Exportar informes** — descarga CSV (Excel) o PDF filtrado por día, semana, mes, año o todo el historial
- **Responsive** — sidebar en desktop, barra inferior en móvil

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| React 18 + TypeScript | UI |
| Vite | Build tool |
| Tailwind CSS v3 + shadcn/ui | Estilos y componentes |
| Recharts | Gráficas |
| TanStack Query v5 | Data fetching y caché |
| React Router v6 | Navegación |
| Supabase | Base de datos PostgreSQL + Auth |
| Docker + nginx | Despliegue |

## 🚀 Desarrollo local

### Prerequisitos

- Node.js 20+
- Una cuenta en [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/JD-06/FinanzasAppWeb.git
cd FinanzasAppWeb
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Base de datos

Ve al **SQL Editor** de tu proyecto en Supabase y ejecuta los archivos de la carpeta `supabase/migrations/` **en orden**:

#### 001 — Esquema inicial (tablas, RLS)
```sql
-- supabase/migrations/001_initial_schema.sql
create extension if not exists "uuid-ossp";

create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null, icon text not null, color text not null
);

create table incomes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  date date not null, type text not null, notes text,
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) not null,
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  payment_method text not null default 'efectivo',
  notes text, created_at timestamptz default now()
);

create table debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  balance numeric(12,2) not null check (balance >= 0),
  monthly_payment numeric(12,2) not null check (monthly_payment > 0),
  interest_rate numeric(5,4) not null default 0,
  start_date date not null, created_at timestamptz default now()
);

create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  target_date date, created_at timestamptz default now()
);

create table recurring_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  frequency text not null check (frequency in ('monthly','weekly','yearly')),
  next_charge date not null, created_at timestamptz default now()
);

alter table incomes          enable row level security;
alter table expenses         enable row level security;
alter table debts            enable row level security;
alter table goals            enable row level security;
alter table recurring_expenses enable row level security;

create policy "Users see own incomes"    on incomes          for all using (auth.uid() = user_id);
create policy "Users see own expenses"   on expenses         for all using (auth.uid() = user_id);
create policy "Users see own debts"      on debts            for all using (auth.uid() = user_id);
create policy "Users see own goals"      on goals            for all using (auth.uid() = user_id);
create policy "Users see own recurring"  on recurring_expenses for all using (auth.uid() = user_id);
create policy "Anyone reads categories"  on categories       for select using (true);
```

#### 002 — Campos de estado y MSI en gastos
```sql
-- supabase/migrations/002_add_expense_features.sql
alter table expenses
  add column status text not null default 'pagado' check (status in ('pagado', 'pendiente')),
  add column is_msi boolean not null default false,
  add column msi_months integer not null default 0 check (msi_months >= 0);
```

#### 003 — Categorías por defecto
```sql
-- supabase/migrations/003_seed_categories.sql
insert into categories (name, icon, color) values
  ('Alimentación',   '🍔', '#ef4444'),
  ('Transporte',     '🚗', '#3b82f6'),
  ('Vivienda',       '🏠', '#10b981'),
  ('Servicios',      '⚡', '#f59e0b'),
  ('Entretenimiento','🍿', '#8b5cf6'),
  ('Salud',          '💊', '#ec4899'),
  ('Ropa',           '👕', '#6366f1'),
  ('Educación',      '📚', '#14b8a6'),
  ('Otros',          '📦', '#64748b');
```

#### 004 — Ingresos programados
```sql
-- supabase/migrations/004_add_recurring_incomes.sql
create table recurring_incomes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null,
  frequency text not null check (frequency in ('monthly','weekly','yearly')),
  next_date date not null, created_at timestamptz default now()
);

alter table recurring_incomes enable row level security;
create policy "Users see own recurring incomes" on recurring_incomes for all using (auth.uid() = user_id);
```

#### 005 — Eliminar restricciones de tipo en ingresos
```sql
-- supabase/migrations/005_relax_income_types.sql
alter table incomes           drop constraint if exists incomes_type_check;
alter table recurring_incomes drop constraint if exists recurring_incomes_type_check;
```

#### 006 — Método de pago en gastos
```sql
-- supabase/migrations/006_add_payment_methods.sql
alter table expenses           add column if not exists payment_method text default 'efectivo';
alter table recurring_expenses add column if not exists payment_method text default 'efectivo';
```

#### 007 — Categoría en gastos fijos (auto-proceso)
```sql
alter table recurring_expenses
  add column if not exists category_id uuid references categories(id);
```

> También puedes copiar el contenido directamente desde los archivos en `supabase/migrations/`.

### 4. Iniciar

```bash
npm run dev
```

## 🐳 Docker

### Build local

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://tu-proyecto.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=tu-anon-key \
  -t finanzasapp .

docker run -p 8080:80 finanzasapp
```

### Despliegue en Dokploy

1. Conecta el repositorio en Dokploy
2. En **Build Arguments** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Puerto: `80`

> Las variables `VITE_*` se incrustan en el bundle en tiempo de build, no se exponen en el servidor.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Haz un fork del repositorio
2. Crea una rama para tu feature: `git checkout -b feature/mi-feature`
3. Haz commit de tus cambios: `git commit -m 'feat: agregar mi feature'`
4. Push a tu rama: `git push origin feature/mi-feature`
5. Abre un Pull Request

Por favor mantén el mismo stack y estilo de código. Si vas a hacer cambios grandes, abre primero un issue para discutirlo.

## 📄 Licencia

MIT © [JD-06](https://github.com/JD-06) — ver [LICENSE](LICENSE)
