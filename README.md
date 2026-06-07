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

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase para habilitar el auto-proceso de gastos fijos:

```sql
ALTER TABLE recurring_expenses
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);
```

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
