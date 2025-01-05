const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    const { data, error } = await supabase
        .from('Monumento') // Cambia 'Monumento' por el nombre de una tabla válida en tu base de datos
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error al conectar con Supabase:', error);
    } else {
        console.log('Conexión exitosa. Datos:', data);
    }
}

testConnection();
