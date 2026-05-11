import { Droplets, Plus, Download, TrendingUp } from 'lucide-react'
import StatCard from '@/components/StatCard'

const cargas = [
  { id: 1, fecha: '09/05/2025', camion: 'ABD 123', chofer: 'R. Villalba', litros: '320 L', tipo: 'Gasoil', km_actual: '89.450', km_anterior: '89.130', rendimiento: '0.97 km/L', viaje: 'San Pedro', responsable: 'G. Ledesma' },
  { id: 2, fecha: '09/05/2025', camion: 'EFG 456', chofer: 'F. Aquino', litros: '480 L', tipo: 'Gasoil', km_actual: '62.100', km_anterior: '61.620', rendimiento: '1.00 km/L', viaje: 'Concepción', responsable: 'G. Ledesma' },
  { id: 3, fecha: '08/05/2025', camion: 'HIJ 789', chofer: 'M. Gómez', litros: '340 L', tipo: 'Gasoil', km_actual: '74.320', km_anterior: '73.990', rendimiento: '0.97 km/L', viaje: 'Ciudad del Este', responsable: 'G. Ledesma' },
  { id: 4, fecha: '07/05/2025', camion: 'JKL 456', chofer: 'J. Benítez', litros: '220 L', tipo: 'Gasoil', km_actual: '112.800', km_anterior: '112.580', rendimiento: '1.00 km/L', viaje: 'Caazapá', responsable: 'G. Ledesma' },
  { id: 5, fecha: '07/05/2025', camion: 'MNO 321', chofer: 'C. Martínez', litros: '400 L', tipo: 'Gasoil', km_actual: '41.650', km_anterior: '41.250', rendimiento: '1.00 km/L', viaje: 'Horqueta', responsable: 'G. Ledesma' },
]

export default function CargasPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cargas de Combustible</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de consumo por camión y viaje</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Registrar carga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Cargado este mes" value="18.550 L" subtitle="A camiones de la flota" icon={Droplets} color="orange" />
        <StatCard title="Costo en combustible" value="₲ 151.910.000" subtitle="Este mes" icon={TrendingUp} color="red" />
        <StatCard title="Rendimiento promedio" icon={TrendingUp} value="0.99 km/L" subtitle="Flota completa" color="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Registro de cargas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Camión</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Chofer</th>
                <th className="px-5 py-3 font-medium">Litros</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Km actual</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Rendimiento</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Viaje</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargas.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm text-slate-600">{c.fecha}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{c.camion}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">{c.chofer}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-orange-600">{c.litros}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">{c.km_actual} km</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-green-600 hidden lg:table-cell">{c.rendimiento}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">{c.viaje}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">{c.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
