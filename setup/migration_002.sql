-- =====================================================
-- THEKID - Migration 002: Tabla de perfiles de usuario
-- Ejecutar en Supabase SQL Editor ANTES de usar el módulo de usuarios
-- =====================================================

-- 1. Tabla profiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'chofer' CHECK (role IN ('admin', 'encargado', 'chofer')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. RLS: usuarios autenticados pueden leer todos los perfiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Las operaciones de escritura se realizan desde la API con service role (bypassa RLS)

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_profiles_updated_at();
