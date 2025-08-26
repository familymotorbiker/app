-- Crear tabla de llantas
CREATE TABLE tires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    measure VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    reference VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de movimientos
CREATE TABLE movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tire_id UUID REFERENCES tires(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida', 'transferencia', 'ajuste')),
    quantity INTEGER NOT NULL,
    old_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_tires_brand ON tires(brand);
CREATE INDEX idx_tires_category ON tires(category);
CREATE INDEX idx_tires_type ON tires(type);
CREATE INDEX idx_movements_tire_id ON movements(tire_id);
CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_created_at ON movements(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en tires
CREATE TRIGGER update_tires_updated_at BEFORE UPDATE ON tires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permite todo por ahora para el MVP)
CREATE POLICY "Allow all operations on tires" ON tires FOR ALL USING (true);
CREATE POLICY "Allow all operations on movements" ON movements FOR ALL USING (true);

-- Insertar datos de ejemplo
INSERT INTO tires (measure, brand, reference, category, type, price, stock, min_stock) VALUES
('120/70-17', 'Michelin', 'Pilot Street', 'Deportiva', 'Delantera', 180000, 15, 5),
('160/60-17', 'Michelin', 'Pilot Street', 'Deportiva', 'Trasera', 220000, 12, 5),
('110/70-17', 'Pirelli', 'MT60', 'Trail', 'Delantera', 160000, 8, 5),
('140/80-17', 'Pirelli', 'MT60', 'Trail', 'Trasera', 180000, 10, 5),
('100/90-19', 'Dunlop', 'D606', 'Trail', 'Delantera', 150000, 6, 5);
