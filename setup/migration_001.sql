-- =====================================================
-- Migration 001: Agregar columnas faltantes
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. cubiertas: agregar tipo, proveedor, fechas de retiro, observaciones, activo
ALTER TABLE cubiertas
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'nueva',
  ADD COLUMN IF NOT EXISTS proveedor text,
  ADD COLUMN IF NOT EXISTS fecha_retiro date,
  ADD COLUMN IF NOT EXISTS km_retiro numeric,
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

-- Actualizar constraint de estado para cubiertas (nuevos valores de ciclo de vida)
ALTER TABLE cubiertas DROP CONSTRAINT IF EXISTS cubiertas_estado_check;
ALTER TABLE cubiertas ADD CONSTRAINT cubiertas_estado_check
  CHECK (estado IN ('instalada', 'en_deposito', 'retirada', 'dañada', 'descartada'));

-- Migrar valores viejos de estado al nuevo esquema
UPDATE cubiertas SET estado = 'instalada' WHERE estado IN ('buena', 'regular');
UPDATE cubiertas SET estado = 'dañada' WHERE estado = 'para_cambiar';

-- 2. gastos: agregar chofer_id, cliente_id, metodo_pago, numero_comprobante, observaciones, estado
ALTER TABLE gastos
  ADD COLUMN IF NOT EXISTS chofer_id uuid REFERENCES choferes(id),
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id),
  ADD COLUMN IF NOT EXISTS metodo_pago text,
  ADD COLUMN IF NOT EXISTS numero_comprobante text,
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo';

-- 3. cargas_combustible: agregar precio_por_litro y observaciones si no existen
ALTER TABLE cargas_combustible
  ADD COLUMN IF NOT EXISTS precio_por_litro numeric,
  ADD COLUMN IF NOT EXISTS observaciones text;
