const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');

// Función para consumir la API y guardar los datos en la base de datos
const extraerDatos = async () => {
    (async () => {
        const fetch = (await import('node-fetch')).default //Usamos una importación dinámica para este módulo porque es un modulo ESM y el proyecto usa CommonJS, así 
                                                           //lo podemos importar y no se queja.

    try {
        // Consumir la API
        const response = await fetch('http://localhost:3000/EuskadiAPI');
        const data = await response.json();
        
        const primerosCuatro = data.slice(0, 4);

        // Iterar sobre los monumentos y esperar a que se complete cada operación
        console.time('Tiempo de ejecución');
        for (const monumento of data) {
            await guardarEnBD(monumento);
        }
        console.timeEnd('Tiempo de ejecución');

        console.log('Datos guardados exitosamente en la base de datos.');
    } catch (error) {
        console.error('Error extrayendo y guardando datos:', error);
    } 

    })(); //Aquí temina la importación dinámica
};

async function guardarEnBD(monumento) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
        const { data: provincia, error: error1} = await supabase
                .from('Provincia')
                .insert([
                { nombre: monumento.territory},
                ])
                 .select()
        if(error1){
            //console.error('Error guardando la procvincia:',error1);
        }
        
        //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
        const{data: local, error: error2} = await supabase  
            .from('Localidad')
            .insert([
                { nombre: monumento.municipality, en_provincia: monumento.territory },
              ])
              .select()
        if(error2){
            //console.error('Error guardando el municipio:',error2);
        }

}

extraerDatos();
