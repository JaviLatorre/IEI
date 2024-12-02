const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;


let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;

let provincia = "";

// Función para consumir la API y guardar los datos en la base de datos
/*const extraerDatos = async () => {
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
};*/

async function euskadi(){
    try {
        // Leer archivo JSON
        const data = await fs.readFile('../FuentesDeDatos/edificios.json', 'utf-8');
        
        // Parsear el contenido como JSON
        const jsonData = JSON.parse(data);

        const primerosCuatro = jsonData.slice(0, 4);

        // Iterar sobre los monumentos y esperar a que se complete cada operación
        console.time('Tiempo de ejecución');
        for (const monumento of jsonData) {
            //console.log(monumento)
            await guardarEnBD(monumento);
        }
        console.timeEnd('Tiempo de ejecución');

        console.log('Todos los monumentos han sido procesados.');
        console.log('Monumentos insetados correctamente: ', insertadas_correctamente)
        console.log('Monumentos corregidos: ', insertadas_corregidas)
        console.log('Monumentos descartados: ', descartadas)
    } catch (err) {
        console.error('Error:', err);
    }
}

async function guardarEnBD(monumento) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        modificado = false
        provincia = monumento.territory
        municipio = monumento.municipality
        codigoPostal = monumento.postalCode

        let correcto = await verificarProvincia()
        if(!correcto){
            return
        }

        correcto = await verificarMunicipio()
        if(!correcto){
            return
        }

        correcto = await verificarCodigoPostal()
        if(!correcto){
            return
        }
        
        if(modificado){
            insertadas_corregidas++
        }else{insertadas_correctamente++}
        console.log(municipio)
        //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
        /*const { data: provin, error: error1} = await supabase
                .from('Provincia')
                .insert([
                { nombre: provincia},
                ])
                 .select()
        if(error1){
            //console.error('Error guardando la procvincia:',error1);
        }
        
        //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
        const{data: local, error: error2} = await supabase  
            .from('Localidad')
            .insert([
                { nombre: monumento.municipality, en_provincia: provincia },
              ])
              .select()
        if(error2){
            //console.error('Error guardando el municipio:',error2);
        }*/

}

async function verificarProvincia(){
    if(provincia == ""){
        descartadas++
        return false
    }
    else if(provincia == "Araba/Álava"){
        provincia = "Araba"
        modificado = true
        return true
    }
    else if (provincia!= "Gipuzkoa" && provincia != "Bizkaia"){
        descartadas++
        return false
    }
    return true
}

async function verificarMunicipio(){
    if(municipio == ""){
        descartadas++
        return false
    }
    else if(municipio.includes('/')){
        const textoAntes = municipio.split('/')[0];
        municipio = textoAntes
        modificado = true
        return true
    }
    return true
}

async function verificarCodigoPostal() {
    // Comprueba que todos los códigos postales tengan 5 dígitos
    if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
      descartadas++
      return false
    }
    return true;
  }

euskadi();
