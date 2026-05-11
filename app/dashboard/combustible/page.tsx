import { Fuel, Plus, Download, Filter, TrendingUp, TrendingDown, Package } from 'lucide-react'
import StatCard from '@/components/StatCard'

const recepciones = [
  { id: 1, fecha: '08/05/2025', proveedor: 'Petróleos del Sur', tipo: 'Gasoil', litros: '8.000 L', precio: '₲ 8.200/L', total: '₲ 65.600.000', factura: 'F-00123', estado: 'Recibido' },
  { id: 2, fecha: '05/05/2025', proveedor: 'Copetrol S.A.', tipo: 'Gasoil', litros: '5.000 L', precio: '₲ 8.150/L', total: '₲ 40.750.000', factura: 'F-00119', estado: 'Recibido' },
  { id: 3, fecha: '01/05/2025', proveedor: 'Petróleos del Sur', tipo: 'Nafta común', litros: '2.000 L', precio: '₲ 7.400/L', total: '₲ 14.800.000', factura: 'F-00115', estado: 'Recibido' },
  { id: 4, fecha: '28/04/2025', proveedor: 'Petropar', tipo: 'Gasoil', litros: '10.000 L', precio: '₲ 8.050/L', total: '₲ 80.500.000', factura: 'F-00108', estado: 'Recibido' },
  { id: 5, fecha: '20/04/2025', proveedor: 'Copetrol S.A.', tipo: 'Gasoil', litros: '6.000 L', precio: '₲ 8.100/L', total: '₲ 48.600.000', factura: 'F-00102', estado: 'Recibido' },
]

export default function CombustiblePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Combustible</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de recepciones, stock y movimientos</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Nueva recepción
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Stock actual" value="12.450 L" subtitle="Gasoil + Nafta" icon={Package} color="orange" />
        <StatCard title="Comprado este mes" value="31.000 L" subtitle="₲ 249.450.000" icon={TrendingUp} color="blue" />
        <StatCard title="Cargado a camiones" value="18.550 L" subtitle="Este mes" icon={TrendingDown} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recepciones de combustible</h2>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <Filter size={14} /> Filtrar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Litros</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Precio/L</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Factura</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recepciones.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm text-slate-600">{r.fecha}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.proveedor}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{r.tipo}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.litros}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">{r.precio}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.total}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{r.factura}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {r.estado}
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
