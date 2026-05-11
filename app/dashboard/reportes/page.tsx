import { BarChart2, Download, FileText, TrendingUp, Truck, DollarSign, Fuel, Users } from 'lucide-react'

const reportes = [
  {
    categoria: 'Combustible',
    icon: Fuel,
    color: 'orange',
    items: [
      { titulo: 'Combustible comprado vs. cargado', desc: 'Comparativa de recepciones y consumo por período' },
      { titulo: 'Stock histórico por tanque', desc: 'Evolución del stock de combustible en el tiempo' },
      { titulo: 'Consumo promedio por camión', desc: 'Rendimiento km/L y alertas de consumo anormal' },
    ]
  },
  {
    categoria: 'Viajes y facturación',
    icon: TrendingUp,
    color: 'blue',
    items: [
      { titulo: 'Viajes por chofer y período', desc: 'Cantidad, km recorridos y monto generado por chofer' },
      { titulo: 'Viajes por cliente', desc: 'Historial de servicios y facturación por cliente' },
      { titulo: 'Rentabilidad por viaje o camión', desc: 'Ingresos menos gastos directos asociados' },
    ]
  },
  {
    categoria: 'Choferes y comisiones',
    icon: Users,
    color: 'purple',
    items: [
      { titulo: 'Comisiones pagadas y pendientes', desc: 'Estado de liquidaciones por chofer y período' },
      { titulo: 'Rendimiento por chofer', desc: 'Viajes, km, comisión generada y cobrada' },
    ]
  },
  {
    categoria: 'Flota y gastos',
    icon: Truck,
    color: 'green',
    items: [
      { titulo: 'Gastos por categoría', desc: 'Desglose de combustible, peajes, mantenimiento, etc.' },
      { titulo: 'Gastos por camión', desc: 'Costo total de operación por unidad de la flota' },
      { titulo: 'Historial de mantenimiento', desc: 'Trabajos realizados y costos por camión' },
    ]
  },
]

const colorMap: Record<string, string> = {
  orange: 'bg-orange-100 text-orange-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
}

export default function ReportesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Análisis e informes para la toma de decisiones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportes.map((grupo) => {
          const Icon = grupo.icon
          return (
            <div key={grupo.categoria} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <div className={`p-2 rounded-lg ${colorMap[grupo.color]}`}>
                  <Icon size={18} />
                </div>
                <h2 className="font-semibold text-slate-800">{grupo.categoria}</h2>
              </div>
              <div className="p-4 space-y-3">
                {grupo.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-slate-50 transition group">
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.titulo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <button className="shrink-0 flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 font-medium opacity-0 group-hover:opacity-100 transition">
                      <Download size={13} /> Exportar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-start gap-4">
        <BarChart2 className="text-orange-500 shrink-0 mt-0.5" size={22} />
        <div>
          <p className="font-medium text-orange-800">Reportes personalizados</p>
          <p className="text-orange-600 text-sm mt-1">
            Los reportes personalizados con filtros avanzados y exportación a Excel/PDF estarán disponibles en la próxima versión del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
