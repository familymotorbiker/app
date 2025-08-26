// Configuración de Supabase
// IMPORTANTE: Reemplaza estas URLs con las de tu proyecto

const SUPABASE_URL = 'https://owdnhyhatlgubcurnozq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZG5oeWhhdGxndWJjdXJub3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTk5OTcsImV4cCI6MjA3MTc5NTk5N30.HuRlZ770bsJBLULxOG6gCLMuYFU_PZk1ntl12qQiAxQ';

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
