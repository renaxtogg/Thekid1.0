'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Download, FileText, TrendingUp, Truck, DollarSign, Fuel, Users, Loader2, AlertTriangle, X, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type ReportType = 'trips' | 'commissions' | 'fuel' | 'expenses' | 'tires' | 'profitability'

interface SelectOption { id: string; label: string }

const REPORT_TYPES = [
  { value: 'trips', label: 'Reporte de Viajes / Fletes' },
  { value: 'commissions', label: 'Reporte de Comisiones' },
  { value: 'fuel', label: 'Reporte de Combustible' },
  { value: 'expenses', label: 'Reporte de Gastos' },
  { value: 'tires', label: 'Reporte de Cubiertas' },
  { value: 'profitability', label: 'Reporte de Rentabilidad' },
]

const GASTOS_CATEGORIAS = ['Combustible', 'Peaje', 'Mantenimiento', 'Cubiertas', 'Repuestos', 'Viáticos', 'Lavado', 'Seguro', 'Habilitación', 'Taller', 'Otros']
const COMBUSTIBLE_TIPOS = ['gasoil', 'nafta', 'gnc']
const CUBIERTA_ESTADOS = ['instalada', 'retirada', 'dañada', 'descartada']

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function fmtLitros(n: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n) + ' L'
}

