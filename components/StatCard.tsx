import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'orange' | 'blue' | 'green' | 'red' | 'purple'
  trend?: { value: string; positive: boolean }
}

const colorMap = {
  orange: { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
  blue:   { bg: 'bg-blue-100',   icon: 'text-blue-600',   border: 'border-blue-200' },
  green:  { bg: 'bg-green-100',  icon: 'text-green-600',  border: 'border-green-200' },
  red:    { bg: 'bg-red-100',    icon: 'text-red-600',    border: 'border-red-200' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`${colors.bg} p-3 rounded-lg shrink-0`}>
        <Icon size={22} className={colors.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
        {subtitle && (
          <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1.5 font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value} vs mes anterior
          </p>
        )}
      </div>
    </div>
  )
}
