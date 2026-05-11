'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface DashboardShellProps {
  userEmail: string
  userRole: string
  children: React.ReactNode
}

export default function DashboardShell({ userEmail, userRole, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} userRole={userRole} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header userEmail={userEmail} userRole={userRole} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
