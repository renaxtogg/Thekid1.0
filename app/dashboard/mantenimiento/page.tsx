import { Wrench, Plus, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'

const mantenimientos = [
  { id: 1, fecha: '06/05/2025', camion: 'ABD 123', tipo: 'Cambio de aceite + filtros', taller: 'Taller Roque', km: '89.000', costo: '₲ 380.000', proximo: '99.000 km', estado: 'Realizado' },
  { id: 2, fecha: '02/05/2025', camion: 'PQR 654', tipo: 'Reparación frenos', taller: 'Mecánica Central', km: '148.100', costo: '₲ 1.250.000', proximo: '-', estado: 'En proceso' },
  { id: 3, fecha: '28/04/2025', camion: 'HIJ 789', tipo: 'Cambio de batería', taller: 'Taller Roque', km: '73.800', costo: '₲ 420.000', proximo: '-', estado: 'Realizado' },
  { id: 4, fecha: '20/04/2025', camion: 'EFG 456', tipo: 'Service general', taller: 'Concesionaria Scania', km: '61.000', costo: '₲ 890.000', proximo: '71.000 km', estado: 'Realizado' },
  { id: 5, fecha: '15/04/2025', camion: 'MNO 321', tipo: 'Cambio de embrague', taller: 'Mecánica Central', km: '41.000', costo: '₲ 1.800.000', proximo: '-', estado: 'Realizado' },
]

const estadoColor: Record<string, string> = {
  'Realizado': 'bg-green-100 text-green-700',
  'En proceso': 'bg-blue-100 text-blue-700',
  'Pendiente': 'bg-yellow-100 text-yellow-700',
}

export default function MantenimientoPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Flota</h1>
          <p className="text-slate-500 text-sm mt-0.5">Historial de trabajos y alertas preventivas</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Registrar mantenimiento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Este mes" value="₲ 4.740.000" subtitle="Gasto total mantenimiento" icon={Wrench} color="orange" />
        <StatCard title="Próximos services" value="2" subtitle="En los próximos 10.000 km" icon={AlertTriangle} color="red" />
        <StatCard title="Trabajos realizados" value="12" subtitle="En los últimos 90 días" icon={CheckCircle} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Historial de mantenimiento</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Camión</th>
                <th className="px-5 py-3 font-medium">Trabajo</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Taller</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Km</th>
                <th className="px-5 py-3 font-medium">Costo</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Próximo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mantenimientos.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm text-slate-600">{m.fecha}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{m.camion}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{m.tipo}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{m.taller}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{m.km} km</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{m.costo}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">{m.proximo}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[m.estado]}`}>
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
