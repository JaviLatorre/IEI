const { getProvincia, getLocalidad, determinarTipo, eliminarBD } = require('./DAL');

const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;


let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;

let provincia = "";

// Función para consumir la API y devolver el archivo de datos en JSON
async function extraerDatos(){
    const fetch = (await import('node-fetch')).default //Usamos una importación dinámica para este módulo porque es un modulo ESM y el proyecto usa CommonJS, así 
                                                        //lo podemos importar y no se queja.
    
    try {
        // Consumir la API
        const response = await fetch('http://localhost:3000/EuskadiAPI');
        const data = await response.json();
        return data
    } catch (error) {
        console.error('Error extrayendo y guardando datos:', error);
    } 
} 

async function euskadi(){
    try {

        const data = await extraerDatos()

         // Verificar que `data` sea un string
         const dataString = typeof data === 'string' ? data : JSON.stringify(data);

        const updatedData = dataString.replace(/"address"\s:\s"([^"]*)"/g, (match, p1, offset, string) => {
            // Verificar si este es el primer "address" dentro de su bloque JSON
            const before = string.slice(0, offset); // Texto antes de este match
            const isFirstAddress = before.lastIndexOf('{') > before.lastIndexOf('"address"');
            return isFirstAddress ? `"firstAddress": "${p1}"` : match;
        });

        //console.log(updatedData)

        // Parsear el contenido como JSON
        const jsonData = JSON.parse(updatedData);
        console.log(jsonData)

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
        nombreMonumento = monumento.documentName
        descripcionMonumento = monumento.documentDescription
        codigoPostal = monumento.postalCode
        direccionFinal = monumento.firstAddress

        let correcto = await verificarProvincia()
        if (!correcto) {
            return
        }

        correcto = await verificarMunicipio()
        if (!correcto) {
            return
        }

        correcto = await verificarCodigoPostal()
        if (!correcto) {
            return
        }
        
        correcto = await verificarMonumento()
        if (!correcto) {
            return
        }

        if (modificado) {
            insertadas_corregidas++
        } else {insertadas_correctamente++}
        //console.log(municipio)
        //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
        const { data: provin, error: error1} = await supabase
                .from('Provincia')
                .insert([
                { nombre: provincia},
                ])
                 .select()
        if(error1){
            console.error('Error guardando la procvincia:',error1);
        }
        
        //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
        const{data: local, error: error2} = await supabase  
            .from('Localidad')
            .insert([
                { nombre: municipio, en_provincia: provincia },
              ])
              .select()
        if(error2){
            console.error('Error guardando el municipio:',error2);
        }

        //Guardar en SupaBase el monumento (si aún no está guardada)
        const { data: monumen, error: error3} = await supabase  
            .from('Monumento')
            .insert([
                { nombre: monumento.documentName,
                  tipo: determinarTipo(monumento.documentName),
                  direccion : direccionFinal,
                  descripcion : monumento.documentDescription, 
                  latitud: parseFloat(monumento.latitudelongitude)|| null ,
                  longitud: parseFloat(monumento.latitudelongitude) || null,
                  codigo_postal: codigoPostal,  
                  en_localidad: municipio,
                },
              ])
              .select()
        if(error3){
            console.error('Error guardando el monumento:',error3);
        }
       /*var monumentoSol = `nombre: ${monumento.documentName}\n tipo: ${determinarTipo(monumento.documentName)}\n direccion: ${direccionFinal}\n descripción: ${monumento.documentDescription}\n
        latitud: ${parseFloat(monumento.latwgs84)}\n longitud: ${parseFloat(monumento.lonwgs84)}\n codigo_postal: ${codigoPostal}\n en_localidad: ${municipio}\n, en_provincia: ${provincia}\n\n\n`
        console.log(monumentoSol)*/
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

async function verificarMonumento() {
    if (nombreMonumento == "") {
        descartadas++
        return false
    } else if (descripcionMonumento == "") {
        descartadas++
        return false
    } else if (codigoPostal == "") {
        descartadas++
        return false
    } else if (codigoPostal.startsWith("58")) {
        codigoPostal = "48" + codigoPostal.slice(2)
        modificado = true
        return true
    } else if (direccionFinal == "") {
        direccionFinal = "Dirección no disponible"
        modificado++
        return true
    }
    return true
}

function getInsertadasCorrectamenteEU() {
    return insertadas_correctamente;
}

function getModificadosEU() {
    return insertadas_corregidas;
}

function getDescartadosEU() {
    return descartadas;
}

module.exports = { euskadi, getInsertadasCorrectamenteEU, getModificadosEU, getDescartadosEU };

euskadi()