'use client'

import { useState, useEffect, useCallback } from 'react'
import { Fuel, Plus, TrendingUp, TrendingDown, Package, X, Loader2, Truck } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Recepcion {
  id: string
  fecha: string
  proveedor: string
  tipo_combustible: string
  litros: number
  precio_litro: number
  total: number
  numero_factura: string | null
  created_at: string
}

interface Carga {
  id: string
  fecha: string
  camion_id: string | null
  tipo_combustible: string
  litros: number
  observaciones: string | null
  created_at: string
  camiones: { chapa: string } | null
}

interface Camion { id: string; chapa: string; marca: string; modelo: string }

const EMPTY_RECEPCION = {
  fecha: new Date().toISOString().slice(0, 10),
  proveedor: '',
  tipo_combustible: 'Gasoil',
  litros: '',
  precio_litro: '',
  numero_factura: '',
}

const EMPTY_CARGA = {
  fecha: new Date().toISOString().slice(0, 10),
  camion_id: '',
  tipo_combustible: 'Gasoil',
  litros: '',
  observaciones: '',
}

const supabase = createClient()

export default function CombustiblePage() {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [cargas, setCargas] = useState<Carga[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'recepciones' | 'cargas'>('recepciones')
  const [showRecepcionModal, setShowRecepcionModal] = useState(false)
  const [showCargaModal, setShowCargaModal] = useState(false)
  const [recepcionForm, setRecepcionForm] = useState(EMPTY_RECEPCION)
  const [cargaForm, setCargaForm] = useState(EMPTY_CARGA)
  const [recepcionErrors, setRecepcionErrors] = useState<Record<string, string>>({})
  const [cargaErrors, setCargaErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [recRes, carRes, camRes] = await Promise.all([
      supabase.from('recepciones_combustible').select('*').order('fecha', { ascending: false }),
      supabase.from('cargas_combustible').select('*, camiones(chapa)').order('fecha', { ascending: false }),
      supabase.from('camiones').select('id, chapa, marca, modelo').order('chapa'),
    ])
    if (recRes.data) setRecepciones(recRes.data)
    if (carRes.data) setCargas(carRes.data as Carga[])
    if (camRes.data) setCamiones(camRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const totalRecibido = recepciones.reduce((s, r) => s + r.litros, 0)
  const totalCargado = cargas.reduce((s, c) => s + c.litros, 0)
  const stockActual = totalRecibido - totalCargado

  function validateRecepcion() {
    const e: Record<string, string> = {}
    if (!recepcionForm.proveedor.trim()) e.proveedor = 'El proveedor es obligatorio'
    if (!recepcionForm.litros || Number(recepcionForm.litros) <= 0) e.litros = 'Los litros deben ser mayores a 0'
    if (!recepcionForm.precio_litro || Number(recepcionForm.precio_litro) <= 0) e.precio_litro = 'El precio es obligatorio'
    if (!recepcionForm.fecha) e.fecha = 'La fecha es obligatoria'
    setRecepcionErrors(e)
    return Object.keys(e).length === 0
  }

  function validateCarga() {
    const e: Record<string, string> = {}
    if (!cargaForm.camion_id) e.camion_id = 'El camión es obligatorio'
    if (!cargaForm.litros || Number(cargaForm.litros) <= 0) e.litros = 'Los litros deben ser mayores a 0'
    if (Number(cargaForm.litros) > stockActual) e.litros = `Stock insuficiente. Disponible: ${stockActual.toLocaleString('es-PY')} L`
    if (!cargaForm.fecha) e.fecha = 'La fecha es obligatoria'
    setCargaErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSaveRecepcion() {
    if (!validateRecepcion()) return
    setSaving(true)
    const litros = Number(recepcionForm.litros)
    const precio_litro = Number(recepcionForm.precio_litro)
    const { error } = await supabase.from('recepciones_combustible').insert({
      fecha: recepcionForm.fecha,
      proveedor: recepcionForm.proveedor.trim(),
      tipo_combustible: recepcionForm.tipo_combustible,
      litros,
      precio_litro,
      total: litros * precio_litro,
      numero_factura: recepcionForm.numero_factura.trim() || null,
    })
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Recepción registrada correctamente')
      setShowRecepcionModal(false)
      setRecepcionForm({ ...EMPTY_RECEPCION, fecha: new Date().toISOString().slice(0, 10) })
      loadAll()
    }
    setSaving(false)
  }

  async function handleSaveCarga() {
    if (!validateCarga()) return
    setSaving(true)
    const { error } = await supabase.from('cargas_combustible').insert({
      fecha: cargaForm.fecha,
      camion_id: cargaForm.camion_id || null,
      tipo_combustible: cargaForm.tipo_combustible,
      litros: Number(cargaForm.litros),
      observaciones: cargaForm.observaciones.trim() || null,
    })
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Carga registrada correctamente')
      setShowCargaModal(false)
      setCargaForm({ ...EMPTY_CARGA, fecha: new Date().toISOString().slice(0, 10) })
      loadAll()
    }
    setSaving(false)
  }

  const getCargasCamion = (carga: Carga) => {
    const cam = Array.isArray(carga.camiones) ? carga.camiones[0] : carga.camiones
    return cam?.chapa || '-'
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
          <h1 className="text-2xl font-bold text-slate-800">Combustible</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de recepciones, stock y movimientos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCargaModal(true); setCargaForm({ ...EMPTY_CARGA, fecha: new Date().toISOString().slice(0, 10) }); setCargaErrors({}) }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition"
          >
            <Truck size={15} /> Cargar camión
          </button>
          <button
            onClick={() => { setShowRecepcionModal(true); setRecepcionForm({ ...EMPTY_RECEPCION, fecha: new Date().toISOString().slice(0, 10) }); setRecepcionErrors({}) }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus size={15} /> Nueva recepción
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Stock actual"
          value={loading ? '...' : `${stockActual.toLocaleString('es-PY')} L`}
          subtitle="Total disponible"
          icon={Package}
          color="orange"
        />
        <StatCard
          title="Total recibido"
          value={loading ? '...' : `${totalRecibido.toLocaleString('es-PY')} L`}
          subtitle={`${recepciones.length} recepciones`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Cargado a camiones"
          value={loading ? '...' : `${totalCargado.toLocaleString('es-PY')} L`}
          subtitle={`${cargas.length} cargas`}
          icon={TrendingDown}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('recepciones')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${activeTab === 'recepciones' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Recepciones ({recepciones.length})
        </button>
        <button
          onClick={() => setActiveTab('cargas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${activeTab === 'cargas' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Cargas a camiones ({cargas.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : activeTab === 'recepciones' ? (
          recepciones.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Fuel size={40} className="mx-auto mb-3 opacity-30" />
              <p className="mb-3">No hay recepciones registradas</p>
              <button onClick={() => setShowRecepcionModal(true)} className="text-orange-500 hover:underline text-sm">Registrar la primera</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Proveedor</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Litros</th>
                    <th className="px-5 py-3 font-medium hidden md:table-cell">Precio/L</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium hidden lg:table-cell">Factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recepciones.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-PY')}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.proveedor}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{r.tipo_combustible}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.litros.toLocaleString('es-PY')} L</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 hidden md:table-cell">
                        ₲ {r.precio_litro.toLocaleString('es-PY')}/L
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                        ₲ {r.total.toLocaleString('es-PY')}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{r.numero_factura || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          cargas.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Truck size={40} className="mx-auto mb-3 opacity-30" />
              <p className="mb-3">No hay cargas registradas</p>
              <button onClick={() => setShowCargaModal(true)} className="text-orange-500 hover:underline text-sm">Registrar la primera</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Camión</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Litros</th>
                    <th className="px-5 py-3 font-medium hidden md:table-cell">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargas.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-PY')}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{getCargasCamion(c)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{c.tipo_combustible}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.litros.toLocaleString('es-PY')} L</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal: Nueva recepción */}
      {showRecepcionModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Nueva recepción de combustible</h2>
              <button onClick={() => setShowRecepcionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${recepcionErrors.fecha ? 'border-red-400' : 'border-slate-300'}`}
                  value={recepcionForm.fecha}
                  onChange={e => setRecepcionForm(f => ({ ...f, fecha: e.target.value }))}
                />
                {recepcionErrors.fecha && <p className="text-red-500 text-xs mt-1">{recepcionErrors.fecha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor <span className="text-red-500">*</span></label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${recepcionErrors.proveedor ? 'border-red-400' : 'border-slate-300'}`}
                  value={recepcionForm.proveedor}
                  onChange={e => setRecepcionForm(f => ({ ...f, proveedor: e.target.value }))}
                  placeholder="Ej: Copetrol S.A."
                />
                {recepcionErrors.proveedor && <p className="text-red-500 text-xs mt-1">{recepcionErrors.proveedor}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de combustible</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={recepcionForm.tipo_combustible}
                  onChange={e => setRecepcionForm(f => ({ ...f, tipo_combustible: e.target.value }))}
                >
                  <option value="Gasoil">Gasoil</option>
                  <option value="Nafta común">Nafta común</option>
                  <option value="Nafta premium">Nafta premium</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Litros <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${recepcionErrors.litros ? 'border-red-400' : 'border-slate-300'}`}
                    value={recepcionForm.litros}
                    onChange={e => setRecepcionForm(f => ({ ...f, litros: e.target.value }))}
                    placeholder="0"
                  />
                  {recepcionErrors.litros && <p className="text-red-500 text-xs mt-1">{recepcionErrors.litros}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio / L <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${recepcionErrors.precio_litro ? 'border-red-400' : 'border-slate-300'}`}
                    value={recepcionForm.precio_litro}
                    onChange={e => setRecepcionForm(f => ({ ...f, precio_litro: e.target.value }))}
                    placeholder="0"
                  />
                  {recepcionErrors.precio_litro && <p className="text-red-500 text-xs mt-1">{recepcionErrors.precio_litro}</p>}
                </div>
              </div>
              {recepcionForm.litros && recepcionForm.precio_litro && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  Total estimado: ₲ {(Number(recepcionForm.litros) * Number(recepcionForm.precio_litro)).toLocaleString('es-PY')}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">N° Factura</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={recepcionForm.numero_factura}
                  onChange={e => setRecepcionForm(f => ({ ...f, numero_factura: e.target.value }))}
                  placeholder="Ej: F-00123"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowRecepcionModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSaveRecepcion}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Registrar recepción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Carga a camión */}
      {showCargaModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Cargar combustible a camión</h2>
              <button onClick={() => setShowCargaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
                Stock disponible: <strong>{stockActual.toLocaleString('es-PY')} L</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${cargaErrors.fecha ? 'border-red-400' : 'border-slate-300'}`}
                  value={cargaForm.fecha}
                  onChange={e => setCargaForm(f => ({ ...f, fecha: e.target.value }))}
                />
                {cargaErrors.fecha && <p className="text-red-500 text-xs mt-1">{cargaErrors.fecha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Camión <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${cargaErrors.camion_id ? 'border-red-400' : 'border-slate-300'}`}
                  value={cargaForm.camion_id}
                  onChange={e => setCargaForm(f => ({ ...f, camion_id: e.target.value }))}
                >
                  <option value="">Seleccionar camión...</option>
                  {camiones.map(c => <option key={c.id} value={c.id}>{c.chapa} - {c.marca} {c.modelo}</option>)}
                </select>
                {cargaErrors.camion_id && <p className="text-red-500 text-xs mt-1">{cargaErrors.camion_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de combustible</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={cargaForm.tipo_combustible}
                  onChange={e => setCargaForm(f => ({ ...f, tipo_combustible: e.target.value }))}
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
                  max={stockActual}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${cargaErrors.litros ? 'border-red-400' : 'border-slate-300'}`}
                  value={cargaForm.litros}
                  onChange={e => setCargaForm(f => ({ ...f, litros: e.target.value }))}
                  placeholder="0"
                />
                {cargaErrors.litros && <p className="text-red-500 text-xs mt-1">{cargaErrors.litros}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  value={cargaForm.observaciones}
                  onChange={e => setCargaForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowCargaModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSaveCarga}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Registrar carga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