export default function ReportesPage() {
  const [reportType, setReportType] = useState<ReportType | ''>('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [choferes, setChoferes] = useState<SelectOption[]>([])
  const [camiones, setCamiones] = useState<SelectOption[]>([])
  const [clientes, setClientes] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRefs, setLoadingRefs] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<{ rows: any[]; totales: any } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | 'csv' | null>(null)

  useEffect(() => {
    setLoadingRefs(true)
    Promise.all([
      supabase.from('choferes').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('camiones').select('id, chapa').order('chapa'),
      supabase.from('clientes').select('id, nombre').eq('activo', true).order('nombre'),
    ]).then(([ch, ca, cl]) => {
      setChoferes((ch.data ?? []).map(x => ({ id: x.id, label: x.nombre })))
      setCamiones((ca.data ?? []).map(x => ({ id: x.id, label: x.chapa })))
      setClientes((cl.data ?? []).map(x => ({ id: x.id, label: x.nombre })))
      setLoadingRefs(false)
    })
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setResult(null)
    setError(null)
  }, [])

  const handleTypeChange = useCallback((type: ReportType | '') => {
    setReportType(type)
    setFilters({})
    setResult(null)
    setError(null)
  }, [])

  const generate = useCallback(async () => {
    if (!reportType) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, filters }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al generar reporte'); return }
      setResult(data)
    } catch {
      setError('Error de conexión al generar el reporte')
    } finally {
      setLoading(false)
    }
  }, [reportType, filters])

  const exportCSV = useCallback(() => {
    if (!result?.rows.length) return
    setExporting('csv')
    try {
      const headers = Object.keys(result.rows[0])
      const csvContent = [
        headers.join(','),
        ...result.rows.map(row =>
          headers.map(h => {
            const val = String(row[h] ?? '')
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }, [result, reportType])

  const exportExcel = useCallback(async () => {
    if (!result?.rows.length) return
    setExporting('excel')
    try {
      const XLSX = (await import('xlsx')).default
      const label = REPORT_TYPES.find(r => r.value === reportType)?.label ?? reportType
      const wb = XLSX.utils.book_new()
      const wsData = [
        Object.keys(result.rows[0]),
        ...result.rows.map(row => Object.values(row)),
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31))
      const from = filters.dateFrom ?? ''
      const to = filters.dateTo ?? ''
      const suffix = from && to ? `_${from}_${to}` : ''
      XLSX.writeFile(wb, `reporte_${reportType}${suffix}.xlsx`)
    } catch {
      setError('Error al exportar Excel')
    } finally {
      setExporting(null)
    }
  }, [result, reportType, filters])

  const exportPDF = useCallback(async () => {
    if (!result?.rows.length) return
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const label = REPORT_TYPES.find(r => r.value === reportType)?.label ?? reportType
      const doc = new jsPDF({ orientation: 'landscape' })

      doc.setFontSize(18)
      doc.setTextColor(30, 41, 59)
      doc.text('GRUPO ALPESA SA', 14, 18)

      doc.setFontSize(13)
      doc.setTextColor(71, 85, 105)
      doc.text(label, 14, 27)

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      const now = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      doc.text(`Generado: ${now}`, 14, 34)

      if (filters.dateFrom || filters.dateTo) {
        const periodo = `Período: ${filters.dateFrom ?? '—'} al ${filters.dateTo ?? '—'}`
        doc.text(periodo, 14, 40)
      }

      const headers = Object.keys(result.rows[0])
      const rows = result.rows.map(r => headers.map(h => String(r[h] ?? '')))

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: filters.dateFrom || filters.dateTo ? 46 : 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      })

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 8)
      }

      const from = filters.dateFrom ?? ''
      const to = filters.dateTo ?? ''
      const suffix = from && to ? `_${from}_${to}` : ''
      doc.save(`reporte_${reportType}${suffix}.pdf`)
    } catch {
      setError('Error al exportar PDF')
    } finally {
      setExporting(null)
    }
  }, [result, reportType, filters])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Análisis e informes con filtros y exportación</p>
        </div>
      </div>

      {/* Sección de reportes personalizados */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <BarChart2 size={18} />
          </div>
          <h2 className="font-semibold text-slate-800">Reportes personalizados</h2>
        </div>

        <div className="p-5 space-y-5">
          {/* Selector de tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de reporte</label>
              <select
                value={reportType}
                onChange={e => handleTypeChange(e.target.value as ReportType | '')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">— Seleccioná un tipo —</option>
                {REPORT_TYPES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros dinámicos */}
          {reportType && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Filtros</span>
              </div>
              <FiltersPanel
                type={reportType}
                filters={filters}
                setFilter={setFilter}
                choferes={choferes}
                camiones={camiones}
                clientes={clientes}
                loadingRefs={loadingRefs}
              />
            </div>
          )}

          {/* Botones */}
          {reportType && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                Generar reporte
              </button>
              {result && (
                <>
                  <button
                    onClick={exportPDF}
                    disabled={!!exporting}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                  >
                    {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Exportar PDF
                  </button>
                  <button
                    onClick={exportExcel}
                    disabled={!!exporting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                  >
                    {exporting === 'excel' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Exportar Excel
                  </button>
                  <button
                    onClick={exportCSV}
                    disabled={!!exporting}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                  >
                    {exporting === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Exportar CSV
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm px-3 py-2 rounded-lg transition"
                  >
                    <X size={14} /> Limpiar
                  </button>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Sin resultados */}
          {result && result.rows.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No se encontraron datos con los filtros seleccionados.
            </div>
          )}

          {/* Vista previa */}
          {result && result.rows.length > 0 && reportType && (
            <ReportPreview type={reportType as ReportType} rows={result.rows} totales={result.totales} />
          )}
        </div>
      </div>

      {/* Categorías rápidas (solo visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {QUICK_CATEGORIES.map(grupo => {
          const Icon = grupo.icon
          return (
            <div key={grupo.categoria} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <div className={`p-2 rounded-lg ${grupo.colorClass}`}>
                  <Icon size={18} />
                </div>
                <h2 className="font-semibold text-slate-800">{grupo.categoria}</h2>
              </div>
              <div className="p-4 space-y-2">
                {grupo.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                    <FileText size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.titulo}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Filtros dinámicos ────────────────────────────────────────────────────────

function FiltersPanel({
  type, filters, setFilter, choferes, camiones, clientes, loadingRefs,
}: {
  type: ReportType | ''
  filters: Record<string, string>
  setFilter: (k: string, v: string) => void
  choferes: SelectOption[]
  camiones: SelectOption[]
  clientes: SelectOption[]
  loadingRefs: boolean
}) {
  const sel = (key: string, label: string, options: SelectOption[], allLabel = 'Todos') => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <select
        value={filters[key] ?? 'all'}
        onChange={e => setFilter(key, e.target.value)}
        disabled={loadingRefs}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        <option value="all">{allLabel}</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  )

  const dateInput = (key: string, label: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type="date"
        value={filters[key] ?? ''}
        onChange={e => setFilter(key, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  )

  const commonDate = (
    <>
      {dateInput('dateFrom', 'Fecha desde')}
      {dateInput('dateTo', 'Fecha hasta')}
    </>
  )

  const grids = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'

  if (type === 'trips') return (
    <div className={grids}>
      {commonDate}
      {sel('choferId', 'Chofer', choferes)}
      {sel('camionId', 'Camión', camiones)}
      {sel('clienteId', 'Cliente', clientes)}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Estado</label>
        <select
          value={filters.estado ?? 'all'}
          onChange={e => setFilter('estado', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_ruta">En ruta</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
    </div>
  )

  if (type === 'commissions') return (
    <div className={grids}>
      {commonDate}
      {sel('choferId', 'Chofer', choferes)}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Estado</label>
        <select
          value={filters.estado ?? 'all'}
          onChange={e => setFilter('estado', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>
    </div>
  )

  if (type === 'fuel') return (
    <div className={grids}>
      {commonDate}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo combustible</label>
        <select
          value={filters.tipoCombustible ?? 'all'}
          onChange={e => setFilter('tipoCombustible', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">Todos</option>
          {COMBUSTIBLE_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo movimiento</label>
        <select
          value={filters.tipoMovimiento ?? 'all'}
          onChange={e => setFilter('tipoMovimiento', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">Todos</option>
          <option value="recepcion">Recepción</option>
          <option value="carga">Carga</option>
        </select>
      </div>
      {sel('camionId', 'Camión', camiones)}
      {sel('choferId', 'Chofer', choferes)}
    </div>
  )

  if (type === 'expenses') return (
    <div className={grids}>
      {commonDate}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoría</label>
        <select
          value={filters.categoria ?? 'all'}
          onChange={e => setFilter('categoria', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">Todas</option>
          {GASTOS_CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {sel('camionId', 'Camión', camiones)}
      {sel('choferId', 'Chofer', choferes)}
    </div>
  )

  if (type === 'tires') return (
    <div className={grids}>
      {sel('camionId', 'Camión', camiones)}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Estado</label>
        <select
          value={filters.estado ?? 'all'}
          onChange={e => setFilter('estado', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">Todos</option>
          {CUBIERTA_ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Marca</label>
        <input
          type="text"
          value={filters.marca ?? ''}
          onChange={e => setFilter('marca', e.target.value)}
          placeholder="Ej: Bridgestone"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
    </div>
  )

  if (type === 'profitability') return (
    <div className={grids}>
      {commonDate}
      {sel('camionId', 'Camión', camiones)}
      {sel('clienteId', 'Cliente', clientes)}
      {sel('choferId', 'Chofer', choferes)}
    </div>
  )

  return null
}

// ─── Vista previa ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReportPreview({ type, rows, totales }: { type: ReportType; rows: any[]; totales: any }) {
  const columns = rows.length > 0 ? Object.keys(rows[0]).filter(k => k !== 'id') : []

  return (
    <div className="space-y-4">
      {/* Totales */}
      <TotalesPanel type={type} totales={totales} />

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th key={col} className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap capitalize">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 200).map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {formatCell(col, row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 200 && (
          <div className="text-center py-3 text-xs text-slate-400 border-t border-slate-100">
            Mostrando 200 de {rows.length} registros. Exportá para ver todos.
          </div>
        )}
      </div>
    </div>
  )
}

function formatCell(col: string, val: unknown) {
  if (val === null || val === undefined) return '-'
  const s = String(val)
  if (s === '' || s === '-') return '-'
  if (typeof val === 'number' && (col.includes('monto') || col.includes('precio') || col.includes('flete') || col.includes('costo') || col.includes('total') || col.includes('ingresos') || col.includes('gastos') || col.includes('comision') || col.includes('utilidad'))) {
    return fmt(val)
  }
  if (col === 'estado') {
    const map: Record<string, string> = {
      pendiente: 'Pendiente', pagado: 'Pagado', parcial: 'Parcial',
      completado: 'Completado', en_ruta: 'En ruta', cancelado: 'Cancelado',
      instalada: 'Instalada', retirada: 'Retirada', dañada: 'Dañada', descartada: 'Descartada',
    }
    const badge: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-700',
      pagado: 'bg-green-100 text-green-700',
      parcial: 'bg-blue-100 text-blue-700',
      completado: 'bg-green-100 text-green-700',
      en_ruta: 'bg-blue-100 text-blue-700',
      cancelado: 'bg-red-100 text-red-700',
      instalada: 'bg-green-100 text-green-700',
      retirada: 'bg-slate-100 text-slate-600',
      dañada: 'bg-red-100 text-red-700',
      descartada: 'bg-slate-100 text-slate-500',
    }
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge[s] ?? 'bg-slate-100 text-slate-600'}`}>{map[s] ?? s}</span>
  }
  return s
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TotalesPanel({ type, totales }: { type: ReportType; totales: any }) {
  if (!totales) return null

  if (type === 'trips') return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <TCard label="Total viajes" value={String(totales.cantidad)} />
      <TCard label="Total facturado" value={fmt(totales.total_facturado)} color="green" />
      <TCard label="Total comisiones" value={fmt(totales.total_comisiones)} color="orange" />
      <TCard label="Completados" value={String(totales.completados)} color="green" />
      <TCard label="Pendientes" value={String(totales.pendientes)} color="yellow" />
    </div>
  )

  if (type === 'commissions') return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <TCard label="Total general" value={fmt(totales.total_general)} color="orange" />
      <TCard label="Pendiente" value={fmt(totales.total_pendiente)} color="yellow" />
      <TCard label="Pagado" value={fmt(totales.total_pagado)} color="green" />
      <TCard label="Cantidad" value={String(totales.cantidad)} />
    </div>
  )

  if (type === 'fuel') return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <TCard label="Litros recibidos" value={fmtLitros(totales.litros_recibidos)} />
      <TCard label="Litros cargados" value={fmtLitros(totales.litros_cargados)} color="orange" />
      <TCard label="Stock actual" value={fmtLitros(totales.stock_actual)} color={totales.stock_actual >= 0 ? 'green' : 'red'} />
      <TCard label="Costo total" value={fmt(totales.costo_total)} color="orange" />
    </div>
  )

  if (type === 'expenses') return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <TCard label="Total gastos" value={fmt(totales.total)} color="red" />
      {Object.entries(totales.por_categoria as Record<string, number>).slice(0, 4).map(([cat, amt]) => (
        <TCard key={cat} label={cat} value={fmt(amt)} />
      ))}
    </div>
  )

  if (type === 'tires') return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <TCard label="Activas" value={String(totales.activas)} color="green" />
      <TCard label="Retiradas" value={String(totales.retiradas)} />
      <TCard label="Dañadas" value={String(totales.danadas)} color="red" />
      <TCard label="Costo total" value={fmt(totales.costo_total)} color="orange" />
    </div>
  )

  if (type === 'profitability') return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <TCard label="Ingresos" value={fmt(totales.total_ingresos)} color="green" />
      <TCard label="Comisiones" value={fmt(totales.total_comisiones)} color="orange" />
      <TCard label="Gastos" value={fmt(totales.total_gastos)} color="red" />
      <TCard label="Utilidad estimada" value={fmt(totales.utilidad_estimada)} color={totales.utilidad_estimada >= 0 ? 'green' : 'red'} />
    </div>
  )

  return null
}

function TCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-700 bg-green-50 border-green-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  }
  const cls = color ? colorMap[color] : 'text-slate-700 bg-slate-50 border-slate-200'
  return (
    <div className={`rounded-lg border px-4 py-3 ${cls}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  )
}

