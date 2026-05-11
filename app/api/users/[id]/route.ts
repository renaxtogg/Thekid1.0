import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado: se requiere rol admin' }, { status: 403 }), supabase: null }
  }

  return { error: null, supabase, callerId: user.id }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const admin = createAdminClient()

  const { data: { user: authUser }, error: userError } = await admin.auth.admin.getUserById(id)
  if (userError || !authUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const { data: profile } = await supabase!.from('profiles').select('*').eq('id', id).maybeSingle()

  return NextResponse.json({
    user: {
      id: authUser.id,
      email: authUser.email ?? '',
      name: profile?.name ?? authUser.email?.split('@')[0] ?? '',
      role: profile?.role ?? 'admin',
      is_active: profile?.is_active ?? true,
      created_at: authUser.created_at,
    },
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const { name, email, role } = body

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'El email no tiene un formato válido' }, { status: 400 })
  }
  if (!['admin', 'encargado', 'chofer'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  // Protección: no cambiar rol si es el único admin activo
  if (role !== 'admin') {
    const { data: admins } = await supabase!
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true)

    const isCurrentAdmin = admins?.some(a => a.id === id)
    if (isCurrentAdmin && (admins?.length ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'No se puede cambiar el rol del único administrador activo' },
        { status: 400 }
      )
    }
  }

  const admin = createAdminClient()

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: email.trim().toLowerCase(),
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: profileError } = await admin
    .from('profiles')
    .update({ name: name.trim(), role })
    .eq('id', id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({ message: 'Usuario actualizado correctamente' })
}
