import { Disc, Plus, Download, AlertTriangle } from 'lucide-react'
import StatCard from '@/components/StatCard'

const cubiertas = [
  { id: 1, camion: 'ABD 123', posicion: 'Delantera izq.', marca: 'Bridgestone', medida: '295/80 R22.5', km_inst: '75.000', km_actual: '89.450', recorrido: '14.450 km', estado: 'Buena', costo: '₲ 980.000' },
  { id: 2, camion: 'ABD 123', posicion: 'Delantera der.', marca: 'Bridgestone', medida: '295/80 R22.5', km_inst: '75.000', km_actual: '89.450', recorrido: '14.450 km', estado: 'Buena', costo: '₲ 980.000' },
  { id: 3, camion: 'EFG 456', posicion: 'Tracción izq.', marca: 'Michelin', medida: '295/80 R22.5', km_inst: '50.000', km_actual: '62.100', recorrido: '12.100 km', estado: 'Buena', costo: '₲ 1.100.000' },
  { id: 4, camion: 'JKL 456', posicion: 'Delantera izq.', marca: 'Pirelli', medida: '315/80 R22.5', km_inst: '70.000', km_actual: '112.800', recorrido: '42.800 km', estado: 'Regular', costo: '₲ 1.050.000' },
  { id: 5, camion: 'JKL 456', posicion: 'Tracción der.', marca: 'Pirelli', medida: '315/80 R22.5', km_inst: '70.000', km_actual: '112.800', recorrido: '42.800 km', estado: 'Para cambiar', costo: '₲ 1.050.000' },
  { id: 6, camion: 'HIJ 789', posicion: 'Delantera izq.', marca: 'Goodyear', medida: '295/80 R22.5', km_inst: '60.000', km_actual: '74.320', recorrido: '14.320 km', estado: 'Buena', costo: '₲ 990.000' },
]

const estadoColor: Record<string, string> = {
  'Buena': 'bg-green-100 text-green-700',
  'Regular': 'bg-yellow-100 text-yellow-700',
  'Para cambiar': 'bg-red-100 text-red-700',
}

export default function CubiertasPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cubiertas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de neumáticos por camión y posición</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Registrar cubierta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total cubiertas" value="48" subtitle="En toda la flota" icon={Disc} color="blue" />
        <StatCard title="Para cambiar" value="3" subtitle="Desgaste crítico" icon={AlertTriangle} color="red" />
        <StatCard title="Gasto este año" value="₲ 24.800.000" subtitle="En cubiertas" icon={Disc} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Registro de cubiertas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Camión</th>
                <th className="px-5 py-3 font-medium">Posición</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Marca</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Medida</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Km instalación</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Recorrido</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Costo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cubiertas.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{c.camion}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{c.posicion}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 hidden md:table-cell">{c.marca}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{c.medida}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{c.km_inst} km</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden xl:table-cell">{c.recorrido}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden xl:table-cell">{c.costo}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[c.estado]}`}>
                      {c.estado}
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
