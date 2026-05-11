'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, TrendingUp, DollarSign, X, Pencil, Power, Loader2 } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase/client'

interface Cliente {
  id: string
  nombre: string
  ruc: string | null
  telefono: string | null
  direccion: string | null
  contacto: string | null
  tipo: 'flete' | 'combustible' | 'ambos'
  activo: boolean
  created_at: string
}

const EMPTY_FORM = {
  nombre: '',
  ruc: '',
  telefono: '',
  direccion: '',
  contacto: '',
  tipo: 'flete' as Cliente['tipo'],
}

const tipoColorMap: Record<string, string> = {
  flete: 'bg-blue-100 text-blue-700',
  combustible: 'bg-orange-100 text-orange-700',
  ambos: 'bg-purple-100 text-purple-700',
}

const tipoLabelMap: Record<string, string> = {
  flete: 'Flete',
  combustible: 'Combustible',
  ambos: 'Ambos',
}

const supabase = createClient()

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const loadClientes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setClientes(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadClientes() }, [loadClientes])

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

  function openEdit(c: Cliente) {
    setForm({
      nombre: c.nombre,
      ruc: c.ruc || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      contacto: c.contacto || '',
      tipo: c.tipo,
    })
    setErrors({})
    setEditingId(c.id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre / razón social es obligatorio'
    if (!form.telefono.trim() && !form.ruc.trim()) e.telefono = 'El teléfono o RUC son obligatorios'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      ruc: form.ruc.trim() || null,
      telefono: form.telefono.trim() || null,
      direccion: form.direccion.trim() || null,
      contacto: form.contacto.trim() || null,
      tipo: form.tipo,
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('clientes').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('clientes').insert(payload))
    }
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(editingId ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente')
      setShowModal(false)
      loadClientes()
    }
    setSaving(false)
  }

  async function handleToggleActive(c: Cliente) {
    const { error } = await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id)
    if (error) showToast('Error al actualizar estado', 'error')
    else { showToast(c.activo ? 'Cliente desactivado' : 'Cliente activado'); loadClientes() }
  }

  const activos = clientes.filter(c => c.activo).length

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión comercial y cuentas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total clientes" value={String(clientes.length)} subtitle="Registrados" icon={Users} color="blue" />
        <StatCard title="Activos" value={String(activos)} subtitle="Clientes activos" icon={TrendingUp} color="green" />
        <StatCard title="Inactivos" value={String(clientes.length - activos)} subtitle="Desactivados" icon={DollarSign} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listado de clientes</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-3">No hay clientes registrados</p>
            <button onClick={openCreate} className="text-orange-500 hover:underline text-sm">Agregar el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Nombre / Razón social</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">RUC</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Teléfono</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Contacto</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{c.nombre}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.ruc || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{c.telefono || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tipoColorMap[c.tipo]}`}>
                        {tipoLabelMap[c.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{c.contacto || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
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
              <h2 className="font-semibold text-slate-800">{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Razón social <span className="text-red-500">*</span></label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Agro San Pedro S.A."
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">RUC / Documento</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.ruc}
                    onChange={e => setForm(f => ({ ...f, ruc: e.target.value }))}
                    placeholder="Ej: 80012345-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.telefono ? 'border-red-400' : 'border-slate-300'}`}
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    placeholder="Ej: 021 345 678"
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
                  placeholder="Dirección del cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Persona de contacto</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.contacto}
                    onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                    placeholder="Ej: Ing. Molinas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de cliente</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Cliente['tipo'] }))}
                  >
                    <option value="flete">Flete</option>
                    <option value="combustible">Combustible</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
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
                {editingId ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
