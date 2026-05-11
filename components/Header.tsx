'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react'

interface HeaderProps {
  userEmail: string
  onMenuClick: () => void
}

export default function Header({ userEmail, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = userEmail.split('@')[0]

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="text-slate-600 hover:text-slate-900 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <p className="text-slate-400 text-sm">Bienvenido de vuelta</p>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-orange-600" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800 capitalize">{displayName}</p>
              <p className="text-xs text-slate-400">Administrador</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 hidden md:block" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-1">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Sesión activa</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
