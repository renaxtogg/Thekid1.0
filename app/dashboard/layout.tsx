import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener el perfil del usuario para conocer su rol
  // Si no existe perfil (usuarios previos a migration_002), se asume admin para no romper el acceso
  let userRole: string = 'admin'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role) userRole = profile.role
  } catch {
    // La tabla profiles puede no existir aún (antes de migration_002)
  }

  return (
    <DashboardShell userEmail={user.email ?? ''} userRole={userRole}>
      {children}
    </DashboardShell>
  )
}
