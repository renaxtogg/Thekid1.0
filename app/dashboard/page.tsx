import StatCard from '@/components/StatCard'
import {
  Fuel, Truck, MapPin, DollarSign, AlertTriangle,
  TrendingUp, Users, Wrench, CheckCircle, Clock
} from 'lucide-react'

const recentTrips = [
  { id: 1, cliente: 'Agro San Pedro S.A.', origen: 'Asunción', destino: 'San Pedro', chofer: 'R. Villalba', monto: '₲ 1.200.000', estado: 'Completado' },
  { id: 2, cliente: 'Distribuidora Norte', origen: 'Asunción', destino: 'Concepción', chofer: 'F. Aquino', monto: '₲ 2.100.000', estado: 'En ruta' },
  { id: 3, cliente: 'Frigorífico del Este', origen: 'Ciudad del Este', destino: 'Asunción', chofer: 'M. Gómez', monto: '₲ 1.800.000', estado: 'Completado' },
  { id: 4, cliente: 'Cooperativa Caazapá', origen: 'Asunción', destino: 'Caazapá', chofer: 'J. Benítez', monto: '₲ 950.000', estado: 'Pendiente' },
  { id: 5, cliente: 'Expo Itapúa S.A.', origen: 'Encarnación', destino: 'Asunción', chofer: 'R. Villalba', monto: '₲ 1.650.000', estado: 'Completado' },
]

const alerts = [
  { text: 'Licencia de F. Aquino vence en 12 días', type: 'warning' },
  { text: 'Camión ABD-123 requiere service (90.000 km)', type: 'warning' },
  { text: 'Seguro del camión JKL-456 vence el 25/06', type: 'danger' },
  { text: 'Stock de combustible por debajo de 5.000 L', type: 'info' },
]

const statusColor: Record<string, string> = {
  'Completado': 'bg-green-100 text-green-700',
  'En ruta': 'bg-blue-100 text-blue-700',
  'Pendiente': 'bg-yellow-100 text-yellow-700',
}

export default function DashboardPage() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Panel principal</h1>
        <p className="text-slate-500 text-sm mt-0.5">Resumen operativo — mayo 2025</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Stock de combustible"
          value="12.450 L"
          subtitle="Gasoil + Nafta"
          icon={Fuel}
          color="orange"
          trend={{ value: '8%', positive: true }}
        />
        <StatCard
          title="Viajes este mes"
          value="47"
          subtitle="38 completados · 9 activos"
          icon={MapPin}
          color="blue"
          trend={{ value: '12%', positive: true }}
        />
        <StatCard
          title="Comisiones pendientes"
          value="₲ 3.200.000"
          subtitle="4 choferes"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Camiones activos"
          value="8 / 10"
          subtitle="1 en taller · 1 fuera de servicio"
          icon={Truck}
          color="green"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Facturación del mes"
          value="₲ 48.600.000"
          subtitle="Fletes + Combustible"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Gastos del mes"
          value="₲ 22.100.000"
          subtitle="Combustible, peajes, mant."
          icon={Wrench}
          color="red"
        />
        <StatCard
          title="Choferes activos"
          value="9"
          subtitle="1 con licencia por vencer"
          icon={Users}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent trips */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Últimos viajes</h2>
            <a href="/dashboard/viajes" className="text-orange-500 text-sm hover:underline">Ver todos →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Ruta</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Chofer</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{trip.cliente}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                      {trip.origen} → {trip.destino}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{trip.chofer}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{trip.monto}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[trip.estado]}`}>
                        {trip.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="font-semibold text-slate-800">Alertas</h2>
          </div>
          <div className="p-4 space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  alert.type === 'danger' ? 'bg-red-50 text-red-700' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-blue-50 text-blue-700'
                }`}
              >
                {alert.type === 'danger' ? <AlertTriangle size={15} className="shrink-0 mt-0.5" /> :
                 alert.type === 'warning' ? <Clock size={15} className="shrink-0 mt-0.5" /> :
                 <CheckCircle size={15} className="shrink-0 mt-0.5" />}
                {alert.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
