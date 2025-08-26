-- Script adicional de autenticación para Inventario de Llantas
-- Este script se ejecuta DESPUÉS del supabase-setup.sql inicial

-- 1. Agregar columna de usuario a las tablas existentes
ALTER TABLE tires ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Actualizar datos existentes (asignar al primer usuario si existe)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Obtener el primer usuario registrado
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Si existe un usuario, asignar todos los datos existentes a ese usuario
    IF first_user_id IS NOT NULL THEN
        UPDATE tires SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE movements SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- 3. Eliminar políticas existentes (permisivas)
DROP POLICY IF EXISTS "Allow all operations on tires" ON tires;
DROP POLICY IF EXISTS "Allow all operations on movements" ON movements;

-- 4. Crear nuevas políticas basadas en usuario autenticado

-- Políticas para tabla 'tires'
CREATE POLICY "Users can view own tires" ON tires
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tires" ON tires
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tires" ON tires
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tires" ON tires
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabla 'movements'
CREATE POLICY "Users can view own movements" ON movements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movements" ON movements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movements" ON movements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movements" ON movements
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear función para auto-asignar user_id en inserts
CREATE OR REPLACE FUNCTION auto_assign_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo asignar si no se ha especificado un user_id
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 6. Crear triggers para auto-asignar user_id
CREATE TRIGGER auto_assign_user_id_tires
    BEFORE INSERT ON tires
    FOR EACH ROW EXECUTE FUNCTION auto_assign_user_id();

CREATE TRIGGER auto_assign_user_id_movements
    BEFORE INSERT ON movements
    FOR EACH ROW EXECUTE FUNCTION auto_assign_user_id();

-- 7. Habilitar RLS (ya debería estar habilitado)
ALTER TABLE tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- 8. Crear tabla de perfiles de usuario (opcional para futuras expansiones)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    business_name VARCHAR(100),
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para nuevos usuarios
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 9. Comentarios para documentación
COMMENT ON TABLE tires IS 'Inventario de llantas por usuario';
COMMENT ON TABLE movements IS 'Movimientos de inventario por usuario';
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario para información adicional';
COMMENT ON COLUMN tires.user_id IS 'ID del usuario propietario de la llanta';
COMMENT ON COLUMN movements.user_id IS 'ID del usuario que registró el movimiento';
