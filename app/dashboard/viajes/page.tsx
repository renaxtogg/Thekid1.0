import { MapPin, Plus, Download, CheckCircle, Clock, DollarSign } from 'lucide-react'
import StatCard from '@/components/StatCard'

const viajes = [
  { id: 1, fecha: '09/05/2025', cliente: 'Agro San Pedro S.A.', origen: 'Asunción', destino: 'San Pedro', chofer: 'R. Villalba', camion: 'ABD 123', km: '320 km', precio: '₲ 1.200.000', estado: 'Completado' },
  { id: 2, fecha: '09/05/2025', cliente: 'Distribuidora Norte', origen: 'Asunción', destino: 'Concepción', chofer: 'F. Aquino', camion: 'EFG 456', km: '510 km', precio: '₲ 2.100.000', estado: 'En ruta' },
  { id: 3, fecha: '08/05/2025', cliente: 'Frigorífico del Este', origen: 'Ciudad del Este', destino: 'Asunción', chofer: 'M. Gómez', camion: 'HIJ 789', km: '330 km', precio: '₲ 1.800.000', estado: 'Completado' },
  { id: 4, fecha: '07/05/2025', cliente: 'Cooperativa Caazapá', origen: 'Asunción', destino: 'Caazapá', chofer: 'J. Benítez', camion: 'JKL 456', km: '220 km', precio: '₲ 950.000', estado: 'Pendiente' },
  { id: 5, fecha: '07/05/2025', cliente: 'Expo Itapúa S.A.', origen: 'Encarnación', destino: 'Asunción', chofer: 'R. Villalba', camion: 'ABD 123', km: '370 km', precio: '₲ 1.650.000', estado: 'Completado' },
  { id: 6, fecha: '06/05/2025', cliente: 'Soja del Norte S.R.L.', origen: 'Asunción', destino: 'Horqueta', chofer: 'C. Martínez', camion: 'MNO 321', km: '450 km', precio: '₲ 1.950.000', estado: 'Completado' },
]

const estadoColor: Record<string, string> = {
  'Completado': 'bg-green-100 text-green-700',
  'En ruta': 'bg-blue-100 text-blue-700',
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

export default function ViajesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Viajes / Fletes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Registro de servicios de transporte</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Nuevo viaje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Viajes este mes" value="47" subtitle="38 completados · 9 activos" icon={MapPin} color="blue" />
        <StatCard title="Facturado" value="₲ 48.600.000" subtitle="Este mes" icon={DollarSign} color="green" />
        <StatCard title="En curso" value="3" subtitle="Viajes activos ahora" icon={Clock} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Registro de viajes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Ruta</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Chofer / Camión</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Km</th>
                <th className="px-5 py-3 font-medium">Precio</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viajes.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm text-slate-600">{v.fecha}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{v.cliente}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                    {v.origen} → {v.destino}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">
                    {v.chofer} · {v.camion}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">{v.km}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{v.precio}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[v.estado]}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-orange-500 hover:text-orange-700 text-sm font-medium">Ver</button>
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
