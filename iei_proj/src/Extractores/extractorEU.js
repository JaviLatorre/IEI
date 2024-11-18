const fs = require('fs').promises
const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');


async function euskadi(){
    try {
        // Leer archivo JSON
        const data = await fs.readFile('C:\\Users\\Óscar\\Desktop\\Clase\\edificios.json', 'utf-8');
        
        // Parsear el contenido como JSON
        const jsonData = JSON.parse(data);

        const primerosCuatro = jsonData.slice(0, 4);

        // Iterar sobre los monumentos y esperar a que se complete cada operación
        for (const monumento of jsonData) {
            //console.log(monumento)
            await guardarEnBD(monumento);
        }

        console.log('Todos los monumentos han sido procesados.');
    } catch (err) {
        console.error('Error:', err);
    }
}

async function guardarEnBD(monumento) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
        //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
        const { data, error: error1} = await supabase
                .from('Provincia')
                .insert([
                { nombre: monumento.territory},
                ])
                 .select()
        if(error1){
            console.error('Error:',error2);
        }

        //Recuperar el id de la provincia donde se encuentra el monumento
        const{data: provincia, error: error2} = await supabase
            .from('Provincia')
            .select('código')
            .eq('nombre', monumento.territory)
        if(error2){
            console.error('Error:',error2);
        }
        //console.log(provincia[0].código)

        //Guardar el municipio donde se encuentra el monumento (si aún no está guardado)
        const{data: local, error: error3} = await supabase  
            .from('Localidad')
            .insert([
                { nombre: monumento.municipality, en_provincia: provincia[0].código },
              ])
              .select()
        //console.log(local)
        if(error3){
            console.error('Error:',error3);
        }

}

euskadi();
