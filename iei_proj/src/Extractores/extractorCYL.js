// fuente de datos monumentos
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const { createClient, SupabaseClient } = require('@supabase/supabase-js');

const fs = require('fs').promises;  // Usamos la versión Promesa de 'fs' para trabajar con async/await
const path = require('path');
const xml2js = require('xml2js');  // Importamos el módulo 'xml2js' para convertir archivos XML a JSON

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;
let nombresProcesados=[];

let provincia = "";

// Función para convertir XML a JSON de manera asíncrona
async function xmlToJson(xmlFilePath, outputFolder) {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: false });

  try {
    const data = await fs.readFile(xmlFilePath, 'utf-8');  // Leemos el archivo XML
    parser.parseString(data, async (err, result) => {  // Parseamos el contenido del archivo XML
      if (err) {
        console.error(`Error al parsear el XML: ${err}`);
        return;
      }

      // Genera la ruta de salida y verifica si la carpeta existe
      const jsonFileName = path.basename(xmlFilePath, path.extname(xmlFilePath)) + '.json';
      const outputFilePath = path.join(outputFolder, jsonFileName);

      // Asegúrate de que la carpeta de salida exista
      if (!fs.access(outputFolder)) {
        await fs.mkdir(outputFolder, { recursive: true });
      }

      // Guarda el JSON resultante de manera asíncrona
      await fs.writeFile(outputFilePath, JSON.stringify(result, null, 2), 'utf-8');
      //console.log(`Archivo JSON guardado en: ${outputFilePath}`);
    });
  } catch (err) {
    console.error(`Error al leer el archivo XML: ${err}`);
  }
}

// Si este archivo se ejecuta directamente, convertimos el archivo XML especificado a JSON
const xmlFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentosEntrega1.xml');
const outputFolder = path.join(__dirname, '../FuentesDeDatos');
xmlToJson(xmlFilePath, outputFolder);  // Llamamos a la función para hacer la conversión

// Función principal para procesar el archivo JSON
async function castillayleon() {
  try {
    // Leer archivo JSON
    const jsonFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentosEntrega1.json');

    try {
      console.time('Tiempo de ejecución');
  
      // Leer archivo JSON generado
      const data = await fs.readFile(jsonFilePath, 'utf8');
      
      // Parsear contenido JSON
      const jsonData = JSON.parse(data);

      // Ver la estructura del JSON para depuración (opcional)
      //console.log('Estructura del JSON:', JSON.stringify(jsonData, null, 2));
      
      // Acceder correctamente a los monumentos
      const monumentos = jsonData?.monumentos?.monumento || [];
      
      if (monumentos.length === 0) {
        console.log('No se encontraron monumentos en el archivo JSON.');
        return;
      }

      // // Limitar a los primeros 5 monumentos
      // const primerosCincoMonumentos = monumentos.slice(0, 5);

      // Contador de monumentos procesados
      let monumentosProcesados = 0;

      // Iterar solo sobre los primeros 5 monumentos
      for (const monumento of monumentos) {
        //console.log('Monumento completo:', monumento); // Imprimir todo el objeto de cada monumento
        await guardarEnBD(monumento);
        monumentosProcesados++; // Aumentar el contador cada vez que se procesa un monumento
      }

      console.timeEnd('Tiempo de ejecución');
      console.log(`Número de monumentos procesados: ${monumentosProcesados}`);
      console.log('Monumentos insertados correctamente:', insertadas_correctamente);
      console.log('Monumentos corregidos:', insertadas_corregidas);
      console.log('Monumentos descartados:', descartadas);
      //console.log(nombresProcesados);
    } catch (err) {
      console.error('Error procesando el archivo JSON:', err);
    }
  } catch (err) {
    console.error('Error procesando llamando a castillayLeon function:', err);
  }
}



