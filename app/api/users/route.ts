import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado: se requiere rol admin' }, { status: 403 }), supabase: null }
  }

  return { error: null, supabase }
}

export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()

  const { data: { users: authUsers }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const { data: profiles } = await supabase!.from('profiles').select('*')

  const users = authUsers.map(u => {
    const p = profiles?.find(p => p.id === u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      name: p?.name ?? (u.email?.split('@')[0] ?? ''),
      role: p?.role ?? 'admin',
      is_active: p?.is_active ?? true,
      created_at: u.created_at,
    }
  })

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { name, email, password, role, is_active } = body

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'El email no tiene un formato válido' }, { status: 400 })
  }
  if (!password) return NextResponse.json({ error: 'La contraseña es requerida' }, { status: 400 })
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }
  if (!['admin', 'encargado', 'chofer'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    if (msg.includes('already been registered') || msg.includes('already exists') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: newUser.user.id, name: name.trim(), role, is_active: is_active ?? true })

  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Usuario creado correctamente' }, { status: 201 })
}
