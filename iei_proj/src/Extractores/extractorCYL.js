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
      console.log(`Archivo JSON guardado en: ${outputFilePath}`);
    });
  } catch (err) {
    console.error(`Error al leer el archivo XML: ${err}`);
  }
}

// Si este archivo se ejecuta directamente, convertimos el archivo XML especificado a JSON
const xmlFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentos.xml');
const outputFolder = path.join(__dirname, '../FuentesDeDatos');
xmlToJson(xmlFilePath, outputFolder);  // Llamamos a la función para hacer la conversión

// Función principal para procesar el archivo JSON
async function castillayleon() {
  try {
    // Leer archivo JSON de manera asíncrona
    const jsonFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentos.json');
    console.time('Tiempo de ejecución');

    const data = await fs.readFile(jsonFilePath, 'utf8');  // Leemos el archivo JSON
    const jsonData = JSON.parse(data);  // Parseamos el JSON

    // Asegurarse de que la estructura es correcta y contiene los monumentos
    const monumentos = jsonData?.monumentos?.monumento || [];


    if (monumentos.length === 0) {
      console.log('No se encontraron monumentos en el archivo JSON.');
      return;
    }

    // Limitar a los primeros 5 monumentos
    const primerosCincoMonumentos = monumentos.slice(0, 5);

    // Iterar solo sobre los primeros 5 monumentos
    for (const monumento of primerosCincoMonumentos) {
      console.log(`Procesando monumento: ${monumento.denominacion}`);
      await guardarEnBD(monumento);
    }

    console.timeEnd('Tiempo de ejecución');
    console.log('Todos los monumentos han sido procesados.');
    console.log('Monumentos insertados correctamente:', insertadas_correctamente);
    console.log('Monumentos corregidos:', insertadas_corregidas);
  } catch (err) {
    console.error('Error procesando el archivo JSON:', err);
  }
}

// Función para guardar el monumento en la base de datos
async function guardarEnBD(monumento) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  provincia = monumento.territory;
  municipio = monumento.municipality;

  let correcto = await verificarProvincia();
  if (!correcto) return;

  correcto = await verificarMunicipio();
  if (!correcto) return;

  correcto = await verificarMonumento();
  if (!correcto) return;

  if (modificado) {
    insertadas_corregidas++;
  } else {
    insertadas_correctamente++;
  }

  try {
    // Insertar provincia, municipio y monumento
    console.log(`Insertando provincia: ${provincia}`);
    console.log(`Insertando municipio: ${municipio}`);
    console.log(`Insertando monumento: ${monumento.denominacion}`);

    // Insertar provincia
    const { error: error1 } = await supabase
      .from('Provincia')
      .insert([{ nombre: provincia }]);

    if (error1) {
      console.error('Error al insertar la provincia:', error1.message);
    } else {
      console.log('Provincia insertada correctamente');
    }

    // Insertar municipio
    const { error: error2 } = await supabase
      .from('Localidad')
      .insert([{ nombre: municipio, en_provincia: provincia }]);

    if (error2) {
      console.error('Error al insertar el municipio:', error2.message);
    } else {
      console.log('Municipio insertado correctamente');
    }

    // Insertar monumento
    const { error: error3 } = await supabase
      .from('Monumento')
      .insert([{
        nombre: monumento.denominacion,
        tipo: determinarTipo(monumento.denominacion),
        direccion: monumento.direccion,
        descripcion: monumento.descripcion,
        latitud: monumento.latitud,
        longitud: monumento.longitud,
        codigo_postal: validarCodigoPostal(monumento.postalCode, provincia),
        en_localidad: municipio
      }]);

    if (error3) {
      console.error('Error al insertar el monumento:', error3.message);
    } else {
      console.log('Monumento insertado correctamente');
    }
  } catch (err) {
    console.error('Error guardando en BD', err);
  }
}

// Función para determinar el tipo de monumento
function determinarTipo(denominacion) {
  const lowername = denominacion.toLowerCase();

  if (lowername.includes('yacimiento')) return 'yacimiento arqueológico';
  if (lowername.includes('iglesia') || lowername.includes('ermita') || lowername.includes('catedral') || lowername.includes('sinagoga')) return 'Iglesia-Ermita';
  if (lowername.includes('monasterio') || lowername.includes('convento') || lowername.includes('santuario')) return 'Monasterio-Convento';
  if (lowername.includes('castillo') || lowername.includes('palacio') || lowername.includes('torre') || lowername.includes('muralla') || lowername.includes('puerta')) return 'Castillo-Fortaleza-Torre';
  if (lowername.includes('casa consistorial') || lowername.includes('casa noble') || lowername.includes('real sitio') || lowername.includes('sitio histórico')) return 'Iglesia-Ermita';
  if (lowername.includes('puente')) return 'Puente';
  return 'otros';
}

// Función para validar el código postal
function validarCodigoPostal(codigoPostal, provincia) {
  if (!codigoPostal) {
    console.error("Error: Código postal no disponible.");
    return null;
  }

  codigoPostal = codigoPostal.toString().trim();

  if ((provincia.toUpperCase() === "AVILA" || provincia.toUpperCase() === "BURGOS") && codigoPostal.length === 4) {
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
async function verificarMonumento() {
  if (monumento == null) {
    descartadas++;
    return false;
  }
}

module.exports = { xmlToJson };  // Exportamos la función para que pueda ser utilizada en otros archivos si es necesario
castillayleon();
