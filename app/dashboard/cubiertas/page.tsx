'use client'

import { useState, useEffect, useCallback } from 'react'
import { Disc, Plus, AlertTriangle, X, Loader2, CheckCircle, RotateCcw } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Cubierta {
  id: string
  camion_id: string | null
  posicion: string
  marca: string | null
  medida: string | null
  tipo: string
  estado: string
  fecha_instalacion: string | null
  km_instalacion: number | null
  costo: number | null
  proveedor: string | null
  fecha_retiro: string | null
  km_retiro: number | null
  motivo_cambio: string | null
  observaciones: string | null
  activo: boolean
  camiones: { chapa: string } | null
}

interface Camion { id: string; chapa: string; marca: string; modelo: string }

const EMPTY_FORM = {
  camion_id: '',
  posicion: '',
  marca: '',
  medida: '',
  tipo: 'nueva',
  estado: 'instalada',
  fecha_instalacion: new Date().toISOString().slice(0, 10),
  km_instalacion: '',
  costo: '',
  proveedor: '',
  observaciones: '',
}

const EMPTY_RETIRO = {
  fecha_retiro: new Date().toISOString().slice(0, 10),
  km_retiro: '',
  motivo_cambio: '',
  nuevo_estado: 'retirada',
}

const ESTADO_COLORS: Record<string, string> = {
  instalada: 'bg-green-100 text-green-700',
  en_deposito: 'bg-blue-100 text-blue-700',
  retirada: 'bg-slate-100 text-slate-600',
  dañada: 'bg-red-100 text-red-700',
  descartada: 'bg-zinc-100 text-zinc-500',
}

const ESTADO_LABELS: Record<string, string> = {
  instalada: 'Instalada',
  en_deposito: 'En depósito',
  retirada: 'Retirada',
  dañada: 'Dañada',
  descartada: 'Descartada',
}

const POSICIONES = [
  'Delantera izq.', 'Delantera der.',
  'Tracción izq. int.', 'Tracción izq. ext.',
  'Tracción der. int.', 'Tracción der. ext.',
  'Arrastre izq. int.', 'Arrastre izq. ext.',
  'Arrastre der. int.', 'Arrastre der. ext.',
  'Auxilio',
]

const supabase = createClient()

function getChapa(c: Cubierta) {
  const cam = Array.isArray(c.camiones) ? c.camiones[0] : c.camiones
  return cam?.chapa ?? '-'
}

