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
        // Eliminar registros de la tabla Monumento
        const { data: monumentosEliminados, error: errorMonumento } = await supabase
            .from('Monumento')
            .delete()
            .not('id', 'is', null); // Clausula válida para PostgreSQL
        if (errorMonumento) {
            console.error('Error eliminando registros de la tabla Monumento:', errorMonumento);
        } else {
            console.log('Registros eliminados de la tabla Monumento:', monumentosEliminados);
        }

        // Eliminar registros de la tabla Localidad
        const { data: localidadesEliminadas, error: errorLocalidad } = await supabase
            .from('Localidad')
            .delete()
            .not('id', 'is', null); // Clausula válida para PostgreSQL
        if (errorLocalidad) {
            console.error('Error eliminando registros de la tabla Localidad:', errorLocalidad);
        } else {
            console.log('Registros eliminados de la tabla Localidad:', localidadesEliminadas);
        }

        // Eliminar registros de la tabla Provincia
        const { data: provinciasEliminadas, error: errorProvincia } = await supabase
            .from('Provincia')
            .delete()
            .not('id', 'is', null); // Clausula válida para PostgreSQL
        if (errorProvincia) {
            console.error('Error eliminando registros de la tabla Provincia:', errorProvincia);
        } else {
            console.log('Registros eliminados de la tabla Provincia:', provinciasEliminadas);
        }

        console.log('Operación completada. Todas las tablas están vacías.');
    } catch (e) {
        console.error('Error inesperado eliminando tablas:', e);
    }
}

module.exports = { getLocalidad, getProvincia, determinarTipo, eliminarBD };