// ─── Categorías rápidas (decorativas) ─────────────────────────────────────────

const QUICK_CATEGORIES = [
  {
    categoria: 'Combustible', icon: Fuel, colorClass: 'bg-orange-100 text-orange-600',
    items: [
      { titulo: 'Combustible comprado vs. cargado', desc: 'Comparativa de recepciones y consumo por período' },
      { titulo: 'Stock histórico por tanque', desc: 'Evolución del stock de combustible en el tiempo' },
    ]
  },
  {
    categoria: 'Viajes y facturación', icon: TrendingUp, colorClass: 'bg-blue-100 text-blue-600',
    items: [
      { titulo: 'Viajes por chofer y período', desc: 'Cantidad, km recorridos y monto generado' },
      { titulo: 'Rentabilidad por viaje o camión', desc: 'Ingresos menos gastos directos asociados' },
    ]
  },
  {
    categoria: 'Choferes y comisiones', icon: Users, colorClass: 'bg-purple-100 text-purple-600',
    items: [
      { titulo: 'Comisiones pagadas y pendientes', desc: 'Estado de liquidaciones por chofer y período' },
    ]
  },
  {
    categoria: 'Flota y gastos', icon: Truck, colorClass: 'bg-green-100 text-green-600',
    items: [
      { titulo: 'Gastos por categoría', desc: 'Desglose de combustible, peajes, mantenimiento, etc.' },
      { titulo: 'Gastos por camión', desc: 'Costo total de operación por unidad' },
    ]
  },
]

// Suppress unused import warning
void DollarSign
