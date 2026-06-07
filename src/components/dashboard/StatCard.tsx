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
        <p className={cn('text-2xl sm:text-3xl font-bold break-all', colorMap[color])}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
