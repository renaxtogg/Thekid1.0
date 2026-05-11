import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), supabase: null }
  return { error: null, supabase }
}

function validateDates(dateFrom: string, dateTo: string) {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return 'La fecha desde no puede ser mayor a la fecha hasta'
  }
  return null
}

export async function POST(request: Request) {
  const { error, supabase } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const { type, filters = {} } = body

  const validTypes = ['trips', 'commissions', 'fuel', 'expenses', 'tires', 'profitability']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Tipo de reporte inválido' }, { status: 400 })
  }

  const dateError = validateDates(filters.dateFrom, filters.dateTo)
  if (dateError) return NextResponse.json({ error: dateError }, { status: 400 })

  const db = supabase!

  if (type === 'trips') {
    let query = db
      .from('viajes')
      .select('*, clientes(nombre), choferes(nombre, porcentaje_comision), camiones(chapa), comisiones(monto, estado)')
      .order('fecha', { ascending: false })

    if (filters.dateFrom) query = query.gte('fecha', filters.dateFrom)
    if (filters.dateTo) query = query.lte('fecha', filters.dateTo)
    if (filters.choferId && filters.choferId !== 'all') query = query.eq('chofer_id', filters.choferId)
    if (filters.camionId && filters.camionId !== 'all') query = query.eq('camion_id', filters.camionId)
    if (filters.clienteId && filters.clienteId !== 'all') query = query.eq('cliente_id', filters.clienteId)
    if (filters.estado && filters.estado !== 'all') query = query.eq('estado', filters.estado)

    const { data, error: dbError } = await query
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    const rows = (data ?? []).map(v => ({
      id: v.id,
      fecha: v.fecha,
      chofer: v.choferes?.nombre ?? '-',
      camion: v.camiones?.chapa ?? '-',
      cliente: v.clientes?.nombre ?? '-',
      origen: v.origen,
      destino: v.destino,
      precio_flete: v.precio_flete ?? 0,
      estado: v.estado,
      comision: Array.isArray(v.comisiones) && v.comisiones.length > 0 ? v.comisiones[0].monto : null,
    }))

    const totales = {
      cantidad: rows.length,
      total_facturado: rows.reduce((s, r) => s + r.precio_flete, 0),
      total_comisiones: rows.reduce((s, r) => s + (r.comision ?? 0), 0),
      pendientes: rows.filter(r => r.estado === 'pendiente').length,
      completados: rows.filter(r => r.estado === 'completado').length,
    }

    return NextResponse.json({ rows, totales })
  }

  if (type === 'commissions') {
    let query = db
      .from('comisiones')
      .select('*, choferes(nombre), viajes(origen, destino, precio_flete, fecha, clientes(nombre), camiones(chapa))')
      .order('created_at', { ascending: false })

    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59')
    if (filters.choferId && filters.choferId !== 'all') query = query.eq('chofer_id', filters.choferId)
    if (filters.estado && filters.estado !== 'all') query = query.eq('estado', filters.estado)

    const { data, error: dbError } = await query
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    const rows = (data ?? []).map(c => ({
      id: c.id,
      chofer: c.choferes?.nombre ?? '-',
      viaje: c.viajes ? `${c.viajes.origen} → ${c.viajes.destino}` : '-',
      cliente: c.viajes?.clientes?.nombre ?? '-',
      camion: c.viajes?.camiones?.chapa ?? '-',
      precio_flete: c.viajes?.precio_flete ?? 0,
      porcentaje: c.viajes && c.monto && c.viajes.precio_flete
        ? ((c.monto / c.viajes.precio_flete) * 100).toFixed(1)
        : '-',
      monto: c.monto ?? 0,
      estado: c.estado,
      fecha_generada: c.created_at?.slice(0, 10) ?? '-',
      fecha_pago: c.fecha_pago ?? '-',
    }))

    const totales = {
      total_pendiente: rows.filter(r => r.estado === 'pendiente').reduce((s, r) => s + r.monto, 0),
      total_pagado: rows.filter(r => r.estado === 'pagado').reduce((s, r) => s + r.monto, 0),
      total_general: rows.reduce((s, r) => s + r.monto, 0),
      cantidad: rows.length,
    }

    return NextResponse.json({ rows, totales })
  }

  if (type === 'fuel') {
    const [recRes, carRes] = await Promise.all([
      (() => {
        let q = db.from('recepciones_combustible')
          .select('*, proveedores(nombre)')
          .order('fecha', { ascending: false })
        if (filters.dateFrom) q = q.gte('fecha', filters.dateFrom)
        if (filters.dateTo) q = q.lte('fecha', filters.dateTo)
        if (filters.tipoCombustible && filters.tipoCombustible !== 'all') q = q.eq('tipo_combustible', filters.tipoCombustible)
        return q
      })(),
      (() => {
        let q = db.from('cargas_combustible')
          .select('*, camiones(chapa), choferes(nombre)')
          .order('fecha', { ascending: false })
        if (filters.dateFrom) q = q.gte('fecha', filters.dateFrom)
        if (filters.dateTo) q = q.lte('fecha', filters.dateTo)
        if (filters.tipoCombustible && filters.tipoCombustible !== 'all') q = q.eq('tipo_combustible', filters.tipoCombustible)
        if (filters.camionId && filters.camionId !== 'all') q = q.eq('camion_id', filters.camionId)
        if (filters.choferId && filters.choferId !== 'all') q = q.eq('chofer_id', filters.choferId)
        return q
      })(),
    ])

    const recepciones = (recRes.data ?? []).map(r => ({
      fecha: r.fecha,
      tipo_movimiento: 'Recepción',
      tipo_combustible: r.tipo_combustible,
      litros: r.litros ?? 0,
      precio_por_litro: r.precio_por_litro ?? 0,
      total: r.total ?? 0,
      camion: '-',
      chofer: '-',
      proveedor: r.proveedores?.nombre ?? '-',
      observaciones: r.factura ?? '-',
    }))

    const cargas = (carRes.data ?? []).map(c => ({
      fecha: c.fecha,
      tipo_movimiento: 'Carga',
      tipo_combustible: c.tipo_combustible,
      litros: c.litros ?? 0,
      precio_por_litro: c.precio_por_litro ?? 0,
      total: (c.litros ?? 0) * (c.precio_por_litro ?? 0),
      camion: c.camiones?.chapa ?? '-',
      chofer: c.choferes?.nombre ?? '-',
      proveedor: '-',
      observaciones: '',
    }))

    let rows = [...recepciones, ...cargas]

    if (filters.tipoMovimiento && filters.tipoMovimiento !== 'all') {
      const label = filters.tipoMovimiento === 'recepcion' ? 'Recepción' : 'Carga'
      rows = rows.filter(r => r.tipo_movimiento === label)
    }

    rows.sort((a, b) => b.fecha.localeCompare(a.fecha))

    const totales = {
      litros_recibidos: recepciones.reduce((s, r) => s + r.litros, 0),
      litros_cargados: cargas.reduce((s, r) => s + r.litros, 0),
      stock_actual: recepciones.reduce((s, r) => s + r.litros, 0) - cargas.reduce((s, r) => s + r.litros, 0),
      costo_total: recepciones.reduce((s, r) => s + r.total, 0),
    }

    return NextResponse.json({ rows, totales })
  }

  if (type === 'expenses') {
    let query = db
      .from('gastos')
      .select('*, camiones(chapa), choferes(nombre), viajes(origen, destino), clientes(nombre)')
      .eq('estado', 'activo')
      .order('fecha', { ascending: false })

    if (filters.dateFrom) query = query.gte('fecha', filters.dateFrom)
    if (filters.dateTo) query = query.lte('fecha', filters.dateTo)
    if (filters.categoria && filters.categoria !== 'all') query = query.eq('categoria', filters.categoria)
    if (filters.camionId && filters.camionId !== 'all') query = query.eq('camion_id', filters.camionId)
    if (filters.choferId && filters.choferId !== 'all') query = query.eq('chofer_id', filters.choferId)

    const { data, error: dbError } = await query
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    const rows = (data ?? []).map(g => ({
      id: g.id,
      fecha: g.fecha,
      categoria: g.categoria,
      descripcion: g.descripcion ?? '-',
      monto: g.monto ?? 0,
      camion: g.camiones?.chapa ?? '-',
      chofer: g.choferes?.nombre ?? '-',
      viaje: g.viajes ? `${g.viajes.origen} → ${g.viajes.destino}` : '-',
      metodo_pago: g.metodo_pago ?? '-',
      comprobante: g.comprobante ?? '-',
      observaciones: g.observaciones ?? '-',
    }))

    const porCategoria: Record<string, number> = {}
    const porCamion: Record<string, number> = {}
    rows.forEach(r => {
      porCategoria[r.categoria] = (porCategoria[r.categoria] ?? 0) + r.monto
      if (r.camion !== '-') porCamion[r.camion] = (porCamion[r.camion] ?? 0) + r.monto
    })

    const totales = {
      total: rows.reduce((s, r) => s + r.monto, 0),
      por_categoria: porCategoria,
      por_camion: porCamion,
    }

    return NextResponse.json({ rows, totales })
  }

  if (type === 'tires') {
    let query = db
      .from('cubiertas')
      .select('*, camiones(chapa)')
      .order('fecha_instalacion', { ascending: false })

    if (filters.camionId && filters.camionId !== 'all') query = query.eq('camion_id', filters.camionId)
    if (filters.estado && filters.estado !== 'all') query = query.eq('estado', filters.estado)
    if (filters.marca && filters.marca.trim()) query = query.ilike('marca', `%${filters.marca}%`)

    const { data, error: dbError } = await query
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    const rows = (data ?? []).map(c => ({
      id: c.id,
      camion: c.camiones?.chapa ?? '-',
      posicion: c.posicion ?? '-',
      marca: c.marca ?? '-',
      medida: c.medida ?? '-',
      estado: c.estado,
      fecha_instalacion: c.fecha_instalacion ?? '-',
      km_instalacion: c.km_instalacion ?? '-',
      fecha_retiro: c.fecha_retiro ?? '-',
      km_retiro: c.km_retiro ?? '-',
      costo: c.costo ?? 0,
      observaciones: c.observaciones ?? '-',
    }))

    const totales = {
      activas: rows.filter(r => r.estado === 'instalada').length,
      retiradas: rows.filter(r => r.estado === 'retirada').length,
      danadas: rows.filter(r => r.estado === 'dañada').length,
      costo_total: rows.reduce((s, r) => s + r.costo, 0),
    }

    return NextResponse.json({ rows, totales })
  }

  if (type === 'profitability') {
    let tripsQ = db.from('viajes')
      .select('id, fecha, precio_flete, camion_id, chofer_id, cliente_id, camiones(chapa), choferes(nombre), clientes(nombre)')
      .order('fecha', { ascending: false })

    if (filters.dateFrom) tripsQ = tripsQ.gte('fecha', filters.dateFrom)
    if (filters.dateTo) tripsQ = tripsQ.lte('fecha', filters.dateTo)
    if (filters.camionId && filters.camionId !== 'all') tripsQ = tripsQ.eq('camion_id', filters.camionId)
    if (filters.clienteId && filters.clienteId !== 'all') tripsQ = tripsQ.eq('cliente_id', filters.clienteId)
    if (filters.choferId && filters.choferId !== 'all') tripsQ = tripsQ.eq('chofer_id', filters.choferId)

    const [tripsRes, commissionsRes, expensesRes] = await Promise.all([
      tripsQ,
      db.from('comisiones').select('monto, viaje_id').eq('estado', 'pagado'),
      db.from('gastos').select('monto, camion_id, fecha').eq('estado', 'activo'),
    ])

    const trips = tripsRes.data ?? []
    const commissions = commissionsRes.data ?? []
    const expenses = expensesRes.data ?? []

    const tripIds = new Set(trips.map(t => t.id))
    const totalIngresos = trips.reduce((s, t) => s + (t.precio_flete ?? 0), 0)
    const totalComisiones = commissions.filter(c => tripIds.has(c.viaje_id)).reduce((s, c) => s + (c.monto ?? 0), 0)

    const expensesFiltered = expenses.filter(e => {
      if (filters.dateFrom && e.fecha < filters.dateFrom) return false
      if (filters.dateTo && e.fecha > filters.dateTo) return false
      return true
    })
    const totalGastos = expensesFiltered.reduce((s, e) => s + (e.monto ?? 0), 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = trips.map((t: any) => ({
      fecha: t.fecha,
      chofer: t.choferes?.nombre ?? '-',
      camion: t.camiones?.chapa ?? '-',
      cliente: t.clientes?.nombre ?? '-',
      ingresos: t.precio_flete ?? 0,
      comisiones: commissions.filter(c => c.viaje_id === t.id).reduce((s, c) => s + (c.monto ?? 0), 0),
    }))

    const totales = {
      total_ingresos: totalIngresos,
      total_comisiones: totalComisiones,
      total_gastos: totalGastos,
      utilidad_estimada: totalIngresos - totalComisiones - totalGastos,
    }

    return NextResponse.json({ rows, totales })
  }

  return NextResponse.json({ error: 'Tipo de reporte no implementado' }, { status: 400 })
}
