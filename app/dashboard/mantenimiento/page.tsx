'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wrench, Plus, AlertTriangle, CheckCircle, X, Loader2, Pencil } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Camion { id: string; chapa: string; marca: string; modelo: string }

interface Mantenimiento {
  id: string
  fecha: string
  camion_id: string | null
  tipo_trabajo: string
  taller: string | null
  km_actual: number | null
  km_proximo_service: number | null
  costo: number | null
  estado: 'pendiente' | 'en_proceso' | 'realizado'
  observaciones: string | null
  created_at: string
  camiones: { chapa: string; marca: string; modelo: string } | null
}

const estadoColorMap: Record<string, string> = {
  realizado: 'bg-green-100 text-green-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
}

const estadoLabelMap: Record<string, string> = {
  realizado: 'Realizado',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
}

const EMPTY_FORM = {
  fecha: new Date().toISOString().slice(0, 10),
  camion_id: '',
  tipo_trabajo: '',
  taller: '',
  km_actual: '',
  km_proximo_service: '',
  costo: '',
  estado: 'realizado' as Mantenimiento['estado'],
  observaciones: '',
}

const supabase = createClient()

export default function MantenimientoPage() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [filterCamion, setFilterCamion] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [mRes, cRes] = await Promise.all([
      supabase.from('mantenimientos').select('*, camiones(chapa, marca, modelo)').order('fecha', { ascending: false }),
      supabase.from('camiones').select('id, chapa, marca, modelo').order('chapa'),
    ])
    if (mRes.data) setMantenimientos(mRes.data as Mantenimiento[])
    if (cRes.data) setCamiones(cRes.data)
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

  function openEdit(m: Mantenimiento) {
    setForm({
      fecha: m.fecha,
      camion_id: m.camion_id || '',
      tipo_trabajo: m.tipo_trabajo,
      taller: m.taller || '',
      km_actual: m.km_actual ? String(m.km_actual) : '',
      km_proximo_service: m.km_proximo_service ? String(m.km_proximo_service) : '',
      costo: m.costo ? String(m.costo) : '',
      estado: m.estado,
      observaciones: m.observaciones || '',
    })
    setErrors({})
    setEditingId(m.id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.camion_id) e.camion_id = 'El camión es obligatorio'
    if (!form.tipo_trabajo.trim()) e.tipo_trabajo = 'El tipo de trabajo es obligatorio'
    if (!form.fecha) e.fecha = 'La fecha es obligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      fecha: form.fecha,
      camion_id: form.camion_id || null,
      tipo_trabajo: form.tipo_trabajo.trim(),
      taller: form.taller.trim() || null,
      km_actual: form.km_actual ? Number(form.km_actual) : null,
      km_proximo_service: form.km_proximo_service ? Number(form.km_proximo_service) : null,
      costo: form.costo ? Number(form.costo) : null,
      estado: form.estado,
      observaciones: form.observaciones.trim() || null,
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('mantenimientos').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('mantenimientos').insert(payload))
    }
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editingId ? 'Mantenimiento actualizado' : 'Mantenimiento registrado')
      setShowModal(false)
      loadAll()
    }
    setSaving(false)
  }

  const getCamion = (m: Mantenimiento) => {
    const cam = Array.isArray(m.camiones) ? m.camiones[0] : m.camiones
    return cam ? `${cam.chapa} - ${cam.marca} ${cam.modelo}` : '-'
  }

  const getCamionChapa = (m: Mantenimiento) => {
    const cam = Array.isArray(m.camiones) ? m.camiones[0] : m.camiones
    return cam?.chapa || '-'
  }

  const filtered = filterCamion
    ? mantenimientos.filter(m => m.camion_id === filterCamion)
    : mantenimientos

  const costoTotal = mantenimientos.reduce((s, m) => s + (m.costo || 0), 0)
  const proximosService = mantenimientos.filter(m => m.km_proximo_service && m.estado === 'realizado').length
  const realizados = mantenimientos.filter(m => m.estado === 'realizado').length

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Flota</h1>
          <p className="text-slate-500 text-sm mt-0.5">Historial de trabajos y alertas preventivas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Registrar mantenimiento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Gasto total"
          value={loading ? '...' : `₲ ${costoTotal.toLocaleString('es-PY')}`}
          subtitle="Todos los registros"
          icon={Wrench}
          color="orange"
        />
        <StatCard
          title="Próximos services"
          value={loading ? '...' : String(proximosService)}
          subtitle="Con km de seguimiento"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Trabajos realizados"
          value={loading ? '...' : String(realizados)}
          subtitle="Finalizados"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Historial de mantenimiento</h2>
          {camiones.length > 0 && (
            <select
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={filterCamion}
              onChange={e => setFilterCamion(e.target.value)}
            >
              <option value="">Todos los camiones</option>
              {camiones.map(c => <option key={c.id} value={c.id}>{c.chapa} - {c.marca} {c.modelo}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Wrench size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">{filterCamion ? 'Sin registros para este camión' : 'No hay mantenimientos registrados'}</p>
            {!filterCamion && (
              <button onClick={openCreate} className="text-orange-500 hover:underline text-sm">Registrar el primero</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Camión</th>
                  <th className="px-5 py-3 font-medium">Trabajo</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Taller</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Km actual</th>
                  <th className="px-5 py-3 font-medium">Costo</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Próximo service</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{getCamionChapa(m)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{m.tipo_trabajo}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{m.taller || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {m.km_actual ? `${m.km_actual.toLocaleString('es-PY')} km` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                      {m.costo ? `₲ ${m.costo.toLocaleString('es-PY')}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">
                      {m.km_proximo_service ? `${m.km_proximo_service.toLocaleString('es-PY')} km` : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColorMap[m.estado]}`}>
                        {estadoLabelMap[m.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openEdit(m)} title="Editar" className="text-blue-500 hover:text-blue-700 transition">
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">{editingId ? 'Editar mantenimiento' : 'Registrar mantenimiento'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Mantenimiento['estado'] }))}
                  >
                    <option value="realizado">Realizado</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de trabajo <span className="text-red-500">*</span></label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.tipo_trabajo ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.tipo_trabajo}
                  onChange={e => setForm(f => ({ ...f, tipo_trabajo: e.target.value }))}
                  placeholder="Ej: Cambio de aceite + filtros"
                />
                {errors.tipo_trabajo && <p className="text-red-500 text-xs mt-1">{errors.tipo_trabajo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Taller</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.taller}
                  onChange={e => setForm(f => ({ ...f, taller: e.target.value }))}
                  placeholder="Ej: Taller Roque"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Km actual</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.km_actual}
                    onChange={e => setForm(f => ({ ...f, km_actual: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Próximo service (km)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.km_proximo_service}
                    onChange={e => setForm(f => ({ ...f, km_proximo_service: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo (₲)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.costo}
                  onChange={e => setForm(f => ({ ...f, costo: e.target.value }))}
                  placeholder="0"
                />
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
                {editingId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
