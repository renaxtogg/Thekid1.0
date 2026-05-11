'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Shield, CheckCircle, X, Pencil, Power,
  Loader2, KeyRound, Eye, EyeOff, Search, UserX
} from 'lucide-react'
import StatCard from '@/components/StatCard'

interface UserRow {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  chofer: 'Chofer',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  encargado: 'bg-blue-100 text-blue-700',
  chofer: 'bg-slate-100 text-slate-600',
}

const EMPTY_CREATE = { name: '', email: '', password: '', confirm_password: '', role: '', is_active: true }
const EMPTY_EDIT = { name: '', email: '', role: '' }
const EMPTY_PWD = { password: '', confirm_password: '' }

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [pwdForm, setPwdForm] = useState(EMPTY_PWD)

  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({})

  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Error al cargar usuarios', 'error')
        return
      }
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadUsers() }, [loadUsers])

  // Filtros aplicados
  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || u.role === filterRole
    const matchStatus = !filterStatus || (filterStatus === 'activo' ? u.is_active : !u.is_active)
    return matchSearch && matchRole && matchStatus
  })

  // Estadísticas
  const totalActive = users.filter(u => u.is_active).length
  const totalAdmins = users.filter(u => u.role === 'admin').length
  const totalEncargados = users.filter(u => u.role === 'encargado').length

  // ─── Crear usuario ────────────────────────────────────────────────────────

  function validateCreate() {
    const errs: Record<string, string> = {}
    if (!createForm.name.trim()) errs.name = 'El nombre es requerido'
    if (!createForm.email.trim()) errs.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errs.email = 'Email inválido'
    if (!createForm.password) errs.password = 'La contraseña es requerida'
    else if (createForm.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (!createForm.confirm_password) errs.confirm_password = 'Confirmá la contraseña'
    else if (createForm.password !== createForm.confirm_password) errs.confirm_password = 'Las contraseñas no coinciden'
    if (!createForm.role) errs.role = 'El rol es requerido'
    setCreateErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleCreate() {
    if (!validateCreate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
          is_active: createForm.is_active,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'error'); return }
      showToast('Usuario creado correctamente')
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      loadUsers()
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Editar usuario ───────────────────────────────────────────────────────

  function openEdit(u: UserRow) {
    setEditForm({ name: u.name, email: u.email, role: u.role })
    setEditErrors({})
    setSelectedId(u.id)
    setShowEdit(true)
  }

  function validateEdit() {
    const errs: Record<string, string> = {}
    if (!editForm.name.trim()) errs.name = 'El nombre es requerido'
    if (!editForm.email.trim()) errs.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) errs.email = 'Email inválido'
    if (!editForm.role) errs.role = 'El rol es requerido'
    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleEdit() {
    if (!validateEdit() || !selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name.trim(), email: editForm.email.trim(), role: editForm.role }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'error'); return }
      showToast('Usuario actualizado correctamente')
      setShowEdit(false)
      loadUsers()
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Cambiar contraseña ───────────────────────────────────────────────────

  function openPwd(id: string) {
    setPwdForm(EMPTY_PWD)
    setPwdErrors({})
    setSelectedId(id)
    setShowPwd(true)
  }

  function validatePwd() {
    const errs: Record<string, string> = {}
    if (!pwdForm.password) errs.password = 'La contraseña es requerida'
    else if (pwdForm.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (!pwdForm.confirm_password) errs.confirm_password = 'Confirmá la contraseña'
    else if (pwdForm.password !== pwdForm.confirm_password) errs.confirm_password = 'Las contraseñas no coinciden'
    setPwdErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleChangePwd() {
    if (!validatePwd() || !selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${selectedId}/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdForm.password }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'error'); return }
      showToast('Contraseña actualizada correctamente')
      setShowPwd(false)
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Activar / Desactivar ─────────────────────────────────────────────────

  async function handleToggleActive(u: UserRow) {
    const action = u.is_active ? 'deactivate' : 'activate'
    try {
      const res = await fetch(`/api/users/${u.id}/${action}`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'error'); return }
      showToast(data.message)
      loadUsers()
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  // ─── UI ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">Administración de usuarios y roles del sistema</p>
        </div>
        <button
          onClick={() => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setShowCreate(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Usuarios activos" value={String(totalActive)} subtitle={`de ${users.length} en total`} icon={Users} color="blue" />
        <StatCard title="Administradores" value={String(totalAdmins)} subtitle="Acceso completo" icon={Shield} color="purple" />
        <StatCard title="Encargados" value={String(totalEncargados)} subtitle="Acceso operativo" icon={CheckCircle} color="green" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="text-sm text-slate-700 outline-none w-full bg-transparent"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 outline-none"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="encargado">Encargado</option>
          <option value="chofer">Chofer</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Fecha creación</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <UserX className="mx-auto mb-2" size={24} />
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-orange-600 text-xs font-bold uppercase">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 hidden lg:table-cell">
                      {new Date(u.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openPwd(u.id)}
                          title="Cambiar contraseña"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          title={u.is_active ? 'Desactivar' : 'Activar'}
                          className={`p-1.5 rounded-lg transition ${u.is_active
                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Crear usuario ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Nuevo usuario</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${createErrors.name ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="Nombre completo"
                />
                {createErrors.name && <p className="text-xs text-red-500 mt-1">{createErrors.name}</p>}
              </div>
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${createErrors.email ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="usuario@email.com"
                />
                {createErrors.email && <p className="text-xs text-red-500 mt-1">{createErrors.email}</p>}
              </div>
              {/* Contraseña */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showCreatePwd ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${createErrors.password ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button type="button" onClick={() => setShowCreatePwd(v => !v)} className="absolute right-2.5 top-2.5 text-slate-400">
                    {showCreatePwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {createErrors.password && <p className="text-xs text-red-500 mt-1">{createErrors.password}</p>}
              </div>
              {/* Confirmar contraseña */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar contraseña *</label>
                <div className="relative">
                  <input
                    type={showCreateConfirm ? 'text' : 'password'}
                    value={createForm.confirm_password}
                    onChange={e => setCreateForm(f => ({ ...f, confirm_password: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${createErrors.confirm_password ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="Repetí la contraseña"
                  />
                  <button type="button" onClick={() => setShowCreateConfirm(v => !v)} className="absolute right-2.5 top-2.5 text-slate-400">
                    {showCreateConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {createErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{createErrors.confirm_password}</p>}
              </div>
              {/* Rol */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rol *</label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${createErrors.role ? 'border-red-400' : 'border-slate-200'}`}
                >
                  <option value="">Seleccionar rol...</option>
                  <option value="admin">Administrador</option>
                  <option value="encargado">Encargado</option>
                  <option value="chofer">Chofer</option>
                </select>
                {createErrors.role && <p className="text-xs text-red-500 mt-1">{createErrors.role}</p>}
              </div>
              {/* Estado */}
              <div className="flex items-center gap-3">
                <input
                  id="create-active"
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={e => setCreateForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500"
                />
                <label htmlFor="create-active" className="text-sm text-slate-700">Usuario activo</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-xl transition"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Editar usuario ────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Editar usuario</h2>
              <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${editErrors.name ? 'border-red-400' : 'border-slate-200'}`}
                />
                {editErrors.name && <p className="text-xs text-red-500 mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${editErrors.email ? 'border-red-400' : 'border-slate-200'}`}
                />
                {editErrors.email && <p className="text-xs text-red-500 mt-1">{editErrors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rol *</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${editErrors.role ? 'border-red-400' : 'border-slate-200'}`}
                >
                  <option value="admin">Administrador</option>
                  <option value="encargado">Encargado</option>
                  <option value="chofer">Chofer</option>
                </select>
                {editErrors.role && <p className="text-xs text-red-500 mt-1">{editErrors.role}</p>}
              </div>
              <p className="text-xs text-slate-400">Para cambiar la contraseña, usá la opción "Cambiar contraseña" en la tabla.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowEdit(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-xl transition"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Cambiar contraseña ────────────────────────────────────── */}
      {showPwd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Cambiar contraseña</h2>
              <button onClick={() => setShowPwd(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nueva contraseña *</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={pwdForm.password}
                    onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${pwdErrors.password ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-2.5 top-2.5 text-slate-400">
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdErrors.password && <p className="text-xs text-red-500 mt-1">{pwdErrors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar nueva contraseña *</label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={pwdForm.confirm_password}
                    onChange={e => setPwdForm(f => ({ ...f, confirm_password: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${pwdErrors.confirm_password ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="Repetí la contraseña"
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-2.5 top-2.5 text-slate-400">
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{pwdErrors.confirm_password}</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowPwd(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
                Cancelar
              </button>
              <button
                onClick={handleChangePwd}
                disabled={saving}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-xl transition"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Actualizar contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
