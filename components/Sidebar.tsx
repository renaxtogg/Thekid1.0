'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Fuel, Truck, Users, MapPin, DollarSign,
  Droplets, Wrench, Disc, Receipt, UserCheck, BarChart2,
  Settings, ChevronLeft, ChevronRight, X
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'encargado', 'chofer'] },
  { href: '/dashboard/combustible', label: 'Combustible', icon: Fuel, roles: ['admin', 'encargado'] },
  { href: '/dashboard/camiones', label: 'Camiones / Flota', icon: Truck, roles: ['admin', 'encargado'] },
  { href: '/dashboard/choferes', label: 'Choferes', icon: UserCheck, roles: ['admin', 'encargado'] },
  { href: '/dashboard/viajes', label: 'Viajes / Fletes', icon: MapPin, roles: ['admin', 'encargado'] },
  { href: '/dashboard/comisiones', label: 'Comisiones', icon: DollarSign, roles: ['admin', 'encargado'] },
  { href: '/dashboard/cargas', label: 'Cargas de Combustible', icon: Droplets, roles: ['admin', 'encargado'] },
  { href: '/dashboard/mantenimiento', label: 'Mantenimiento', icon: Wrench, roles: ['admin', 'encargado'] },
  { href: '/dashboard/cubiertas', label: 'Cubiertas', icon: Disc, roles: ['admin', 'encargado'] },
  { href: '/dashboard/gastos', label: 'Gastos', icon: Receipt, roles: ['admin', 'encargado'] },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'encargado'] },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart2, roles: ['admin', 'encargado'] },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
  userRole: string
}

export default function Sidebar({ mobileOpen, onMobileClose, userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const visibleItems = navItems.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 flex flex-col z-40 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 h-16 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="bg-orange-500 p-1.5 rounded-md shrink-0">
                <Truck size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">TheKid</span>
            </div>
          )}
          {collapsed && (
            <div className="bg-orange-500 p-1.5 rounded-md mx-auto">
              <Truck size={16} className="text-white" />
            </div>
          )}
          <button
            onClick={onMobileClose}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white hidden lg:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {visibleItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all group
                ${isActive(href)
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-700/50 shrink-0">
            <p className="text-slate-500 text-xs text-center">v1.0 · TheKid</p>
          </div>
        )}
      </aside>
    </>
  )
}
