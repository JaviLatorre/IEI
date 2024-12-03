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


function xmlToJson(xmlFilePath, outputFolder) {  // Definimos la función que convierte XML a JSON
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });  // Creamos un parser que nos ayudará a convertir el XML a JSON

  // Leemos el archivo XML especificado en la ruta 'xmlFilePath' (que está en formato texto)
  fs.readFile(xmlFilePath, 'utf-8', (err, data) => {
    if (err) {  // Si ocurre un error al leer el archivo
      console.error(`Error al leer el archivo XML: ${err}`);  // Mostramos el error en consola
      return;  // Terminamos la función si hay error
    }

    // Parseamos el contenido del archivo XML a un objeto JSON
    parser.parseString(data, (err, result) => {  // 'result' es el objeto JSON resultante del parseo
      if (err) {  // Si ocurre un error al parsear el XML
        console.error(`Error al parsear el XML: ${err}`);  // Mostramos el error en consola
        return;  // Terminamos la función si hay error
      }

      // Aquí podemos modificar la estructura si lo necesitamos, pero por ahora no cambiamos el contenido del JSON.

      // Generamos el nombre del archivo JSON basado en el nombre del archivo XML
      const jsonFileName = path.basename(xmlFilePath, path.extname(xmlFilePath)) + '.json';  // Obtenemos el nombre del archivo XML y lo cambiamos a '.json'
      const outputFilePath = path.join(outputFolder, jsonFileName);  // Creamos la ruta completa del archivo JSON usando la carpeta de salida

      // Escribimos el JSON resultante en el archivo generado con formato legible (2 espacios de indentación)
      fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf-8');  // Usamos 'JSON.stringify' para convertir el objeto JSON a texto
      console.log(`Archivo JSON guardado en: ${outputFilePath}`);  // Mostramos un mensaje indicando que el archivo se guardó correctamente
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
        console.log(data);
      });
      
  
      // Parsear contenido JSON
      const jsonData = JSON.parse(data);
      
      // Asegurarse de que la estructura es correcta y contiene los monumentos
      const monumentos = jsonData?.root?.monumento || [];
      
      if (monumentos.length === 0) {
        console.log('No se encontraron monumentos en el archivo JSON.');
        return;
      }
  
      // Iterar sobre los monumentos e insertarlos en la base de datos
      for (const monumento of monumentos) {
        await guardarEnBD(monumento);
      }
  
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
    // Insertar provincia
    const { data: provData, error: provError } = await supabase
      .from('Provincia')
      .select('*')
      .eq('nombre', provincia)
      .single();

    if (!provData) {
      await supabase.from('Provincia').insert([{ nombre: provincia }]);
    }

    // Insertar municipio
    await supabase.from('Localidad').insert([
      { nombre: municipio, en_provincia: provincia }
    ]);

    // Insertar monumento
    await supabase.from('Monumento').insert([
      {
        nombre: monumento.denominacion,
        tipo: determinarTipo(monumento.denominacion),
        direccion: monumento.direccion,
        descripcion: monumento.descripcion,
        latitud: monumento.latitud,
        longitud: monumento.longitud,
        codigo_postal: validarCodigoPostal(monumento.postalCode, provincia),
        en_localidad: municipio
      }
    ]);
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