import { UserCheck, Plus, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'

const choferes = [
  { id: 1, nombre: 'Roberto Villalba', ci: '3.456.789', telefono: '0981 234 567', camion: 'ABD 123', licencia: 'Professional', vencLicencia: '15/03/2026', comision: '8%', estado: 'Activo' },
  { id: 2, nombre: 'Fernando Aquino', ci: '4.123.456', telefono: '0991 345 678', camion: 'EFG 456', licencia: 'Professional', vencLicencia: '22/05/2025', comision: '8%', estado: 'Vence pronto' },
  { id: 3, nombre: 'Miguel Gómez', ci: '2.987.654', telefono: '0985 456 789', camion: 'HIJ 789', licencia: 'Professional', vencLicencia: '10/11/2025', comision: '7%', estado: 'Activo' },
  { id: 4, nombre: 'Jorge Benítez', ci: '5.234.567', telefono: '0972 567 890', camion: 'JKL 456', licencia: 'Professional', vencLicencia: '30/08/2025', comision: '8%', estado: 'Activo' },
  { id: 5, nombre: 'Carlos Martínez', ci: '3.876.543', telefono: '0981 678 901', camion: 'MNO 321', licencia: 'Professional', vencLicencia: '14/02/2026', comision: '7.5%', estado: 'Activo' },
  { id: 6, nombre: 'Luis Paredes', ci: '4.567.890', telefono: '0991 789 012', camion: '-', licencia: 'Professional', vencLicencia: '05/07/2025', comision: '8%', estado: 'Sin camión' },
]

const estadoColor: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-700',
  'Vence pronto': 'bg-yellow-100 text-yellow-700',
  'Sin camión': 'bg-slate-100 text-slate-600',
}

export default function ChoferesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Choferes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de conductores y licencias</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition">
            <Download size={15} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Nuevo chofer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total choferes" value="9" subtitle="Registrados en el sistema" icon={UserCheck} color="blue" />
        <StatCard title="Activos" value="8" subtitle="Con camión asignado" icon={CheckCircle} color="green" />
        <StatCard title="Licencias por vencer" value="2" subtitle="En los próximos 30 días" icon={AlertTriangle} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listado de choferes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">CI</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Teléfono</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Camión</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Venc. Licencia</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Comisión</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {choferes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.ci}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.telefono}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-700 hidden lg:table-cell">{c.camion}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden xl:table-cell">{c.vencLicencia}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-700 hidden xl:table-cell">{c.comision}</td>
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
