import { DollarSign, Plus, Download, CheckCircle, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'

const comisiones = [
  { chofer: 'R. Villalba', viajes: 14, monto_flete: '₲ 18.200.000', porcentaje: '8%', comision: '₲ 1.456.000', pagado: '₲ 1.456.000', pendiente: '₲ 0', estado: 'Pagado' },
  { chofer: 'F. Aquino', viajes: 11, monto_flete: '₲ 15.400.000', porcentaje: '8%', comision: '₲ 1.232.000', pagado: '₲ 600.000', pendiente: '₲ 632.000', estado: 'Parcial' },
  { chofer: 'M. Gómez', viajes: 9, monto_flete: '₲ 12.600.000', porcentaje: '7%', comision: '₲ 882.000', pagado: '₲ 0', pendiente: '₲ 882.000', estado: 'Pendiente' },
  { chofer: 'J. Benítez', viajes: 7, monto_flete: '₲ 9.800.000', porcentaje: '8%', comision: '₲ 784.000', pagado: '₲ 784.000', pendiente: '₲ 0', estado: 'Pagado' },
  { chofer: 'C. Martínez', viajes: 6, monto_flete: '₲ 8.400.000', porcentaje: '7.5%', comision: '₲ 630.000', pagado: '₲ 0', pendiente: '₲ 630.000', estado: 'Pendiente' },
]

const estadoColor: Record<string, string> = {
  'Pagado': 'bg-green-100 text-green-700',
  'Parcial': 'bg-yellow-100 text-yellow-700',
  'Pendiente': 'bg-red-100 text-red-700',
}

export default function ComisionesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comisiones</h1>
          <p className="text-slate-500 text-sm mt-0.5">Liquidación y pagos a choferes — mayo 2025</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar liquidación
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Registrar pago
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total comisiones" value="₲ 4.984.000" subtitle="Este mes" icon={DollarSign} color="blue" />
        <StatCard title="Pagado" value="₲ 2.240.000" subtitle="2 choferes liquidados" icon={CheckCircle} color="green" />
        <StatCard title="Pendiente" value="₲ 2.144.000" subtitle="3 choferes sin liquidar" icon={Clock} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Resumen por chofer — mayo 2025</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Chofer</th>
                <th className="px-5 py-3 font-medium">Viajes</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Monto fletes</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">%</th>
                <th className="px-5 py-3 font-medium">Comisión</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Pagado</th>
                <th className="px-5 py-3 font-medium">Pendiente</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comisiones.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.chofer}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{c.viajes}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">{c.monto_flete}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">{c.porcentaje}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.comision}</td>
                  <td className="px-5 py-3.5 text-sm text-green-600 font-medium hidden lg:table-cell">{c.pagado}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-red-600">{c.pendiente}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[c.estado]}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-orange-500 hover:text-orange-700 text-sm font-medium">Liquidar</button>
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
