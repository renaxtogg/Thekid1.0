'use client'

import { useState, useEffect, useCallback } from 'react'
import { Droplets, Plus, TrendingUp, X, Loader2, Truck } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Carga {
  id: string
  fecha: string
  camion_id: string | null
  chofer_id: string | null
  viaje_id: string | null
  litros: number
  tipo_combustible: string
  km_al_cargar: number | null
  precio_por_litro: number | null
  responsable: string | null
  observaciones: string | null
  camiones: { chapa: string } | null
  choferes: { nombre: string } | null
  viajes: { origen: string; destino: string } | null
}

interface Camion { id: string; chapa: string; marca: string; modelo: string }
interface Chofer { id: string; nombre: string }
interface Viaje { id: string; origen: string; destino: string; fecha: string }

const EMPTY_FORM = {
  fecha: new Date().toISOString().slice(0, 10),
  camion_id: '',
  chofer_id: '',
  viaje_id: '',
  tipo_combustible: 'Gasoil',
  litros: '',
  km_al_cargar: '',
  precio_por_litro: '',
  responsable: '',
  observaciones: '',
}

const supabase = createClient()

export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [stockActual, setStockActual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Carga | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [carRes, camRes, choRes, viaRes, recRes] = await Promise.all([
      supabase
        .from('cargas_combustible')
        .select('*, camiones(chapa), choferes(nombre), viajes(origen, destino)')
        .order('fecha', { ascending: false }),
      supabase.from('camiones').select('id, chapa, marca, modelo').order('chapa'),
      supabase.from('choferes').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('viajes').select('id, origen, destino, fecha').order('fecha', { ascending: false }).limit(50),
      supabase.from('recepciones_combustible').select('litros'),
    ])
    if (carRes.data) setCargas(carRes.data as Carga[])
    if (camRes.data) setCamiones(camRes.data)
    if (choRes.data) setChoferes(choRes.data)
    if (viaRes.data) setViajes(viaRes.data)

    if (recRes.data && carRes.data) {
      const totalRec = (recRes.data as { litros: number }[]).reduce((s, r) => s + r.litros, 0)
      const totalCar = (carRes.data as Carga[]).reduce((s, c) => s + c.litros, 0)
      setStockActual(totalRec - totalCar)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function openNew() {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, fecha: new Date().toISOString().slice(0, 10) })
    setErrors({})
    setShowModal(true)
  }

  function openEdit(c: Carga) {
    setEditItem(c)
    setForm({
      fecha: c.fecha,
      camion_id: c.camion_id ?? '',
      chofer_id: c.chofer_id ?? '',
      viaje_id: c.viaje_id ?? '',
      tipo_combustible: c.tipo_combustible,
      litros: c.litros.toString(),
      km_al_cargar: c.km_al_cargar?.toString() ?? '',
      precio_por_litro: c.precio_por_litro?.toString() ?? '',
      responsable: c.responsable ?? '',
      observaciones: c.observaciones ?? '',
    })
    setErrors({})
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.camion_id) e.camion_id = 'El camión es obligatorio'
    if (!form.litros || Number(form.litros) <= 0) e.litros = 'Los litros deben ser mayores a 0'
    if (!editItem && Number(form.litros) > stockActual) {
      e.litros = `Stock insuficiente. Disponible: ${stockActual.toLocaleString('es-PY')} L`
    }
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
      chofer_id: form.chofer_id || null,
      viaje_id: form.viaje_id || null,
      tipo_combustible: form.tipo_combustible,
      litros: Number(form.litros),
      km_al_cargar: form.km_al_cargar ? Number(form.km_al_cargar) : null,
      precio_por_litro: form.precio_por_litro ? Number(form.precio_por_litro) : null,
      responsable: form.responsable.trim() || null,
      observaciones: form.observaciones.trim() || null,
    }

    const { error } = editItem
      ? await supabase.from('cargas_combustible').update(payload).eq('id', editItem.id)
      : await supabase.from('cargas_combustible').insert(payload)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editItem ? 'Carga actualizada' : 'Carga registrada correctamente')
      setShowModal(false)
      loadAll()
    }
    setSaving(false)
  }

  const totalLitros = cargas.reduce((s, c) => s + c.litros, 0)
  const ahora = new Date()
  const ligrosMes = cargas
    .filter(c => {
      const f = new Date(c.fecha + 'T00:00:00')
      return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
    })
    .reduce((s, c) => s + c.litros, 0)

  function getChapa(c: Carga) {
    const cam = Array.isArray(c.camiones) ? c.camiones[0] : c.camiones
    return cam?.chapa ?? '-'
  }

  function getChofer(c: Carga) {
    const ch = Array.isArray(c.choferes) ? c.choferes[0] : c.choferes
    return ch?.nombre ?? '-'
  }

  function getViaje(c: Carga) {
    if (!c.viaje_id) return '-'
    const v = Array.isArray(c.viajes) ? c.viajes[0] : c.viajes
    return v ? `${v.origen} → ${v.destino}` : '-'
  }

  const costoTotal = cargas.reduce((s, c) => {
    if (c.litros && c.precio_por_litro) return s + c.litros * c.precio_por_litro
    return s
  }, 0)

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cargas de Combustible</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de consumo por camión, chofer y viaje</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nueva carga
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Cargado este mes"
          value={loading ? '...' : `${ligrosMes.toLocaleString('es-PY')} L`}
          subtitle="A camiones de la flota"
          icon={Droplets}
          color="orange"
        />
        <StatCard
          title="Total histórico"
          value={loading ? '...' : `${totalLitros.toLocaleString('es-PY')} L`}
          subtitle={`${cargas.length} cargas registradas`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Stock disponible"
          value={loading ? '...' : `${stockActual.toLocaleString('es-PY')} L`}
          subtitle="Según recepciones vs cargas"
          icon={Truck}
          color={stockActual < 500 ? 'red' : 'green'}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : cargas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Droplets size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay cargas registradas</p>
            <button onClick={openNew} className="text-orange-500 hover:underline text-sm">Registrar la primera</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Camión</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Chofer</th>
                  <th className="px-5 py-3 font-medium">Litros</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Km al cargar</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Precio/L</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Viaje</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Responsable</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargas.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{getChapa(c)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">{getChofer(c)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-orange-600">
                      {c.litros.toLocaleString('es-PY')} L
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {c.km_al_cargar ? c.km_al_cargar.toLocaleString('es-PY') + ' km' : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                      {c.precio_por_litro ? `₲ ${c.precio_por_litro.toLocaleString('es-PY')}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell max-w-[160px] truncate">
                      {getViaje(c)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell">
                      {c.responsable ?? '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-slate-500 hover:text-orange-600 transition"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {costoTotal > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total con precio</td>
                    <td className="px-5 py-3 text-sm font-bold text-orange-600">{totalLitros.toLocaleString('es-PY')} L</td>
                    <td colSpan={2} className="px-5 py-3 text-sm font-bold text-slate-800 hidden lg:table-cell">
                      ₲ {costoTotal.toLocaleString('es-PY')}
                    </td>
                    <td colSpan={3} className="hidden xl:table-cell" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nueva / Editar carga */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">
                {editItem ? 'Editar carga' : 'Nueva carga de combustible'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!editItem && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
                  Stock disponible: <strong>{stockActual.toLocaleString('es-PY')} L</strong>
                </div>
              )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Camión <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.camion_id ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.camion_id}
                    onChange={e => setForm(f => ({ ...f, camion_id: e.target.value }))}
                  >
                    <option value="">Seleccionar...</option>
                    {camiones.map(c => <option key={c.id} value={c.id}>{c.chapa} - {c.marca}</option>)}
                  </select>
                  {errors.camion_id && <p className="text-red-500 text-xs mt-1">{errors.camion_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chofer</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.chofer_id}
                    onChange={e => setForm(f => ({ ...f, chofer_id: e.target.value }))}
                  >
                    <option value="">Sin asignar</option>
                    {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Viaje relacionado</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.viaje_id}
                  onChange={e => setForm(f => ({ ...f, viaje_id: e.target.value }))}
                >
                  <option value="">Sin viaje</option>
                  {viajes.map(v => (
                    <option key={v.id} value={v.id}>
                      {new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-PY')} · {v.origen} → {v.destino}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de combustible</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.tipo_combustible}
                    onChange={e => setForm(f => ({ ...f, tipo_combustible: e.target.value }))}
                  >
                    <option value="Gasoil">Gasoil</option>
                    <option value="Nafta común">Nafta común</option>
                    <option value="Nafta premium">Nafta premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Litros <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.litros ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.litros}
                    onChange={e => setForm(f => ({ ...f, litros: e.target.value }))}
                    placeholder="0"
                  />
                  {errors.litros && <p className="text-red-500 text-xs mt-1">{errors.litros}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Km al cargar</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.km_al_cargar}
                    onChange={e => setForm(f => ({ ...f, km_al_cargar: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio / L (₲)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.precio_por_litro}
                    onChange={e => setForm(f => ({ ...f, precio_por_litro: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              {form.litros && form.precio_por_litro && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  Costo estimado: ₲ {(Number(form.litros) * Number(form.precio_por_litro)).toLocaleString('es-PY')}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.responsable}
                  onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                  placeholder="Nombre del responsable"
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
                {editItem ? 'Guardar cambios' : 'Registrar carga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
