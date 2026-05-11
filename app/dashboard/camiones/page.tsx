import { Truck, Plus, Download, Wrench, AlertTriangle, CheckCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'

const camiones = [
  { id: 1, chapa: 'ABD 123', marca: 'Mercedes-Benz', modelo: 'Atego 1725', anio: 2019, km: '89.450 km', chofer: 'R. Villalba', estado: 'Activo', vencimientos: { seguro: '15/08/2025', itv: '20/07/2025' } },
  { id: 2, chapa: 'EFG 456', marca: 'Scania', modelo: 'R 420', anio: 2021, km: '62.100 km', chofer: 'F. Aquino', estado: 'Activo', vencimientos: { seguro: '10/09/2025', itv: '05/10/2025' } },
  { id: 3, chapa: 'HIJ 789', marca: 'Volvo', modelo: 'FH 440', anio: 2020, km: '74.320 km', chofer: 'M. Gómez', estado: 'Activo', vencimientos: { seguro: '01/07/2025', itv: '15/08/2025' } },
  { id: 4, chapa: 'JKL 456', marca: 'Mercedes-Benz', modelo: 'Actros 1848', anio: 2018, km: '112.800 km', chofer: 'J. Benítez', estado: 'Activo', vencimientos: { seguro: '25/06/2025', itv: '30/06/2025' } },
  { id: 5, chapa: 'MNO 321', marca: 'Iveco', modelo: 'Stralis 490', anio: 2022, km: '41.650 km', chofer: 'C. Martínez', estado: 'Activo', vencimientos: { seguro: '20/11/2025', itv: '25/11/2025' } },
  { id: 6, chapa: 'PQR 654', marca: 'Scania', modelo: 'G 360', anio: 2017, km: '148.200 km', chofer: '-', estado: 'Taller', vencimientos: { seguro: '30/07/2025', itv: '10/08/2025' } },
  { id: 7, chapa: 'STU 987', marca: 'Volvo', modelo: 'FM 370', anio: 2016, km: '198.400 km', chofer: '-', estado: 'Fuera de servicio', vencimientos: { seguro: '01/03/2025', itv: '15/01/2025' } },
]

const estadoColor: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Taller': 'bg-yellow-100 text-yellow-700',
  'Fuera de servicio': 'bg-red-100 text-red-700',
}

export default function CamionesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Camiones / Flota</h1>
          <p className="text-slate-500 text-sm mt-0.5">Administración y estado de la flota</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Nuevo camión
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total flota" value="10" subtitle="Camiones registrados" icon={Truck} color="blue" />
        <StatCard title="Activos" value="8" subtitle="En operación" icon={CheckCircle} color="green" />
        <StatCard title="En taller" value="1" subtitle="En reparación" icon={Wrench} color="orange" />
        <StatCard title="Fuera de servicio" value="1" subtitle="Sin operación" icon={AlertTriangle} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listado de camiones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Chapa</th>
                <th className="px-5 py-3 font-medium">Vehículo</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Año</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Kilometraje</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Chofer</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Seg. / ITV</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {camiones.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{c.chapa}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{c.marca} {c.modelo}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.anio}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">{c.km}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden xl:table-cell">{c.chofer}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 hidden xl:table-cell">
                    <div>Seg: {c.vencimientos.seguro}</div>
                    <div>ITV: {c.vencimientos.itv}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[c.estado]}`}>
                      {c.estado}
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
