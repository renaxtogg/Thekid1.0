import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  _request: Request,
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

  // Protección: no desactivar al último admin activo
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)

  const isTargetAdmin = admins?.some(a => a.id === id)
  if (isTargetAdmin && (admins?.length ?? 0) <= 1) {
    return NextResponse.json(
      { error: 'No se puede desactivar al único administrador activo' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ is_active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Usuario desactivado correctamente' })
}
