'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Plus, DollarSign, Clock, CheckCircle, X, Pencil, Loader2, AlertTriangle } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Chofer { id: string; nombre: string; porcentaje_comision: number | null; activo: boolean }
interface Camion { id: string; chapa: string; marca: string; modelo: string; estado: string }
interface Cliente { id: string; nombre: string; activo: boolean }

interface Viaje {
  id: string
  fecha: string
  cliente_id: string | null
  chofer_id: string | null
  camion_id: string | null
  origen: string
  destino: string
  tipo_carga: string | null
  km: number | null
  precio_flete: number
  estado: 'pendiente' | 'en_ruta' | 'completado' | 'cancelado'
  observaciones: string | null
  created_at: string
  clientes: { nombre: string } | null
  choferes: { nombre: string; porcentaje_comision: number | null } | null
  camiones: { chapa: string } | null
}

const estadoColorMap: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  en_ruta: 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

const estadoLabelMap: Record<string, string> = {
  pendiente: 'Pendiente',
  en_ruta: 'En ruta',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const EMPTY_FORM = {
  fecha: new Date().toISOString().slice(0, 10),
  cliente_id: '',
  chofer_id: '',
  camion_id: '',
  origen: '',
  destino: '',
  tipo_carga: '',
  km: '',
  precio_flete: '',
  estado: 'pendiente' as Viaje['estado'],
  observaciones: '',
}

const supabase = createClient()

export default function ViajesPage() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'completar' | 'cancelar' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [vRes, chRes, caRes, clRes] = await Promise.all([
      supabase.from('viajes').select('*, clientes(nombre), choferes(nombre, porcentaje_comision), camiones(chapa)').order('created_at', { ascending: false }),
      supabase.from('choferes').select('id, nombre, porcentaje_comision, activo').eq('activo', true).order('nombre'),
      supabase.from('camiones').select('id, chapa, marca, modelo, estado').order('chapa'),
      supabase.from('clientes').select('id, nombre, activo').eq('activo', true).order('nombre'),
    ])
    if (vRes.data) setViajes(vRes.data as Viaje[])
    if (chRes.data) setChoferes(chRes.data)
    if (caRes.data) setCamiones(caRes.data)
    if (clRes.data) setClientes(clRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, fecha: new Date().toISOString().slice(0, 10) })
    setErrors({})
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(v: Viaje) {
    setForm({
      fecha: v.fecha,
      cliente_id: v.cliente_id || '',
      chofer_id: v.chofer_id || '',
      camion_id: v.camion_id || '',
      origen: v.origen,
      destino: v.destino,
      tipo_carga: v.tipo_carga || '',
      km: v.km ? String(v.km) : '',
      precio_flete: String(v.precio_flete),
      estado: v.estado,
      observaciones: v.observaciones || '',
    })
    setErrors({})
    setEditingId(v.id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.chofer_id) e.chofer_id = 'El chofer es obligatorio'
    if (!form.camion_id) e.camion_id = 'El camión es obligatorio'
    if (!form.cliente_id) e.cliente_id = 'El cliente es obligatorio'
    if (!form.origen.trim()) e.origen = 'El origen es obligatorio'
    if (!form.destino.trim()) e.destino = 'El destino es obligatorio'
    if (!form.fecha) e.fecha = 'La fecha es obligatoria'
    if (!form.precio_flete || Number(form.precio_flete) <= 0) e.precio_flete = 'El monto del flete es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      fecha: form.fecha,
      cliente_id: form.cliente_id || null,
      chofer_id: form.chofer_id || null,
      camion_id: form.camion_id || null,
      origen: form.origen.trim(),
      destino: form.destino.trim(),
      tipo_carga: form.tipo_carga.trim() || null,
      km: form.km ? Number(form.km) : null,
      precio_flete: Number(form.precio_flete),
      estado: form.estado,
      observaciones: form.observaciones.trim() || null,
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('viajes').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('viajes').insert(payload))
    }
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editingId ? 'Viaje actualizado correctamente' : 'Viaje creado correctamente')
      setShowModal(false)
      loadAll()
    }
    setSaving(false)
  }

  async function handleCompletar(viajeId: string) {
    setActionLoading(true)
    const viaje = viajes.find(v => v.id === viajeId)
    if (!viaje) { setActionLoading(false); return }

    const { error: updErr } = await supabase
      .from('viajes')
      .update({ estado: 'completado' })
      .eq('id', viajeId)

    if (updErr) { showToast('Error al completar viaje: ' + updErr.message, 'error'); setActionLoading(false); return }

    // Check if commission already exists
    const { data: existing } = await supabase
      .from('comisiones')
      .select('id')
      .eq('viaje_id', viajeId)
      .limit(1)

    if (!existing || existing.length === 0) {
      const porcentaje = viaje.choferes?.porcentaje_comision ?? 8
      const monto = (viaje.precio_flete * porcentaje) / 100
      await supabase.from('comisiones').insert({
        viaje_id: viajeId,
        chofer_id: viaje.chofer_id,
        monto,
      })
    }

    showToast('Viaje completado. Comisión generada automáticamente.')
    setConfirmId(null)
    setConfirmAction(null)
    loadAll()
    setActionLoading(false)
  }

  async function handleCancelar(viajeId: string) {
    setActionLoading(true)
    const { error } = await supabase.from('viajes').update({ estado: 'cancelado' }).eq('id', viajeId)
    if (error) showToast('Error al cancelar: ' + error.message, 'error')
    else { showToast('Viaje cancelado'); loadAll() }
    setConfirmId(null)
    setConfirmAction(null)
    setActionLoading(false)
  }

  const total = viajes.length
  const pendientes = viajes.filter(v => v.estado === 'pendiente' || v.estado === 'en_ruta').length
  const completados = viajes.filter(v => v.estado === 'completado').length

  const confirmViaje = viajes.find(v => v.id === confirmId)

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Viajes / Fletes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Registro de servicios de transporte</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nuevo viaje
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total viajes" value={String(total)} subtitle="Registrados" icon={MapPin} color="blue" />
        <StatCard title="En curso / Pendientes" value={String(pendientes)} subtitle="Activos" icon={Clock} color="orange" />
        <StatCard title="Completados" value={String(completados)} subtitle="Finalizados" icon={CheckCircle} color="green" />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-2 text-sm text-yellow-700">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>La comisión del chofer se genera <strong>automáticamente</strong> al marcar un viaje como completado.</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Registro de viajes</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : viajes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay viajes registrados</p>
            <button onClick={openCreate} className="text-orange-500 hover:underline text-sm">Registrar el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Ruta</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Chofer / Camión</th>
                  <th className="px-5 py-3 font-medium">Flete</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Comisión est.</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viajes.map(v => {
                  const pct = v.choferes?.porcentaje_comision ?? 8
                  const comision = (v.precio_flete * pct) / 100
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-PY')}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{v.clientes?.nombre || '-'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                        {v.origen} → {v.destino}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">
                        {v.choferes?.nombre || '-'} · {v.camiones?.chapa || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                        {Number(v.precio_flete).toLocaleString('es-PY')}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                        {comision.toLocaleString('es-PY', { maximumFractionDigits: 0 })} ({pct}%)
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColorMap[v.estado]}`}>
                          {estadoLabelMap[v.estado]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(v)} title="Editar" className="text-blue-500 hover:text-blue-700 transition">
                            <Pencil size={15} />
                          </button>
                          {(v.estado === 'pendiente' || v.estado === 'en_ruta') && (
                            <button
                              onClick={() => { setConfirmId(v.id); setConfirmAction('completar') }}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium transition"
                            >
                              Completar
                            </button>
                          )}
                          {v.estado !== 'cancelado' && v.estado !== 'completado' && (
                            <button
                              onClick={() => { setConfirmId(v.id); setConfirmAction('cancelar') }}
                              className="text-xs px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded font-medium transition"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmId && confirmAction && confirmViaje && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">
              {confirmAction === 'completar' ? 'Completar viaje' : 'Cancelar viaje'}
            </h3>
            <p className="text-sm text-slate-600 mb-1">
              {confirmAction === 'completar'
                ? `¿Marcar el viaje ${confirmViaje.origen} → ${confirmViaje.destino} como completado?`
                : `¿Cancelar el viaje ${confirmViaje.origen} → ${confirmViaje.destino}?`}
            </p>
            {confirmAction === 'completar' && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-2">
                Se generará automáticamente la comisión del chofer ({confirmViaje.choferes?.porcentaje_comision ?? 8}% de{' '}
                {Number(confirmViaje.precio_flete).toLocaleString('es-PY')}).
              </p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setConfirmId(null); setConfirmAction(null) }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmAction === 'completar' ? handleCompletar(confirmId) : handleCancelar(confirmId)}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 ${confirmAction === 'completar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                {confirmAction === 'completar' ? 'Sí, completar' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">{editingId ? 'Editar viaje' : 'Nuevo viaje'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.fecha ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
                {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.cliente_id ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.cliente_id}
                  onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {errors.cliente_id && <p className="text-red-500 text-xs mt-1">{errors.cliente_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chofer <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.chofer_id ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.chofer_id}
                    onChange={e => setForm(f => ({ ...f, chofer_id: e.target.value }))}
                  >
                    <option value="">Seleccionar chofer...</option>
                    {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.porcentaje_comision ?? 8}%)</option>)}
                  </select>
                  {errors.chofer_id && <p className="text-red-500 text-xs mt-1">{errors.chofer_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Camión <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.camion_id ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.camion_id}
                    onChange={e => setForm(f => ({ ...f, camion_id: e.target.value }))}
                  >
                    <option value="">Seleccionar camión...</option>
                    {camiones.map(c => <option key={c.id} value={c.id}>{c.chapa} - {c.marca} {c.modelo}</option>)}
                  </select>
                  {errors.camion_id && <p className="text-red-500 text-xs mt-1">{errors.camion_id}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origen <span className="text-red-500">*</span></label>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.origen ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.origen}
                    onChange={e => setForm(f => ({ ...f, origen: e.target.value }))}
                    placeholder="Ej: Asunción"
                  />
                  {errors.origen && <p className="text-red-500 text-xs mt-1">{errors.origen}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destino <span className="text-red-500">*</span></label>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.destino ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.destino}
                    onChange={e => setForm(f => ({ ...f, destino: e.target.value }))}
                    placeholder="Ej: San Pedro"
                  />
                  {errors.destino && <p className="text-red-500 text-xs mt-1">{errors.destino}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto del flete <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.precio_flete ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.precio_flete}
                    onChange={e => setForm(f => ({ ...f, precio_flete: e.target.value }))}
                    placeholder="0"
                  />
                  {errors.precio_flete && <p className="text-red-500 text-xs mt-1">{errors.precio_flete}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Km del viaje</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.km}
                    onChange={e => setForm(f => ({ ...f, km: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de carga</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.tipo_carga}
                    onChange={e => setForm(f => ({ ...f, tipo_carga: e.target.value }))}
                    placeholder="Ej: Soja, Ganado..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Viaje['estado'] }))}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_ruta">En ruta</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>
              {form.chofer_id && form.precio_flete && Number(form.precio_flete) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  <DollarSign size={13} className="inline mr-1" />
                  Comisión estimada:{' '}
                  {((Number(form.precio_flete) * (choferes.find(c => c.id === form.chofer_id)?.porcentaje_comision ?? 8)) / 100)
                    .toLocaleString('es-PY', { maximumFractionDigits: 0 })}
                  {' '}({choferes.find(c => c.id === form.chofer_id)?.porcentaje_comision ?? 8}%)
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? 'Guardar cambios' : 'Crear viaje'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
