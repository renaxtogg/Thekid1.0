'use client'

import { useState, useEffect, useCallback } from 'react'
import { Receipt, Plus, TrendingDown, X, Loader2, Ban } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Gasto {
  id: string
  fecha: string
  categoria: string
  descripcion: string
  monto: number
  camion_id: string | null
  chofer_id: string | null
  viaje_id: string | null
  cliente_id: string | null
  metodo_pago: string | null
  numero_comprobante: string | null
  comprobante: string | null
  observaciones: string | null
  estado: string
  camiones: { chapa: string } | null
  choferes: { nombre: string } | null
  viajes: { origen: string; destino: string } | null
}

interface Camion { id: string; chapa: string; marca: string; modelo: string }
interface Chofer { id: string; nombre: string }
interface Viaje { id: string; origen: string; destino: string; fecha: string }

const CATEGORIAS = [
  'Combustible', 'Peaje', 'Mantenimiento', 'Cubiertas', 'Repuestos',
  'Viáticos', 'Lavado', 'Seguro', 'Habilitación', 'Taller', 'Otros',
]

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro']

const EMPTY_FORM = {
  fecha: new Date().toISOString().slice(0, 10),
  categoria: 'Combustible',
  descripcion: '',
  monto: '',
  camion_id: '',
  chofer_id: '',
  viaje_id: '',
  cliente_id: '',
  metodo_pago: '',
  numero_comprobante: '',
  observaciones: '',
}

const CAT_COLORS: Record<string, string> = {
  Combustible: 'bg-orange-100 text-orange-700',
  Peaje: 'bg-slate-100 text-slate-600',
  Mantenimiento: 'bg-blue-100 text-blue-700',
  Cubiertas: 'bg-yellow-100 text-yellow-700',
  Repuestos: 'bg-amber-100 text-amber-700',
  'Viáticos': 'bg-purple-100 text-purple-700',
  Lavado: 'bg-teal-100 text-teal-700',
  Seguro: 'bg-green-100 text-green-700',
  'Habilitación': 'bg-indigo-100 text-indigo-700',
  Taller: 'bg-cyan-100 text-cyan-700',
  Otros: 'bg-slate-100 text-slate-500',
}

const supabase = createClient()

