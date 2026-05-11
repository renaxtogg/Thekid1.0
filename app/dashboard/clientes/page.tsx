import { Users, Plus, Download, DollarSign, TrendingUp } from 'lucide-react'
import StatCard from '@/components/StatCard'

const clientes = [
  { id: 1, nombre: 'Agro San Pedro S.A.', ruc: '80012345-1', tipo: 'Flete', telefono: '021 345 678', contacto: 'Ing. Molinas', viajes: 24, facturado: '₲ 28.800.000', deuda: '₲ 0' },
  { id: 2, nombre: 'Distribuidora Norte S.R.L.', ruc: '80023456-2', tipo: 'Flete', telefono: '021 456 789', contacto: 'Sra. Cáceres', viajes: 18, facturado: '₲ 22.400.000', deuda: '₲ 4.200.000' },
  { id: 3, nombre: 'Frigorífico del Este S.A.', ruc: '80034567-3', tipo: 'Ambos', telefono: '061 234 567', contacto: 'Sr. Ramírez', viajes: 15, facturado: '₲ 31.500.000', deuda: '₲ 1.800.000' },
  { id: 4, nombre: 'Cooperativa Caazapá', ruc: '30045678-4', tipo: 'Flete', telefono: '0541 23 456', contacto: 'Presidente', viajes: 9, facturado: '₲ 8.550.000', deuda: '₲ 0' },
  { id: 5, nombre: 'Expo Itapúa S.A.', ruc: '80056789-5', tipo: 'Flete', telefono: '071 345 678', contacto: 'Sr. Bernal', viajes: 12, facturado: '₲ 19.800.000', deuda: '₲ 950.000' },
  { id: 6, nombre: 'Gasolinera El Paso', ruc: '80067890-6', tipo: 'Combustible', telefono: '021 567 890', contacto: 'Dueño', viajes: 0, facturado: '₲ 14.200.000', deuda: '₲ 0' },
]

const tipoColor: Record<string, string> = {
  'Flete': 'bg-blue-100 text-blue-700',
  'Combustible': 'bg-orange-100 text-orange-700',
  'Ambos': 'bg-purple-100 text-purple-700',
}

export default function ClientesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión comercial y cuentas corrientes</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Nuevo cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total clientes" value="18" subtitle="Registrados" icon={Users} color="blue" />
        <StatCard title="Facturado (mes)" value="₲ 48.600.000" subtitle="A todos los clientes" icon={TrendingUp} color="green" />
        <StatCard title="Cuentas por cobrar" value="₲ 6.950.000" subtitle="3 clientes con deuda" icon={DollarSign} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listado de clientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Nombre / Razón social</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">RUC</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Contacto</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Viajes</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Facturado</th>
                <th className="px-5 py-3 font-medium">Deuda</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.ruc}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tipoColor[c.tipo]}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{c.contacto}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">{c.viajes}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-700 hidden xl:table-cell">{c.facturado}</td>
                  <td className="px-5 py-3.5 text-sm font-medium">
                    <span className={c.deuda === '₲ 0' ? 'text-green-600' : 'text-red-600'}>
                      {c.deuda}
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
