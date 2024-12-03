const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase');
const { createClient, SupabaseClient } = require('@supabase/supabase-js');


async function getLocalidad(nombre) {
    try {
        const { data: localidad, error } = await supabase
            .from('Localidad')
            .select('*')
            .eq('nombre', nombre); // Filtrar por el campo 'nombre'

        if (error) {
            console.error('Error obteniendo la localidad:', error);
            return null;
        }

        return localidad;
    } catch (e) {
        console.error('Error inesperado obteniendo la localidad:', e);
        return null;
    }
}

async function getProvincia(nombre) {
    try {
        const { data: provincia, error } = await supabase
            .from('Provincia')
            .select('*')
            .eq('nombre', nombre); // Filtrar por el campo 'nombre'

        if (error) {
            console.error('Error obteniendo la provincia:', error);
            return null;
        }

        return provincia;
    } catch (e) {
        console.error('Error inesperado obteniendo la provincia:', e);
        return null;
    }
}

function determinarTipo(denominacion){
    const lowername = denominacion.toLowerCase();
   
    if(lowername.includes('yacimiento')) return 'Yacimiento Arqueológico';
    if(lowername.includes('iglesia') || lowername.includes('ermita')) return 'Iglesia-Ermita';
    if(lowername.includes('monasterio') || lowername.includes('convento')) return 'Monasterio-Convento';
    if(lowername.includes('castillo') || lowername.includes('fortaleza') || lowername.includes('torre')) return 'Castillo-Fortaleza-Torre';
    if(lowername.includes('palacio') || lowername.includes('casa') || lowername.includes('teatro')  || lowername.includes('ayuntamiento')) return 'Iglesia-Ermita';
    if(lowername.includes('puente') ) return 'Puente';
    return 'Otros';
}

async function eliminarBD() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
        const { data, error } = await supabase.from('Monumento').delete().select('*');
        if (error) {
            console.error('Error eliminando monumentos:', error);
        }
        console.log('Monumentos eliminados:', data);
        const { data: localidades, error: error2 } = await supabase.from('Localidad').delete().select('*');
        if (error2) {
            console.error('Error eliminando la base de datos:', error2);
        }
        console.log('Localidades eliminadas:', localidades);
        const { data: provincias, error: error1 } = await supabase.from('Provincia').delete().select('*');
        if (error1) {
            console.error('Error eliminando la base de datos:', error1);
        }
        console.log('Provincias eliminadas:', provincias);
        
    } catch (e) {
        console.error('Error inesperado eliminando la base de datos:', e);
    }
    console.log('Base de datos eliminada exitosamente');
}

module.exports = { getLocalidad, getProvincia, determinarTipo, eliminarBD };