// Función para guardar el monumento en la base de datos
async function guardarEnBD(monumento) {
  //console.log('guardando monumento');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  provincia = monumento.poblacion.provincia;
  nombreMonumento=monumento.nombre;
  municipio = monumento.poblacion.municipio;
  longitudFinal = monumento.coordenadas.longitud;
  latitud = monumento.coordenadas.latitud;
  codigoPostal = monumento.codigoPostal;
  modificado=false;


  let correcto = await verificarProvincia();
  if (!correcto) return;

  correcto = await verificarMunicipio();
  if (!correcto) return;

  correcto = await verificarMonumento(monumento);
  if (!correcto) return;
  if (modificado) {
    insertadas_corregidas++;
  } else {
    insertadas_correctamente++;
  }
  
  try {
    // Insertar provincia, municipio y monumento
    // console.log(`Insertando provincia: ${provincia}`);
    // console.log(`Insertando municipio: ${municipio}`);
    // console.log(`Insertando monumento: ${monumento.nombre}`);

    // Insertar provincia
    const { error: error1 } = await supabase
      .from('Provincia')
      .insert([{ nombre: provincia }]);

    if (error1) {
      console.error('Error al insertar la provincia:', error1.message);
    } else {
      //console.log('Provincia insertada correctamente');
    }

    // Insertar municipio
    const { error: error2 } = await supabase
      .from('Localidad')
      .insert([{ nombre: municipio, en_provincia: provincia }]);

    if (error2) {
      console.error('Error al insertar el municipio:', error2.message);
    } else {
      //console.log('Municipio insertado correctamente');
    }

    // Insertar monumento
    const { error: error3 } = await supabase
      .from('Monumento')
      .insert([{
        nombre: monumento.nombre,
        tipo: determinarTipo(monumento.tipoMonumento),
        direccion: determinarDireccion(monumento.calle),
        descripcion: limpiarDescripcion(monumento.Descripcion),
        latitud: monumento.coordenadas.latitud,
        longitud: longitudFinal,
        codigo_postal: validarCodigoPostal(monumento.codigoPostal, provincia),
        en_localidad: municipio
      }]);
      nombresProcesados.push(monumento.nombre)
    if (error3) {
      console.error('Error al insertar el monumento:', error3.message);
    } else {
      //console.log('Monumento insertado correctamente');
    }
  } catch (err) {
    console.error('Error guardando en BD', err);
  }
}



// Función para determinar el tipo de monumento
function determinarTipo(denominacion) {
  const lowername = denominacion.toLowerCase();

  if (lowername.includes('yacimiento')) return 'Yacimiento Arqueológico';
  if (lowername.includes('iglesia') || lowername.includes('ermita') || lowername.includes('catedral') || lowername.includes('sinagoga')) return 'Iglesia-Ermita';
  if (lowername.includes('monasterio') || lowername.includes('convento') || lowername.includes('santuario')) return 'Monasterio-Convento';
  if (lowername.includes('castillo') || lowername.includes('palacio') || lowername.includes('torre') || lowername.includes('muralla') || lowername.includes('puerta')) return 'Castillo-Fortaleza-Torre';
  if (lowername.includes('casa consistorial') || lowername.includes('casa noble') || lowername.includes('real sitio') || lowername.includes('sitio histórico')) return 'Iglesia-Ermita';
  if (lowername.includes('puente')) return 'Puente';
  return 'Otros';
}

function determinarDireccion(calle){
  if(calle == null) calle = 'Dirección no disponible';
  return calle;
}
function limpiarDescripcion(texto) {
  // Expresión regular para eliminar etiquetas <p> con o sin atributos
  return texto.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '');
}
// Función para validar el código postal
function validarCodigoPostal(codigoPostal, provincia) {
  if (!codigoPostal) {
    console.error("Error: Código postal no disponible.");
    return null;
  }

  codigoPostal = codigoPostal.toString().trim();

  if ((provincia.toUpperCase() === "ÁVILA" || provincia.toUpperCase() === "BURGOS") && codigoPostal.length === 4) {
    return "0" + codigoPostal;
  }

  if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
    console.error(`Error: El código postal ${codigoPostal} es incorrecto para la provincia ${provincia}.`);
    return null;
  }

  return codigoPostal;
}

// Función para verificar la provincia
async function verificarProvincia() {
  if (provincia === "") {
    descartadas++;
    return false;
  } else if (!["León", "Palencia", "Burgos", "Zamora", "Valladolid", "Soria", "Segovia", "Salamanca", "Ávila"].includes(provincia)) {
    descartadas++;
    return false;
  }
  return true;
}

// Función para verificar el municipio
async function verificarMunicipio() {
  if (municipio === "") {
    descartadas++;
    return false;
  } else if (municipio.includes('/')) {
    const textoAntes = municipio.split('/')[0];
    municipio = textoAntes;
    modificado = true;
    return true;
  }
  return true;
}

// Función para verificar el monumento
async function verificarMonumento(monumento) {
  if (monumento === null) {
    descartadas++;
    return false;
  } else if (longitudFinal === "" || latitud === "") {
    descartadas++;
    return false
  } else if (codigoPostal === null || codigoPostal === "" || 'codigoPostal' in monumento === false) {
    descartadas++;
    return false;
  } else if (nombresProcesados.includes(nombreMonumento)) {
    descartadas++;
    return false;
  } else if (!/^[0-9.-]+$/.test(longitudFinal)) {  // Validar longitud
    console.log(`Longitud inválida: "${longitudFinal}". Se modifica.`);
    longitudFinal = longitudFinal.replace(/#/g, "");
    modificado=true;
    return true;
  }
  return true;
}

function getInsertadasCorrectamenteCYL() {
  return insertadas_correctamente;
}

function getModificadosCYL() {
  return insertadas_corregidas;
}

function getDescartadosCYL() {
  return descartadas;
}

castillayleon()

module.exports = { xmlToJson, castillayleon, getInsertadasCorrectamenteCYL, getModificadosCYL, getDescartadosCYL };  // Exportamos la función para que pueda ser utilizada en otros archivos si es necesario