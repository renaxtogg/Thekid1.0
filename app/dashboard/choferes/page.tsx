'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserCheck, Plus, AlertTriangle, CheckCircle, X, Pencil, Power, Loader2 } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Chofer {
  id: string
  nombre: string
  ci: string | null
  telefono: string | null
  direccion: string | null
  tipo_licencia: string | null
  venc_licencia: string | null
  porcentaje_comision: number | null
  activo: boolean
  created_at: string
}

const EMPTY_FORM = {
  nombre: '',
  ci: '',
  telefono: '',
  direccion: '',
  tipo_licencia: '',
  venc_licencia: '',
  porcentaje_comision: '8',
}

const supabase = createClient()

export default function ChoferesPage() {
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const loadChoferes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('choferes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setChoferes(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadChoferes() }, [loadChoferes])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(c: Chofer) {
    setForm({
      nombre: c.nombre,
      ci: c.ci || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      tipo_licencia: c.tipo_licencia || '',
      venc_licencia: c.venc_licencia || '',
      porcentaje_comision: String(c.porcentaje_comision ?? 8),
    })
    setErrors({})
    setEditingId(c.id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.ci.trim()) e.ci = 'El documento es obligatorio'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      ci: form.ci.trim() || null,
      telefono: form.telefono.trim() || null,
      direccion: form.direccion.trim() || null,
      tipo_licencia: form.tipo_licencia.trim() || null,
      venc_licencia: form.venc_licencia || null,
      porcentaje_comision: Number(form.porcentaje_comision) || 8,
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('choferes').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('choferes').insert(payload))
    }
    if (error) {
      showToast('Error al guardar: ' + error.message, 'error')
    } else {
      showToast(editingId ? 'Chofer actualizado correctamente' : 'Chofer creado correctamente')
      setShowModal(false)
      loadChoferes()
    }
    setSaving(false)
  }

  async function handleToggleActive(c: Chofer) {
    const { error } = await supabase
      .from('choferes')
      .update({ activo: !c.activo })
      .eq('id', c.id)
    if (error) {
      showToast('Error al actualizar estado', 'error')
    } else {
      showToast(c.activo ? 'Chofer desactivado' : 'Chofer activado')
      loadChoferes()
    }
  }

  const hoy = new Date()
  const en30 = new Date(); en30.setDate(hoy.getDate() + 30)
  const activos = choferes.filter(c => c.activo).length
  const porVencer = choferes.filter(c => {
    if (!c.venc_licencia) return false
    const v = new Date(c.venc_licencia + 'T00:00:00')
    return v >= hoy && v <= en30
  }).length

  function estadoBadge(c: Chofer) {
    if (!c.activo) return { label: 'Inactivo', cls: 'bg-slate-100 text-slate-500' }
    if (c.venc_licencia) {
      const v = new Date(c.venc_licencia + 'T00:00:00')
      if (v < hoy) return { label: 'Licencia vencida', cls: 'bg-red-100 text-red-700' }
      if (v <= en30) return { label: 'Vence pronto', cls: 'bg-yellow-100 text-yellow-700' }
    }
    return { label: 'Activo', cls: 'bg-green-100 text-green-700' }
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Choferes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de conductores y licencias</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nuevo chofer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total choferes" value={String(choferes.length)} subtitle="Registrados en el sistema" icon={UserCheck} color="blue" />
        <StatCard title="Activos" value={String(activos)} subtitle="Disponibles" icon={CheckCircle} color="green" />
        <StatCard title="Licencias por vencer" value={String(porVencer)} subtitle="En los próximos 30 días" icon={AlertTriangle} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listado de choferes</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : choferes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay choferes registrados</p>
            <button onClick={openCreate} className="text-orange-500 hover:underline text-sm">Agregar el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">CI / Doc</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Teléfono</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Licencia</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Venc. Licencia</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Comisión</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {choferes.map(c => {
                  const badge = estadoBadge(c)
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.nombre}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.ci || '-'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.telefono || '-'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">{c.tipo_licencia || '-'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden xl:table-cell">
                        {c.venc_licencia ? new Date(c.venc_licencia + 'T00:00:00').toLocaleDateString('es-PY') : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-700 hidden lg:table-cell">{c.porcentaje_comision ?? 8}%</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(c)} title="Editar" className="text-blue-500 hover:text-blue-700 transition">
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(c)}
                            title={c.activo ? 'Desactivar' : 'Activar'}
                            className={`transition ${c.activo ? 'text-slate-400 hover:text-red-500' : 'text-green-500 hover:text-green-700'}`}
                          >
                            <Power size={15} />
                          </button>
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

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">{editingId ? 'Editar chofer' : 'Nuevo chofer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo <span className="text-red-500">*</span></label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Roberto Villalba"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CI / Documento <span className="text-red-500">*</span></label>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.ci ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.ci}
                    onChange={e => setForm(f => ({ ...f, ci: e.target.value }))}
                    placeholder="Ej: 3.456.789"
                  />
                  {errors.ci && <p className="text-red-500 text-xs mt-1">{errors.ci}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.telefono ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    placeholder="Ej: 0981 234 567"
                  />
                  {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.direccion}
                  onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                  placeholder="Dirección del chofer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de licencia</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.tipo_licencia}
                    onChange={e => setForm(f => ({ ...f, tipo_licencia: e.target.value }))}
                    placeholder="Ej: Professional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento licencia</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.venc_licencia}
                    onChange={e => setForm(f => ({ ...f, venc_licencia: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje de comisión (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.porcentaje_comision}
                  onChange={e => setForm(f => ({ ...f, porcentaje_comision: e.target.value }))}
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
                {editingId ? 'Guardar cambios' : 'Crear chofer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
