'use client'

import { useState, useEffect, useCallback } from 'react'
import { Truck, Plus, Wrench, AlertTriangle, CheckCircle, X, Pencil, Loader2 } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Camion {
  id: string
  chapa: string
  marca: string
  modelo: string
  anio: number | null
  capacidad_litros: number | null
  km_actual: number | null
  estado: 'activo' | 'taller' | 'fuera_de_servicio'
  venc_seguro: string | null
  venc_itv: string | null
  venc_habilitacion: string | null
  observaciones: string | null
  created_at: string
}

const EMPTY_FORM = {
  chapa: '',
  marca: '',
  modelo: '',
  anio: '',
  capacidad_litros: '',
  km_actual: '',
  estado: 'activo' as Camion['estado'],
  venc_seguro: '',
  venc_itv: '',
  venc_habilitacion: '',
  observaciones: '',
}

const estadoColorMap: Record<string, string> = {
  activo: 'bg-green-100 text-green-700',
  taller: 'bg-yellow-100 text-yellow-700',
  fuera_de_servicio: 'bg-red-100 text-red-700',
}

const estadoLabelMap: Record<string, string> = {
  activo: 'Activo',
  taller: 'En taller',
  fuera_de_servicio: 'Fuera de servicio',
}

const supabase = createClient()

export default function CamionesPage() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const loadCamiones = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('camiones')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCamiones(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadCamiones() }, [loadCamiones])

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

  function openEdit(c: Camion) {
    setForm({
      chapa: c.chapa,
      marca: c.marca,
      modelo: c.modelo,
      anio: c.anio ? String(c.anio) : '',
      capacidad_litros: c.capacidad_litros ? String(c.capacidad_litros) : '',
      km_actual: c.km_actual ? String(c.km_actual) : '',
      estado: c.estado,
      venc_seguro: c.venc_seguro || '',
      venc_itv: c.venc_itv || '',
      venc_habilitacion: c.venc_habilitacion || '',
      observaciones: c.observaciones || '',
    })
    setErrors({})
    setEditingId(c.id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.chapa.trim()) e.chapa = 'La chapa/matrícula es obligatoria'
    if (!form.marca.trim()) e.marca = 'La marca es obligatoria'
    if (!form.modelo.trim()) e.modelo = 'El modelo es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      chapa: form.chapa.trim().toUpperCase(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: form.anio ? Number(form.anio) : null,
      capacidad_litros: form.capacidad_litros ? Number(form.capacidad_litros) : null,
      km_actual: form.km_actual ? Number(form.km_actual) : 0,
      estado: form.estado,
      venc_seguro: form.venc_seguro || null,
      venc_itv: form.venc_itv || null,
      venc_habilitacion: form.venc_habilitacion || null,
      observaciones: form.observaciones.trim() || null,
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('camiones').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('camiones').insert(payload))
    }
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editingId ? 'Camión actualizado correctamente' : 'Camión creado correctamente')
      setShowModal(false)
      loadCamiones()
    }
    setSaving(false)
  }

  async function handleChangeEstado(id: string, estado: Camion['estado']) {
    const { error } = await supabase.from('camiones').update({ estado }).eq('id', id)
    if (error) showToast('Error al cambiar estado', 'error')
    else { showToast('Estado actualizado'); loadCamiones() }
  }

  const activos = camiones.filter(c => c.estado === 'activo').length
  const enTaller = camiones.filter(c => c.estado === 'taller').length
  const fueraServicio = camiones.filter(c => c.estado === 'fuera_de_servicio').length

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Camiones / Flota</h1>
          <p className="text-slate-500 text-sm mt-0.5">Administración y estado de la flota</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nuevo camión
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total flota" value={String(camiones.length)} subtitle="Camiones registrados" icon={Truck} color="blue" />
        <StatCard title="Activos" value={String(activos)} subtitle="En operación" icon={CheckCircle} color="green" />
        <StatCard title="En taller" value={String(enTaller)} subtitle="En reparación" icon={Wrench} color="orange" />
        <StatCard title="Fuera de servicio" value={String(fueraServicio)} subtitle="Sin operación" icon={AlertTriangle} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listado de camiones</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : camiones.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay camiones registrados</p>
            <button onClick={openCreate} className="text-orange-500 hover:underline text-sm">Agregar el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Chapa</th>
                  <th className="px-5 py-3 font-medium">Vehículo</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Año</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Kilometraje</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Seg. / ITV</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {camiones.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{c.chapa}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{c.marca} {c.modelo}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.anio || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 hidden lg:table-cell">
                      {c.km_actual != null ? Number(c.km_actual).toLocaleString('es-PY') + ' km' : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 hidden xl:table-cell">
                      <div>Seg: {c.venc_seguro ? new Date(c.venc_seguro + 'T00:00:00').toLocaleDateString('es-PY') : '-'}</div>
                      <div>ITV: {c.venc_itv ? new Date(c.venc_itv + 'T00:00:00').toLocaleDateString('es-PY') : '-'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColorMap[c.estado]}`}>
                        {estadoLabelMap[c.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(c)} title="Editar" className="text-blue-500 hover:text-blue-700 transition">
                          <Pencil size={15} />
                        </button>
                        <select
                          value={c.estado}
                          onChange={e => handleChangeEstado(c.id, e.target.value as Camion['estado'])}
                          className="text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-300"
                        >
                          <option value="activo">Activo</option>
                          <option value="taller">En taller</option>
                          <option value="fuera_de_servicio">Fuera de servicio</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">{editingId ? 'Editar camión' : 'Nuevo camión'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label="Chapa / Matrícula *" error={errors.chapa}>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.chapa ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.chapa}
                  onChange={e => setForm(f => ({ ...f, chapa: e.target.value }))}
                  placeholder="Ej: ABD 123"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marca *" error={errors.marca}>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.marca ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.marca}
                    onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                    placeholder="Ej: Scania"
                  />
                </Field>
                <Field label="Modelo *" error={errors.modelo}>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.modelo ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.modelo}
                    onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="Ej: R 420"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Año">
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.anio}
                    onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}
                    placeholder="2020"
                  />
                </Field>
                <Field label="Km actual">
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.km_actual}
                    onChange={e => setForm(f => ({ ...f, km_actual: e.target.value }))}
                    placeholder="0"
                  />
                </Field>
                <Field label="Cap. litros">
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.capacidad_litros}
                    onChange={e => setForm(f => ({ ...f, capacidad_litros: e.target.value }))}
                    placeholder="600"
                  />
                </Field>
              </div>
              <Field label="Estado">
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.estado}
                  onChange={e => setForm(f => ({ ...f, estado: e.target.value as Camion['estado'] }))}
                >
                  <option value="activo">Activo</option>
                  <option value="taller">En taller</option>
                  <option value="fuera_de_servicio">Fuera de servicio</option>
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Venc. seguro">
                  <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.venc_seguro} onChange={e => setForm(f => ({ ...f, venc_seguro: e.target.value }))} />
                </Field>
                <Field label="Venc. ITV">
                  <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.venc_itv} onChange={e => setForm(f => ({ ...f, venc_itv: e.target.value }))} />
                </Field>
                <Field label="Venc. habilitación">
                  <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.venc_habilitacion} onChange={e => setForm(f => ({ ...f, venc_habilitacion: e.target.value }))} />
                </Field>
              </div>
              <Field label="Observaciones">
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </Field>
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
                {editingId ? 'Guardar cambios' : 'Crear camión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
