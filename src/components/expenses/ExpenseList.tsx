import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type ListPeriod, LIST_PERIOD_LABELS,
  filterByListPeriod, navigatePeriod, periodRangeLabel, isRefInFuture,
} from '@/lib/finance/listFilter'

export function ExpenseList() {
  const { data: expenses = [], categories, remove } = useExpenses()
  const [tab, setTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [listPeriod, setListPeriod] = useState<ListPeriod>('month')
  const [refDate, setRefDate] = useState(() => new Date())

  const filtered = useMemo(() => {
    const byPeriod = filterByListPeriod(expenses, listPeriod, refDate)
    return byPeriod.filter(e => {
      if (categoryFilter !== 'all' && e.category_id !== categoryFilter) return false
      if (tab === 'paid' && e.status !== 'pagado') return false
      if (tab === 'pending' && e.status !== 'pendiente') return false
      if (tab === 'msi' && !e.is_msi) return false
      return true
    })
  }, [expenses, tab, categoryFilter, listPeriod, refDate])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* Botones de periodo + navegador */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LIST_PERIOD_LABELS) as ListPeriod[]).map(p => (
              <Button
                key={p}
                variant={listPeriod === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setListPeriod(p)}
              >
                {LIST_PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>

          {listPeriod !== 'all' && (
            <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none"
                onClick={() => setRefDate(d => navigatePeriod(d, listPeriod, -1))}>‹</Button>
              <span className="px-2 text-xs font-medium text-center min-w-[110px]">
                {periodRangeLabel(listPeriod, refDate)}
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none"
                disabled={isRefInFuture(listPeriod, refDate)}
                onClick={() => setRefDate(d => navigatePeriod(d, listPeriod, 1))}>›</Button>
            </div>
          )}
        </div>

        {/* Filtros secundarios */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="paid">Pagados</TabsTrigger>
              <TabsTrigger value="pending">Próximos</TabsTrigger>
              <TabsTrigger value="msi">A Meses</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vista móvil — tarjetas */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No hay gastos para este filtro.</p>
        ) : (
          filtered.map(e => (
            <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3 bg-card">
              <span className="text-2xl shrink-0">{e.categories?.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-semibold">${e.amount.toLocaleString('es-MX')}</span>
                  <Badge variant={e.status === 'pagado' ? 'default' : 'destructive'} className="text-[10px]">
                    {e.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                  {e.is_msi && <Badge variant="outline" className="text-[10px]">{e.msi_months} MSI</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {e.categories?.name} · {e.date} · {e.payment_method}
                </p>
                {e.notes && <p className="text-xs text-muted-foreground truncate">{e.notes}</p>}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive shrink-0" onClick={() => remove.mutate(e.id)}>✕</Button>
            </div>
          ))
        )}
      </div>

      {/* Vista desktop — tabla */}
      <div className="hidden md:block rounded-md border overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Concepto</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay gastos para este filtro.</td>
              </tr>
            ) : (
              filtered.map(e => (
                <tr key={e.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{e.categories?.icon}</span>
                      <span>{e.categories?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{e.notes || '---'}</span>
                    <div className="text-xs text-muted-foreground">{e.payment_method}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">${e.amount.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={e.status === 'pagado' ? 'default' : 'destructive'} className="whitespace-nowrap">
                        {e.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                      {e.is_msi && <Badge variant="outline" className="text-xs whitespace-nowrap">{e.msi_months} MSI</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(e.id)} className="text-destructive hover:bg-destructive/10">✕</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
