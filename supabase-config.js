// Configuración de Supabase
// IMPORTANTE: Reemplaza estas URLs con las de tu proyecto

const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI'; // https://tuproyecto.supabase.co
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI'; // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Importar Supabase (funciona con CDN)
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
async function testConnection() {
    try {
        const { data, error } = await supabase.from('tires').select('count');
        if (error) {
            console.error('Error conectando a Supabase:', error);
            return false;
        }
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return false;
    }
}

// Exportar para usar en otros archivos
window.supabase = supabase;
window.testConnection = testConnection;
