import { Receipt, Plus, Download, TrendingDown } from 'lucide-react'
import StatCard from '@/components/StatCard'

const gastos = [
  { id: 1, fecha: '09/05/2025', categoria: 'Combustible', descripcion: 'Carga gasoil ABD 123', camion: 'ABD 123', monto: '₲ 2.624.000', comprobante: 'Ticket #1201' },
  { id: 2, fecha: '08/05/2025', categoria: 'Peaje', descripcion: 'Ruta PY02 — San Pedro', camion: 'ABD 123', monto: '₲ 45.000', comprobante: 'Ticket #1198' },
  { id: 3, fecha: '07/05/2025', categoria: 'Mantenimiento', descripcion: 'Cambio aceite EFG 456', camion: 'EFG 456', monto: '₲ 380.000', comprobante: 'F-0089' },
  { id: 4, fecha: '06/05/2025', categoria: 'Viático', descripcion: 'Alimentación Concepción', camion: 'EFG 456', monto: '₲ 120.000', comprobante: 'Comprobante' },
  { id: 5, fecha: '05/05/2025', categoria: 'Repuesto', descripcion: 'Filtro de aire MNO 321', camion: 'MNO 321', monto: '₲ 95.000', comprobante: 'F-0076' },
  { id: 6, fecha: '03/05/2025', categoria: 'Seguro', descripcion: 'Seguro HIJ 789 — junio', camion: 'HIJ 789', monto: '₲ 680.000', comprobante: 'Póliza #3344' },
  { id: 7, fecha: '01/05/2025', categoria: 'Lavadero', descripcion: 'Lavado de flota completa', camion: 'General', monto: '₲ 350.000', comprobante: 'Recibo #52' },
]

const catColor: Record<string, string> = {
  'Combustible': 'bg-orange-100 text-orange-700',
  'Peaje': 'bg-slate-100 text-slate-600',
  'Mantenimiento': 'bg-blue-100 text-blue-700',
  'Viático': 'bg-purple-100 text-purple-700',
  'Repuesto': 'bg-yellow-100 text-yellow-700',
  'Seguro': 'bg-green-100 text-green-700',
  'Lavadero': 'bg-teal-100 text-teal-700',
}

export default function GastosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Registro y clasificación de egresos operativos</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Nuevo gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Gastos este mes" value="₲ 22.100.000" subtitle="Total egresos" icon={TrendingDown} color="red" />
        <StatCard title="Combustible" value="₲ 14.800.000" subtitle="67% del total" icon={Receipt} color="orange" />
        <StatCard title="Mantenimiento" value="₲ 4.740.000" subtitle="21% del total" icon={Receipt} color="blue" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Últimos gastos registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 font-medium">Descripción</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Camión</th>
                <th className="px-5 py-3 font-medium">Monto</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gastos.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm text-slate-600">{g.fecha}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${catColor[g.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                      {g.categoria}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{g.descripcion}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{g.camion}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{g.monto}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400 hidden lg:table-cell">{g.comprobante}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
