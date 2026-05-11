-- =====================================================
-- THEKID - Schema inicial de base de datos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Camiones
create table if not exists camiones (
  id uuid primary key default gen_random_uuid(),
  chapa text not null unique,
  marca text not null,
  modelo text not null,
  anio int,
  capacidad_litros numeric,
  km_actual numeric default 0,
  estado text default 'activo' check (estado in ('activo', 'taller', 'fuera_de_servicio')),
  venc_seguro date,
  venc_itv date,
  venc_habilitacion date,
  observaciones text,
  created_at timestamptz default now()
);

-- Choferes
create table if not exists choferes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ci text unique,
  telefono text,
  direccion text,
  tipo_licencia text,
  venc_licencia date,
  porcentaje_comision numeric default 8,
  camion_id uuid references camiones(id),
  activo boolean default true,
  created_at timestamptz default now()
);

-- Proveedores
create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ruc text,
  telefono text,
  created_at timestamptz default now()
);

-- Recepciones de combustible
create table if not exists recepciones_combustible (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  proveedor_id uuid references proveedores(id),
  tipo_combustible text not null,
  litros numeric not null,
  precio_por_litro numeric not null,
  total numeric generated always as (litros * precio_por_litro) stored,
  factura text,
  responsable text,
  observaciones text,
  created_at timestamptz default now()
);

-- Clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ruc text,
  telefono text,
  direccion text,
  contacto text,
  tipo text default 'flete' check (tipo in ('flete', 'combustible', 'ambos')),
  activo boolean default true,
  created_at timestamptz default now()
);

-- Viajes
create table if not exists viajes (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  cliente_id uuid references clientes(id),
  chofer_id uuid references choferes(id),
  camion_id uuid references camiones(id),
  origen text not null,
  destino text not null,
  tipo_carga text,
  km numeric,
  precio_flete numeric not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'en_ruta', 'completado', 'cancelado')),
  comprobante text,
  observaciones text,
  created_at timestamptz default now()
);

-- Cargas de combustible a camiones
create table if not exists cargas_combustible (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  camion_id uuid references camiones(id),
  chofer_id uuid references choferes(id),
  viaje_id uuid references viajes(id),
  litros numeric not null,
  tipo_combustible text not null,
  km_al_cargar numeric,
  responsable text,
  created_at timestamptz default now()
);

-- Comisiones
create table if not exists comisiones (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid references viajes(id),
  chofer_id uuid references choferes(id),
  monto numeric not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'parcial', 'pagado')),
  fecha_pago date,
  observaciones text,
  created_at timestamptz default now()
);

-- Mantenimientos
create table if not exists mantenimientos (
  id uuid primary key default gen_random_uuid(),
  camion_id uuid references camiones(id),
  fecha date not null default current_date,
  tipo text not null,
  taller text,
  km numeric,
  costo numeric,
  proximo_km numeric,
  proxima_fecha date,
  observaciones text,
  estado text default 'realizado' check (estado in ('pendiente', 'en_proceso', 'realizado')),
  created_at timestamptz default now()
);

-- Cubiertas
create table if not exists cubiertas (
  id uuid primary key default gen_random_uuid(),
  camion_id uuid references camiones(id),
  posicion text not null,
  marca text,
  medida text,
  km_instalacion numeric,
  costo numeric,
  estado text default 'buena' check (estado in ('buena', 'regular', 'para_cambiar')),
  fecha_instalacion date,
  motivo_cambio text,
  created_at timestamptz default now()
);

-- Gastos
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  categoria text not null,
  descripcion text not null,
  camion_id uuid references camiones(id),
  viaje_id uuid references viajes(id),
  monto numeric not null,
  comprobante text,
  created_at timestamptz default now()
);

-- =====================================================
-- Row Level Security (RLS) - Solo usuarios autenticados
-- =====================================================
alter table camiones enable row level security;
alter table choferes enable row level security;
alter table proveedores enable row level security;
alter table recepciones_combustible enable row level security;
alter table clientes enable row level security;
alter table viajes enable row level security;
alter table cargas_combustible enable row level security;
alter table comisiones enable row level security;
alter table mantenimientos enable row level security;
alter table cubiertas enable row level security;
alter table gastos enable row level security;

-- Política: solo usuarios autenticados pueden acceder
create policy "Acceso autenticado" on camiones for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on choferes for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on proveedores for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on recepciones_combustible for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on clientes for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on viajes for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on cargas_combustible for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on comisiones for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on mantenimientos for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on cubiertas for all to authenticated using (true) with check (true);
create policy "Acceso autenticado" on gastos for all to authenticated using (true) with check (true);
