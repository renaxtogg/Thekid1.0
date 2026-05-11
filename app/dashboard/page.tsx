'use client'

import { useEffect, useState, useCallback } from 'react'
import StatCard from '@/components/StatCard'
import {
  Fuel, Truck, MapPin, DollarSign, AlertTriangle,
  TrendingUp, Users, Wrench, CheckCircle, Clock, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Summary {
  choferes_activos: number
  camiones_activos: number
  camiones_taller: number
  clientes_activos: number
  viajes_total: number
  viajes_pendientes: number
  viajes_completados: number
  comisiones_pendientes_count: number
  comisiones_pendientes_monto: number
  comisiones_pagadas_monto: number
}

interface RecentTrip {
  id: string
  fecha: string
  origen: string
  destino: string
  precio_flete: number
  estado: string
  clientes: { nombre: string } | { nombre: string }[] | null
  choferes: { nombre: string } | { nombre: string }[] | null
}

function clienteNombre(t: RecentTrip): string {
  if (!t.clientes) return '-'
  if (Array.isArray(t.clientes)) return t.clientes[0]?.nombre || '-'
  return t.clientes.nombre
}

function choferNombre(t: RecentTrip): string {
  if (!t.choferes) return '-'
  if (Array.isArray(t.choferes)) return t.choferes[0]?.nombre || '-'
  return t.choferes.nombre
}

const statusColor: Record<string, string> = {
  completado: 'bg-green-100 text-green-700',
  en_ruta: 'bg-blue-100 text-blue-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  cancelado: 'bg-red-100 text-red-700',
}

const statusLabel: Record<string, string> = {
  completado: 'Completado',
  en_ruta: 'En ruta',
  pendiente: 'Pendiente',
  cancelado: 'Cancelado',
}

const supabase = createClient()

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const [
      { count: chofActivos },
      { count: camActivos },
      { count: camTaller },
      { count: clActivos },
      { count: viajesTotal },
      { count: viajesPend },
      { count: viajesComp },
      { data: comPend },
      { data: comPag },
      { data: trips },
    ] = await Promise.all([
      supabase.from('choferes').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('camiones').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
      supabase.from('camiones').select('*', { count: 'exact', head: true }).eq('estado', 'taller'),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('viajes').select('*', { count: 'exact', head: true }),
      supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['pendiente', 'en_ruta']),
      supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('estado', 'completado'),
      supabase.from('comisiones').select('monto').in('estado', ['pendiente', 'parcial']),
      supabase.from('comisiones').select('monto').eq('estado', 'pagado'),
      supabase.from('viajes')
        .select('id, fecha, origen, destino, precio_flete, estado, clientes(nombre), choferes(nombre)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    setSummary({
      choferes_activos: chofActivos ?? 0,
      camiones_activos: camActivos ?? 0,
      camiones_taller: camTaller ?? 0,
      clientes_activos: clActivos ?? 0,
      viajes_total: viajesTotal ?? 0,
      viajes_pendientes: viajesPend ?? 0,
      viajes_completados: viajesComp ?? 0,
      comisiones_pendientes_count: comPend?.length ?? 0,
      comisiones_pendientes_monto: (comPend ?? []).reduce((s, c) => s + Number(c.monto), 0),
      comisiones_pagadas_monto: (comPag ?? []).reduce((s, c) => s + Number(c.monto), 0),
    })
    if (trips) setRecentTrips(trips as unknown as RecentTrip[])
    setLoading(false)
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={22} /> Cargando dashboard...
      </div>
    )
  }

  const s = summary!

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Panel principal</h1>
        <p className="text-slate-500 text-sm mt-0.5">Resumen operativo actualizado</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Choferes activos"
          value={String(s.choferes_activos)}
          subtitle="Disponibles"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Camiones activos"
          value={`${s.camiones_activos}`}
          subtitle={s.camiones_taller > 0 ? `${s.camiones_taller} en taller` : 'En operación'}
          icon={Truck}
          color="green"
        />
        <StatCard
          title="Clientes activos"
          value={String(s.clientes_activos)}
          subtitle="Registrados y activos"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Comisiones pendientes"
          value={s.comisiones_pendientes_monto.toLocaleString('es-PY', { maximumFractionDigits: 0 })}
          subtitle={`${s.comisiones_pendientes_count} comisión${s.comisiones_pendientes_count !== 1 ? 'es' : ''} por pagar`}
          icon={DollarSign}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Viajes registrados"
          value={String(s.viajes_total)}
          subtitle="Total histórico"
          icon={MapPin}
          color="blue"
        />
        <StatCard
          title="Viajes pendientes / en ruta"
          value={String(s.viajes_pendientes)}
          subtitle="Activos actualmente"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Viajes completados"
          value={String(s.viajes_completados)}
          subtitle="Finalizados"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Últimos viajes</h2>
            <a href="/dashboard/viajes" className="text-orange-500 text-sm hover:underline">Ver todos →</a>
          </div>
          {recentTrips.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <MapPin size={30} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay viajes registrados</p>
              <a href="/dashboard/viajes" className="text-orange-500 text-sm hover:underline mt-1 inline-block">Registrar viaje</a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium hidden md:table-cell">Ruta</th>
                    <th className="px-5 py-3 font-medium hidden sm:table-cell">Chofer</th>
                    <th className="px-5 py-3 font-medium">Monto</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{clienteNombre(trip)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                        {trip.origen} → {trip.destino}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{choferNombre(trip)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                        {Number(trip.precio_flete).toLocaleString('es-PY', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[trip.estado] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabel[trip.estado] || trip.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="font-semibold text-slate-800">Resumen financiero</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign size={15} className="text-red-500" />
                Comisiones pendientes
              </div>
              <span className="text-sm font-semibold text-red-600">
                {s.comisiones_pendientes_monto.toLocaleString('es-PY', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle size={15} className="text-green-500" />
                Comisiones pagadas
              </div>
              <span className="text-sm font-semibold text-green-600">
                {s.comisiones_pagadas_monto.toLocaleString('es-PY', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Wrench size={15} className="text-orange-500" />
                Camiones en taller
              </div>
              <span className="text-sm font-semibold text-orange-600">{s.camiones_taller}</span>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <a href="/dashboard/comisiones" className="block text-center text-sm text-orange-500 hover:underline">
                Ver todas las comisiones →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