export default function CubiertasPage() {
  const [cubiertas, setCubiertas] = useState<Cubierta[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showRetiroModal, setShowRetiroModal] = useState(false)
  const [editItem, setEditItem] = useState<Cubierta | null>(null)
  const [retiroTarget, setRetiroTarget] = useState<Cubierta | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [retiroForm, setRetiroForm] = useState(EMPTY_RETIRO)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [filterEstado, setFilterEstado] = useState('todas')

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [cubRes, camRes] = await Promise.all([
      supabase
        .from('cubiertas')
        .select('*, camiones(chapa)')
        .eq('activo', true)
        .order('created_at', { ascending: false }),
      supabase.from('camiones').select('id, chapa, marca, modelo').order('chapa'),
    ])
    if (cubRes.data) setCubiertas(cubRes.data as Cubierta[])
    if (camRes.data) setCamiones(camRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function openNew() {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, fecha_instalacion: new Date().toISOString().slice(0, 10) })
    setErrors({})
    setShowModal(true)
  }

  function openEdit(c: Cubierta) {
    setEditItem(c)
    setForm({
      camion_id: c.camion_id ?? '',
      posicion: c.posicion,
      marca: c.marca ?? '',
      medida: c.medida ?? '',
      tipo: c.tipo ?? 'nueva',
      estado: c.estado,
      fecha_instalacion: c.fecha_instalacion ?? new Date().toISOString().slice(0, 10),
      km_instalacion: c.km_instalacion?.toString() ?? '',
      costo: c.costo?.toString() ?? '',
      proveedor: c.proveedor ?? '',
      observaciones: c.observaciones ?? '',
    })
    setErrors({})
    setShowModal(true)
  }

  function openRetiro(c: Cubierta) {
    setRetiroTarget(c)
    setRetiroForm({ ...EMPTY_RETIRO, fecha_retiro: new Date().toISOString().slice(0, 10) })
    setShowRetiroModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.posicion.trim()) e.posicion = 'La posición es obligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      camion_id: form.camion_id || null,
      posicion: form.posicion.trim(),
      marca: form.marca.trim() || null,
      medida: form.medida.trim() || null,
      tipo: form.tipo,
      estado: form.estado,
      fecha_instalacion: form.fecha_instalacion || null,
      km_instalacion: form.km_instalacion ? Number(form.km_instalacion) : null,
      costo: form.costo ? Number(form.costo) : null,
      proveedor: form.proveedor.trim() || null,
      observaciones: form.observaciones.trim() || null,
    }

    const { error } = editItem
      ? await supabase.from('cubiertas').update(payload).eq('id', editItem.id)
      : await supabase.from('cubiertas').insert({ ...payload, activo: true })

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editItem ? 'Cubierta actualizada' : 'Cubierta registrada correctamente')
      setShowModal(false)
      loadAll()
    }
    setSaving(false)
  }

  async function handleRetiro() {
    if (!retiroTarget) return
    setSaving(true)
    const { error } = await supabase.from('cubiertas').update({
      estado: retiroForm.nuevo_estado,
      fecha_retiro: retiroForm.fecha_retiro || null,
      km_retiro: retiroForm.km_retiro ? Number(retiroForm.km_retiro) : null,
      motivo_cambio: retiroForm.motivo_cambio.trim() || null,
    }).eq('id', retiroTarget.id)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Cubierta marcada como ' + ESTADO_LABELS[retiroForm.nuevo_estado])
      setShowRetiroModal(false)
      loadAll()
    }
    setSaving(false)
  }

  const filtradas = filterEstado === 'todas'
    ? cubiertas
    : cubiertas.filter(c => c.estado === filterEstado)

  const instaladas = cubiertas.filter(c => c.estado === 'instalada').length
  const dañadas = cubiertas.filter(c => c.estado === 'dañada').length
  const gastoTotal = cubiertas.reduce((s, c) => s + (c.costo ?? 0), 0)

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cubiertas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de neumáticos por camión y posición</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nueva cubierta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Instaladas" value={loading ? '...' : String(instaladas)} subtitle="En servicio activo" icon={Disc} color="blue" />
        <StatCard title="Dañadas" value={loading ? '...' : String(dañadas)} subtitle="Requieren atención" icon={AlertTriangle} color="red" />
        <StatCard title="Gasto total" value={loading ? '...' : `₲ ${gastoTotal.toLocaleString('es-PY')}`} subtitle="En cubiertas registradas" icon={Disc} color="orange" />
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todas', 'instalada', 'en_deposito', 'retirada', 'dañada', 'descartada'].map(e => (
          <button
            key={e}
            onClick={() => setFilterEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterEstado === e ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {e === 'todas' ? 'Todas' : ESTADO_LABELS[e]} {e === 'todas' ? `(${cubiertas.length})` : `(${cubiertas.filter(c => c.estado === e).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Disc size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay cubiertas registradas</p>
            <button onClick={openNew} className="text-orange-500 hover:underline text-sm">Registrar la primera</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Camión</th>
                  <th className="px-5 py-3 font-medium">Posición</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Marca / Medida</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Tipo</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Km inst.</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Costo</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{getChapa(c)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{c.posicion}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 hidden md:table-cell">
                      {c.marca || '-'}{c.medida ? ` · ${c.medida}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell capitalize">{c.tipo ?? '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {c.km_instalacion ? c.km_instalacion.toLocaleString('es-PY') + ' km' : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 hidden xl:table-cell">
                      {c.costo ? `₲ ${c.costo.toLocaleString('es-PY')}` : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLORS[c.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                        {ESTADO_LABELS[c.estado] ?? c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs text-slate-500 hover:text-orange-600 transition"
                          title="Editar"
                        >
                          Editar
                        </button>
                        {c.estado === 'instalada' && (
                          <button
                            onClick={() => openRetiro(c)}
                            className="text-xs text-red-400 hover:text-red-600 transition flex items-center gap-1"
                            title="Registrar retiro"
                          >
                            <RotateCcw size={12} /> Retirar
                          </button>
                        )}
                        {c.estado === 'en_deposito' && (
                          <button
                            onClick={() => openRetiro(c)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
                            title="Cambiar estado"
                          >
                            <CheckCircle size={12} /> Estado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nueva / Editar cubierta */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">
                {editItem ? 'Editar cubierta' : 'Nueva cubierta'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Camión</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.camion_id}
                  onChange={e => setForm(f => ({ ...f, camion_id: e.target.value }))}
                >
                  <option value="">Sin asignar</option>
                  {camiones.map(c => <option key={c.id} value={c.id}>{c.chapa} - {c.marca} {c.modelo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Posición <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.posicion ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.posicion}
                  onChange={e => setForm(f => ({ ...f, posicion: e.target.value }))}
                >
                  <option value="">Seleccionar posición...</option>
                  {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="Otra">Otra</option>
                </select>
                {errors.posicion && <p className="text-red-500 text-xs mt-1">{errors.posicion}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.marca}
                    onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                    placeholder="Ej: Bridgestone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medida</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.medida}
                    onChange={e => setForm(f => ({ ...f, medida: e.target.value }))}
                    placeholder="Ej: 295/80 R22.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  >
                    <option value="nueva">Nueva</option>
                    <option value="recapada">Recapada</option>
                    <option value="usada">Usada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                  >
                    <option value="instalada">Instalada</option>
                    <option value="en_deposito">En depósito</option>
                    <option value="retirada">Retirada</option>
                    <option value="dañada">Dañada</option>
                    <option value="descartada">Descartada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de instalación</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.fecha_instalacion}
                    onChange={e => setForm(f => ({ ...f, fecha_instalacion: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Km al instalar</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.km_instalacion}
                    onChange={e => setForm(f => ({ ...f, km_instalacion: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.proveedor}
                    onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                    placeholder="Ej: Neumáticos SA"
                  />
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
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editItem ? 'Guardar cambios' : 'Registrar cubierta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar retiro */}
      {showRetiroModal && retiroTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Registrar retiro de cubierta</h2>
              <button onClick={() => setShowRetiroModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
                <strong>{retiroTarget.posicion}</strong> · {retiroTarget.marca ?? '-'} {retiroTarget.medida ?? ''} · {getChapa(retiroTarget)}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo estado</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={retiroForm.nuevo_estado}
                  onChange={e => setRetiroForm(f => ({ ...f, nuevo_estado: e.target.value }))}
                >
                  <option value="retirada">Retirada</option>
                  <option value="en_deposito">En depósito</option>
                  <option value="dañada">Dañada</option>
                  <option value="descartada">Descartada</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de retiro</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={retiroForm.fecha_retiro}
                    onChange={e => setRetiroForm(f => ({ ...f, fecha_retiro: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Km al retirar</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={retiroForm.km_retiro}
                    onChange={e => setRetiroForm(f => ({ ...f, km_retiro: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={retiroForm.motivo_cambio}
                  onChange={e => setRetiroForm(f => ({ ...f, motivo_cambio: e.target.value }))}
                  placeholder="Ej: Desgaste excesivo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowRetiroModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleRetiro}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Confirmar retiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
