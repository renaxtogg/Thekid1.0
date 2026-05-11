'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, CheckCircle, Clock, Loader2, Filter } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Comision {
  id: string
  viaje_id: string | null
  chofer_id: string | null
  monto: number
  estado: 'pendiente' | 'parcial' | 'pagado'
  fecha_pago: string | null
  observaciones: string | null
  created_at: string
  choferes: { nombre: string } | null
  viajes: {
    fecha: string
    origen: string
    destino: string
    precio_flete: number
    clientes: { nombre: string } | null
    camiones: { chapa: string } | null
  } | null
}

const estadoColorMap: Record<string, string> = {
  pendiente: 'bg-red-100 text-red-700',
  parcial: 'bg-yellow-100 text-yellow-700',
  pagado: 'bg-green-100 text-green-700',
}

const estadoLabelMap: Record<string, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
}

const supabase = createClient()

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'pagado'>('todos')
  const [filtroChofer, setFiltroChofer] = useState('')

  const loadComisiones = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('comisiones')
      .select(`
        *,
        choferes(nombre),
        viajes(fecha, origen, destino, precio_flete, clientes(nombre), camiones(chapa))
      `)
      .order('created_at', { ascending: false })
    if (data) setComisiones(data as Comision[])
    setLoading(false)
  }, [])

  useEffect(() => { loadComisiones() }, [loadComisiones])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleMarcarPagada(id: string) {
    setActionLoading(true)
    const { error } = await supabase
      .from('comisiones')
      .update({ estado: 'pagado', fecha_pago: new Date().toISOString().slice(0, 10) })
      .eq('id', id)
    if (error) showToast('Error: ' + error.message, 'error')
    else { showToast('Comisión marcada como pagada'); loadComisiones() }
    setConfirmId(null)
    setActionLoading(false)
  }

  const pendienteTotal = comisiones
    .filter(c => c.estado === 'pendiente' || c.estado === 'parcial')
    .reduce((s, c) => s + c.monto, 0)
  const pagadoTotal = comisiones
    .filter(c => c.estado === 'pagado')
    .reduce((s, c) => s + c.monto, 0)
  const totalGeneral = comisiones.reduce((s, c) => s + c.monto, 0)

  const choferesList = [...new Set(comisiones.map(c => c.choferes?.nombre).filter(Boolean))] as string[]

  const filtered = comisiones.filter(c => {
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false
    if (filtroChofer && c.choferes?.nombre !== filtroChofer) return false
    return true
  })

  const confirmComision = comisiones.find(c => c.id === confirmId)

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comisiones</h1>
          <p className="text-slate-500 text-sm mt-0.5">Liquidación y pagos a choferes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total generado"
          value={totalGeneral.toLocaleString('es-PY', { maximumFractionDigits: 0 })}
          subtitle="Todas las comisiones"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Pagado"
          value={pagadoTotal.toLocaleString('es-PY', { maximumFractionDigits: 0 })}
          subtitle="Comisiones liquidadas"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pendiente"
          value={pendienteTotal.toLocaleString('es-PY', { maximumFractionDigits: 0 })}
          subtitle="Por pagar"
          icon={Clock}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 px-5 py-3 flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-slate-400" />
        <span className="text-sm text-slate-500 font-medium">Filtros:</span>
        <div className="flex gap-1">
          {(['todos', 'pendiente', 'pagado'] as const).map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroEstado === e ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {e === 'todos' ? 'Todos' : e === 'pendiente' ? 'Pendientes' : 'Pagadas'}
            </button>
          ))}
        </div>
        {choferesList.length > 0 && (
          <select
            value={filtroChofer}
            onChange={e => setFiltroChofer(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">Todos los choferes</option>
            {choferesList.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Listado de comisiones</h2>
          <span className="text-xs text-slate-400">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay comisiones con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Chofer</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Viaje</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Cliente</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Flete</th>
                  <th className="px-5 py-3 font-medium">Comisión</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Fecha generada</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Fecha pago</th>
                  <th className="px-5 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.choferes?.nombre || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                      {c.viajes ? `${c.viajes.origen} → ${c.viajes.destino}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {c.viajes?.clientes?.nombre || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">
                      {c.viajes ? Number(c.viajes.precio_flete).toLocaleString('es-PY', { maximumFractionDigits: 0 }) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                      {Number(c.monto).toLocaleString('es-PY', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColorMap[c.estado]}`}>
                        {estadoLabelMap[c.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {new Date(c.created_at).toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {c.fecha_pago ? new Date(c.fecha_pago + 'T00:00:00').toLocaleDateString('es-PY') : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.estado !== 'pagado' ? (
                        <button
                          onClick={() => setConfirmId(c.id)}
                          className="text-xs px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full font-medium transition"
                        >
                          Marcar pagada
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Liquidada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmId && confirmComision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Marcar comisión como pagada</h3>
            <p className="text-sm text-slate-600 mb-1">
              ¿Confirmar el pago de la comisión de <strong>{confirmComision.choferes?.nombre}</strong>?
            </p>
            <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-2">
              Monto: {Number(confirmComision.monto).toLocaleString('es-PY', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">Se registrará la fecha de hoy como fecha de pago.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleMarcarPagada(confirmId)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
