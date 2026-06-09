import type { Income, Expense, Debt, Goal, RecurringIncome, RecurringExpense } from '../supabase/client'
import type { FuturePaymentsResult } from './futurePayments'

export interface ReportData {
  incomes: Income[]
  expenses: Expense[]
  debts: Debt[]
  goals: Goal[]
  recurringIncomes: RecurringIncome[]
  recurringExpenses: RecurringExpense[]
  futurePayments?: FuturePaymentsResult
  periodLabel?: string
}

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Mensual', weekly: 'Semanal', quincenal: 'Quincenal', yearly: 'Anual',
}

function esc(val: unknown): string {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? '"' + s.replace(/"/g, '""') + '"'
    : s
}

function csvRow(...vals: unknown[]): string {
  return vals.map(esc).join(',')
}

export function buildCsv(data: ReportData): string {
  const lines: string[] = []

  lines.push('INGRESOS')
  lines.push(csvRow('Fecha', 'Tipo', 'Monto', 'Notas'))
  data.incomes.forEach(i => lines.push(csvRow(i.date, i.type, i.amount, i.notes ?? '')))
  lines.push('')

  lines.push('GASTOS')
  lines.push(csvRow('Fecha', 'Categoría', 'Monto (cuota)', 'Monto total', 'Método de Pago', 'Estado', 'MSI', 'Notas'))
  data.expenses.forEach(e => {
    const isMsi = e.is_msi && e.msi_months > 1
    const cuota = isMsi ? e.amount / e.msi_months : e.amount
    lines.push(csvRow(e.date, e.categories?.name ?? '', cuota, e.amount, e.payment_method, e.status, isMsi ? `${e.msi_months}m` : '', e.notes ?? ''))
  })
  lines.push('')

  lines.push('DEUDAS')
  lines.push(csvRow('Nombre', 'Saldo', 'Pago Mensual', 'Tasa de Interés (%)'))
  data.debts.forEach(d => lines.push(csvRow(d.name, d.balance, d.monthly_payment, d.interest_rate)))
  lines.push('')

  lines.push('METAS DE AHORRO')
  lines.push(csvRow('Nombre', 'Meta ($)', 'Acumulado ($)', 'Fecha Objetivo'))
  data.goals.forEach(g => lines.push(csvRow(g.name, g.target_amount, g.current_amount, g.target_date ?? '')))
  lines.push('')

  lines.push('INGRESOS PROGRAMADOS')
  lines.push(csvRow('Nombre', 'Monto', 'Frecuencia', 'Próxima Fecha'))
  data.recurringIncomes.forEach(r => lines.push(csvRow(r.name, r.amount, FREQ_LABELS[r.frequency] ?? r.frequency, r.next_date)))
  lines.push('')

  lines.push('GASTOS FIJOS')
  lines.push(csvRow('Nombre', 'Monto', 'Frecuencia', 'Próximo Cobro'))
  data.recurringExpenses.forEach(r => lines.push(csvRow(r.name, r.amount, FREQ_LABELS[r.frequency] ?? r.frequency, r.next_charge)))

  if (data.futurePayments) {
    const fp = data.futurePayments
    const periodLbl = data.periodLabel ?? ''
    lines.push('')
    lines.push(`PAGOS FUTUROS${periodLbl ? ` (${periodLbl})` : ''}`)

    lines.push('GASTOS FUTUROS')
    lines.push(csvRow('Nombre', 'Frecuencia', 'Ocurrencias', 'Monto Unit.', 'Total'))
    fp.expenses.forEach(e =>
      lines.push(csvRow(e.name, FREQ_LABELS[e.frequency] ?? e.frequency, e.occurrences.length, e.amount, e.total))
    )

    lines.push('')
    lines.push('INGRESOS FUTUROS')
    lines.push(csvRow('Nombre', 'Frecuencia', 'Ocurrencias', 'Monto Unit.', 'Total'))
    fp.incomes.forEach(i =>
      lines.push(csvRow(i.name, FREQ_LABELS[i.frequency] ?? i.frequency, i.occurrences.length, i.amount, i.total))
    )
  }

  return lines.join('\n')
}

export function downloadCsv(data: ReportData) {
  const csv = buildCsv(data)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finanzas-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function printReport(data: ReportData) {
  const totalIncome  = data.incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = data.expenses.reduce((s, e) => s + (e.is_msi && e.msi_months > 1 ? e.amount / e.msi_months : e.amount), 0)
  const totalDebt    = data.debts.reduce((s, d) => s + d.balance, 0)
  const totalSavings = data.goals.reduce((s, g) => s + g.current_amount, 0)
  const balance      = totalIncome - totalExpense
  const today        = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

  const tableStyle = `width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;page-break-inside:avoid`
  const thStyle    = `text-align:left;padding:6px 8px;background:#f3f4f6;border-bottom:2px solid #d1d5db`
  const tdStyle    = `padding:5px 8px;border-bottom:1px solid #e5e7eb`

  function table(headers: string[], rows: string[][]): string {
    return `<table style="${tableStyle}">
      <tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr>
      ${rows.map(r => `<tr>${r.map(c => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`).join('')}
    </table>`
  }

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="utf-8">
    <title>Informe Financiero — ${today}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:32px 48px;color:#111;font-size:13px}
      h1{font-size:20px;margin:0}
      .sub{color:#6b7280;font-size:12px;margin-bottom:24px;margin-top:4px}
      h2{font-size:14px;font-weight:bold;border-bottom:2px solid #111;padding-bottom:4px;margin-top:28px;margin-bottom:0}
      .summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
      .stat{background:#f9fafb;padding:10px 14px;border-radius:6px;border:1px solid #e5e7eb;min-width:110px}
      .stat .lbl{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
      .stat .val{font-size:15px;font-weight:700;margin-top:2px}
      .green{color:#16a34a}.red{color:#dc2626}
      @media print{body{margin:16px 24px}h2{break-before:avoid}}
    </style>
  </head><body>
    <h1>Informe Financiero</h1>
    <div class="sub">Generado el ${today}</div>

    <div class="summary">
      <div class="stat"><div class="lbl">Total Ingresos</div><div class="val green">$${fmt(totalIncome)}</div></div>
      <div class="stat"><div class="lbl">Total Gastos</div><div class="val red">$${fmt(totalExpense)}</div></div>
      <div class="stat"><div class="lbl">Balance</div><div class="val ${balance >= 0 ? 'green' : 'red'}">$${fmt(balance)}</div></div>
      <div class="stat"><div class="lbl">Total Deudas</div><div class="val red">$${fmt(totalDebt)}</div></div>
      <div class="stat"><div class="lbl">Ahorros</div><div class="val green">$${fmt(totalSavings)}</div></div>
    </div>

    <h2>Ingresos (${data.incomes.length})</h2>
    ${table(
      ['Fecha', 'Tipo', 'Monto', 'Notas'],
      data.incomes.map(i => [i.date, i.type, `<span class="green">$${fmt(i.amount)}</span>`, i.notes ?? ''])
    )}

    <h2>Gastos (${data.expenses.length})</h2>
    ${table(
      ['Fecha', 'Categoría', 'Monto', 'Método', 'Estado'],
      data.expenses.map(e => {
        const isMsi = e.is_msi && e.msi_months > 1
        const displayAmount = isMsi ? e.amount / e.msi_months : e.amount
        const msiTag = isMsi ? ` <span style="font-size:10px;color:#6b7280">(cuota 1/${e.msi_months} MSI)</span>` : ''
        return [
          e.date,
          `${e.categories?.icon ?? ''} ${e.categories?.name ?? '—'}`,
          `<span class="red">$${fmt(displayAmount)}</span>${msiTag}`,
          e.payment_method,
          e.status,
        ]
      })
    )}

    <h2>Deudas</h2>
    ${table(
      ['Nombre', 'Saldo', 'Pago Mensual', 'Tasa (%)'],
      data.debts.map(d => [d.name, `<span class="red">$${fmt(d.balance)}</span>`, `$${fmt(d.monthly_payment)}`, `${d.interest_rate}%`])
    )}

    <h2>Metas de Ahorro</h2>
    ${table(
      ['Nombre', 'Meta', 'Acumulado', 'Fecha Objetivo'],
      data.goals.map(g => [g.name, `$${fmt(g.target_amount)}`, `<span class="green">$${fmt(g.current_amount)}</span>`, g.target_date ?? '—'])
    )}

    <h2>Ingresos Programados</h2>
    ${table(
      ['Nombre', 'Monto', 'Frecuencia', 'Próxima Fecha'],
      data.recurringIncomes.map(r => [r.name, `<span class="green">$${fmt(r.amount)}</span>`, FREQ_LABELS[r.frequency] ?? r.frequency, r.next_date])
    )}

    <h2>Gastos Fijos</h2>
    ${table(
      ['Nombre', 'Monto', 'Frecuencia', 'Próximo Cobro'],
      data.recurringExpenses.map(r => [r.name, `<span class="red">$${fmt(r.amount)}</span>`, FREQ_LABELS[r.frequency] ?? r.frequency, r.next_charge])
    )}

    ${data.futurePayments ? `
    <h2>Pagos Futuros${data.periodLabel ? ` — ${data.periodLabel}` : ''}</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 12px">
      <div style="background:#f0fdf4;padding:8px 14px;border-radius:6px;border:1px solid #bbf7d0">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase">Ingresos futuros</div>
        <div style="font-size:15px;font-weight:700;color:#16a34a">$${fmt(data.futurePayments.totalIncomes)}</div>
      </div>
      <div style="background:#fef2f2;padding:8px 14px;border-radius:6px;border:1px solid #fecaca">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase">Gastos futuros</div>
        <div style="font-size:15px;font-weight:700;color:#dc2626">$${fmt(data.futurePayments.totalExpenses)}</div>
      </div>
      <div style="background:#f9fafb;padding:8px 14px;border-radius:6px;border:1px solid #e5e7eb">
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase">Flujo neto</div>
        <div style="font-size:15px;font-weight:700;color:${data.futurePayments.totalIncomes - data.futurePayments.totalExpenses >= 0 ? '#16a34a' : '#dc2626'}">$${fmt(data.futurePayments.totalIncomes - data.futurePayments.totalExpenses)}</div>
      </div>
    </div>

    ${data.futurePayments.expenses.length > 0 ? `
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 4px">Gastos programados</div>
    ${table(
      ['Nombre', 'Frecuencia', 'Próximo pago', 'Ocurrencias', 'Monto c/u', 'Total'],
      data.futurePayments.expenses.map(e => [
        e.name,
        FREQ_LABELS[e.frequency] ?? e.frequency,
        e.nextDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
        String(e.occurrences.length),
        `$${fmt(e.amount)}`,
        `<span class="red">$${fmt(e.total)}</span>`,
      ])
    )}` : ''}

    ${data.futurePayments.incomes.length > 0 ? `
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 4px">Ingresos programados</div>
    ${table(
      ['Nombre', 'Frecuencia', 'Próxima fecha', 'Ocurrencias', 'Monto c/u', 'Total'],
      data.futurePayments.incomes.map(i => [
        i.name,
        FREQ_LABELS[i.frequency] ?? i.frequency,
        i.nextDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
        String(i.occurrences.length),
        `$${fmt(i.amount)}`,
        `<span class="green">$${fmt(i.total)}</span>`,
      ])
    )}` : ''}
    ` : ''}

    <script>window.onload = function(){ window.print() }</script>
  </body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
