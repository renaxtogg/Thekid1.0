import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (callerProfile && callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado: se requiere rol admin' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { password } = body

  if (!password) return NextResponse.json({ error: 'La contraseña es requerida' }, { status: 400 })
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Supabase bcryptea la contraseña internamente — nunca se guarda en texto plano
  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
}
