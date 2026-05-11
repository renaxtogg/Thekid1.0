import { Settings, User, Shield, CheckCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'

const usuarios = [
  { nombre: 'Giuliano Ledesma', email: 'giulianoledesma@gmail.com', rol: 'Administrador', ultimoAcceso: 'Hoy, 09:14', activo: true },
  { nombre: 'Renato Mancuello', email: 'renatomancuello@gmail.com', rol: 'Administrador', ultimoAcceso: 'Hoy, 08:32', activo: true },
  { nombre: 'Rodrigo TheKid', email: 'rodrithekid@gmail.com', rol: 'Administrador', ultimoAcceso: 'Ayer, 17:45', activo: true },
]

const roleColor: Record<string, string> = {
  'Administrador': 'bg-purple-100 text-purple-700',
  'Dueño': 'bg-blue-100 text-blue-700',
  'Enc. Combustible': 'bg-orange-100 text-orange-700',
  'Enc. Flota': 'bg-green-100 text-green-700',
  'Chofer': 'bg-slate-100 text-slate-600',
}

export default function UsuariosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios y Permisos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de acceso al sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Usuarios activos" value="3" subtitle="Con acceso al sistema" icon={User} color="blue" />
        <StatCard title="Administradores" value="3" subtitle="Acceso completo" icon={Shield} color="purple" />
        <StatCard title="Último ingreso" value="Hoy" subtitle="09:14 hs" icon={CheckCircle} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Usuarios del sistema</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Último acceso</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                        <User size={15} className="text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-800">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColor[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{u.ultimoAcceso}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
        <Settings className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-blue-800">Roles y permisos diferenciados</p>
          <p className="text-blue-600 text-sm mt-1">
            La gestión de roles diferenciados (Dueño, Encargado de combustible, Encargado de flota, Chofer)
            estará disponible en la próxima versión del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