function getName<T extends { id: string }>(list: T[], id: string | null, key: keyof T): string {
  if (!id) return '-'
  const item = list.find(i => i.id === id)
  return item ? String(item[key]) : '-'
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Gasto | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [filterCat, setFilterCat] = useState('todas')

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [gasRes, camRes, choRes, viaRes] = await Promise.all([
      supabase
        .from('gastos')
        .select('*, camiones(chapa), choferes(nombre), viajes(origen, destino)')
        .neq('estado', 'anulado')
        .order('fecha', { ascending: false }),
      supabase.from('camiones').select('id, chapa, marca, modelo').order('chapa'),
      supabase.from('choferes').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('viajes').select('id, origen, destino, fecha').order('fecha', { ascending: false }).limit(50),
    ])
    if (gasRes.data) setGastos(gasRes.data as Gasto[])
    if (camRes.data) setCamiones(camRes.data)
    if (choRes.data) setChoferes(choRes.data)
    if (viaRes.data) setViajes(viaRes.data)
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

  function openEdit(g: Gasto) {
    setEditItem(g)
    setForm({
      fecha: g.fecha,
      categoria: g.categoria,
      descripcion: g.descripcion,
      monto: g.monto.toString(),
      camion_id: g.camion_id ?? '',
      chofer_id: g.chofer_id ?? '',
      viaje_id: g.viaje_id ?? '',
      cliente_id: g.cliente_id ?? '',
      metodo_pago: g.metodo_pago ?? '',
      numero_comprobante: g.numero_comprobante ?? g.comprobante ?? '',
      observaciones: g.observaciones ?? '',
    })
    setErrors({})
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es obligatoria'
    if (!form.monto || Number(form.monto) <= 0) e.monto = 'El monto debe ser mayor a 0'
    if (!form.fecha) e.fecha = 'La fecha es obligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      fecha: form.fecha,
      categoria: form.categoria,
      descripcion: form.descripcion.trim(),
      monto: Number(form.monto),
      camion_id: form.camion_id || null,
      chofer_id: form.chofer_id || null,
      viaje_id: form.viaje_id || null,
      cliente_id: form.cliente_id || null,
      metodo_pago: form.metodo_pago || null,
      numero_comprobante: form.numero_comprobante.trim() || null,
      observaciones: form.observaciones.trim() || null,
      estado: 'activo',
    }

    const { error } = editItem
      ? await supabase.from('gastos').update(payload).eq('id', editItem.id)
      : await supabase.from('gastos').insert(payload)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editItem ? 'Gasto actualizado' : 'Gasto registrado correctamente')
      setShowModal(false)
      loadAll()
    }
    setSaving(false)
  }

  async function handleAnular(g: Gasto) {
    if (!confirm(`¿Anular el gasto "${g.descripcion}"? Quedará registrado en el historial.`)) return
    const { error } = await supabase.from('gastos').update({ estado: 'anulado' }).eq('id', g.id)
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Gasto anulado')
      loadAll()
    }
  }

  const ahora = new Date()
  const mesActual = gastos.filter(g => {
    const f = new Date(g.fecha + 'T00:00:00')
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
  })
  const totalMes = mesActual.reduce((s, g) => s + g.monto, 0)
  const totalGeneral = gastos.reduce((s, g) => s + g.monto, 0)

  const filtrados = filterCat === 'todas' ? gastos : gastos.filter(g => g.categoria === filterCat)

  function getViajeName(g: Gasto) {
    if (!g.viaje_id) return '-'
    const v = Array.isArray(g.viajes) ? g.viajes[0] : g.viajes
    return v ? `${v.origen} → ${v.destino}` : '-'
  }

  function getChoferName(g: Gasto) {
    const ch = Array.isArray(g.choferes) ? g.choferes[0] : g.choferes
    return ch?.nombre ?? '-'
  }

  function getCamionChapa(g: Gasto) {
    const cam = Array.isArray(g.camiones) ? g.camiones[0] : g.camiones
    return cam?.chapa ?? '-'
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Registro y clasificación de egresos operativos</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nuevo gasto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Gastos este mes"
          value={loading ? '...' : `₲ ${totalMes.toLocaleString('es-PY')}`}
          subtitle={`${mesActual.length} registros`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Total registrado"
          value={loading ? '...' : `₲ ${totalGeneral.toLocaleString('es-PY')}`}
          subtitle={`${gastos.length} gastos activos`}
          icon={Receipt}
          color="orange"
        />
        <StatCard
          title="Categorías"
          value={loading ? '...' : String(new Set(gastos.map(g => g.categoria)).size)}
          subtitle="Tipos distintos"
          icon={Receipt}
          color="blue"
        />
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterCat('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterCat === 'todas' ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          Todas ({gastos.length})
        </button>
        {CATEGORIAS.filter(cat => gastos.some(g => g.categoria === cat)).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterCat === cat ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {cat} ({gastos.filter(g => g.categoria === cat).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay gastos registrados</p>
            <button onClick={openNew} className="text-orange-500 hover:underline text-sm">Registrar el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Camión</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Chofer</th>
                  <th className="px-5 py-3 font-medium hidden xl:table-cell">Viaje</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Comprobante</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CAT_COLORS[g.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                        {g.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 max-w-[180px] truncate">{g.descripcion}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{getCamionChapa(g)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{getChoferName(g)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden xl:table-cell max-w-[160px] truncate">{getViajeName(g)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                      ₲ {g.monto.toLocaleString('es-PY')}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 hidden lg:table-cell">
                      {g.numero_comprobante ?? g.comprobante ?? '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(g)}
                          className="text-xs text-slate-500 hover:text-orange-600 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleAnular(g)}
                          className="text-xs text-red-400 hover:text-red-600 transition flex items-center gap-1"
                          title="Anular gasto"
                        >
                          <Ban size={12} /> Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nuevo / Editar gasto */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-800">
                {editItem ? 'Editar gasto' : 'Nuevo gasto'}
              </h2>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.descripcion ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Cambio de aceite camión ABD 123"
                />
                {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto (₲) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.monto ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    placeholder="0"
                  />
                  {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Método de pago</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.metodo_pago}
                    onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))}
                  >
                    <option value="">Sin especificar</option>
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Camión</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.camion_id}
                    onChange={e => setForm(f => ({ ...f, camion_id: e.target.value }))}
                  >
                    <option value="">Sin asignar</option>
                    {camiones.map(c => <option key={c.id} value={c.id}>{c.chapa} - {c.marca}</option>)}
                  </select>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">N° Comprobante / Factura</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={form.numero_comprobante}
                  onChange={e => setForm(f => ({ ...f, numero_comprobante: e.target.value }))}
                  placeholder="Ej: F-00456"
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
                {editItem ? 'Guardar cambios' : 'Registrar gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
