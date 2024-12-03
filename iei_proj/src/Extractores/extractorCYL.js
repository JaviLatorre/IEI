// fuente de datos monumentos
const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');

const fs = require('fs');  // Importamos el módulo 'fs' para poder trabajar con archivos (leer y escribir)
const path = require('path');  // Importamos el módulo 'path' para trabajar con rutas de archivos de forma flexible
const xml2js = require('xml2js');  // Importamos el módulo 'xml2js' para convertir archivos XML a JSON

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;

let provincia = "";


function xmlToJson(xmlFilePath, outputFolder) {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: false });  // Ajusta la configuración del parser

  fs.readFile(xmlFilePath, 'utf-8', (err, data) => {
    if (err) {
      console.error(`Error al leer el archivo XML: ${err}`);
      return;
    }

    parser.parseString(data, (err, result) => {
      if (err) {
        console.error(`Error al parsear el XML: ${err}`);
        return;
      }

      // Imprime el JSON para verificar su contenido
      //console.log(JSON.stringify(result, null, 2));

      // Genera la ruta de salida y verifica si la carpeta existe
      const jsonFileName = path.basename(xmlFilePath, path.extname(xmlFilePath)) + '.json';
      const outputFilePath = path.join(outputFolder, jsonFileName);

      // Asegúrate de que la carpeta de salida exista
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }

      // Guarda el JSON resultante
      fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`Archivo JSON guardado en: ${outputFilePath}`);
    });
  });
}


// Si este archivo se ejecuta directamente, convertimos el archivo XML especificado a JSON
const xmlFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentos.xml');  // Especificamos la ruta del archivo XML
const outputFolder = path.join(__dirname, '../FuentesDeDatos');  // Especificamos la carpeta donde se guardará el archivo JSON
xmlToJson(xmlFilePath, outputFolder);  // Llamamos a la función para hacer la conversión

async function castillayleon(){
  try {
    // Leer archivo JSON
    const jsonFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentos.json');

    try {
      console.time('Tiempo de ejecución');
  
      // Leer archivo JSON generado
      const data = await fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) throw err;
        //console.log(data);
      });
      
  
      // Parsear contenido JSON
      const jsonData = JSON.parse(data);
      
      // Asegurarse de que la estructura es correcta y contiene los monumentos
      const monumentos = jsonData?.root?.monumento || [];
      
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
  
      // // Iterar sobre los monumentos e insertarlos en la base de datos
      // for (const monumento of monumentos) {
      //   await guardarEnBD(monumento);
      // }
  
      console.timeEnd('Tiempo de ejecución');
  
      console.log('Todos los monumentos han sido procesados.');
      console.log('Monumentos insertados correctamente:', insertadas_correctamente);
      console.log('Monumentos corregidos:', insertadas_corregidas);
    } catch (err) {
      console.error('Error procesando el archivo JSON:', err);
    }
  }catch (err) {
    console.error('Error procesando llamando a castillayLeon function:', err);
  }
}

async function guardarEnBD(monumento) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  provincia = monumento.territory;
  municipio = monumento.municipality;

  //console.log(`Verificando provincia: ${provincia}`);
  let correcto = await verificarProvincia();
  if (!correcto) return;

  //console.log(`Verificando municipio: ${municipio}`);
  correcto = await verificarMunicipio();
  if (!correcto) return;

  //console.log(`Verificando monumento: ${monumento.denominacion}`);
  correcto = await verificarMonumento();
  if (!correcto) return;

  if (modificado) {
    insertadas_corregidas++;
  } else {
    insertadas_correctamente++;
  }

  try {
    // Depuración: Log de los datos que se van a insertar
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




function determinarTipo(denominacion){
 const lowername = denominacion.toLowerCase();

 if(lowername.includes('yacimiento')) return 'yacimiento arqueológico';
 if(lowername.includes('iglesia') || lowername.includes('ermita') || lowername.includes('catedral') || lowername.includes('sinagoga')) return 'Iglesia-Ermita';
 if(lowername.includes('monasterio') || lowername.includes('convento') || lowername.includes('santuario')) return 'Monasterio-Convento';
 if(lowername.includes('castillo') || lowername.includes('palacio') || lowername.includes('torre') || lowername.includes('muralla') || lowername.includes('puerta')) return 'Castillo-Fortaleza-Torre';
 if(lowername.includes('casa consistorial') || lowername.includes('casa noble') || lowername.includes('real sitio')  || lowername.includes('sitio histórico')) return 'Iglesia-Ermita';
 if(lowername.includes('puente') ) return 'Puente';
 return 'otros';
}

function validarCodigoPostal(codigoPostal, provincia) {
  // Verifica si el código postal es nulo o indefinido
  if (!codigoPostal) {
    console.error("Error: Código postal no disponible.");
    return null;
  }

  // Elimina espacios extra por si acaso
  codigoPostal = codigoPostal.toString().trim();

  // Si la provincia es Ávila o Burgos y el código postal tiene 4 dígitos, añade un 0 al inicio
  if (provincia.toUpperCase() === "AVILA" || provincia.toUpperCase() === "BURGOS" && codigoPostal.length === 4) {
    return "0" + codigoPostal;
  }

  // Comprueba que todos los códigos postales tengan 5 dígitos
  if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
    console.error('Error: El código postal ${codigoPostal}" es incorrecto para la provincia "${provincia}.');
    return null;
  }

  // Devuelve el código postal válido
  return codigoPostal;
}

async function verificarProvincia(){
  if(provincia == ""){
      descartadas++
      return false
  }
  else if (provincia != "León" && provincia != "Palencia" && provincia != "Burgos" && provincia != "Zamora"
    && provincia != "Valladolid" && provincia != "Soria" && provincia != "Segovia" && provincia != "Salamanca" && provincia != "Ávila"
  ){
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

async function verificarMonumento() {
  if (monumento == null) {
      descartadas++
      return false
  } 
}

module.exports = { xmlToJson };  // Exportamos la función para que pueda ser utilizada en otros archivos si es necesario
castillayleon();