const fs = require('fs');  // Importamos el módulo 'fs' para poder trabajar con archivos (leer y escribir)
const path = require('path');  // Importamos el módulo 'path' para trabajar con rutas de archivos de forma flexible
const xml2js = require('xml2js');  // Importamos el módulo 'xml2js' para convertir archivos XML a JSON

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

async function valencia(){
  try {
    // Leer archivo JSON
    const data = await fs.readFile(xmlToJson(), 'utf8');

    // Parsear el contenido como JSON
    const jsonData = JSON.parse(data);

    // Iterar sobre los monumentos y esperar que se complete cada operación
    for (const monumento of jsonData){
      await guardarEnBD(monumento);
    }

    console.log('Todos los monumentos han sido procesados.');
  } catch (err) {
    console.error('Error: ', err);
  }
}

async function guardarEnBD(monumento) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
      const { data: provincia, error: error1} = await supabase
              .from('Provincia')
              .insert([
              { nombre: monumento.provincia},
              ])
               .select()
      if(error1){
          //console.error('Error guardando la procvincia:',error1);
      }
      
      //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
      const{data: local, error: error2} = await supabase  
          .from('Localidad')
          .insert([
              { nombre: monumento.municipo, en_provincia: monumento.en_provincia },
            ])
            .select()
      if(error2){
          //console.error('Error guardando el municipio:',error2);
      }

}

module.exports = { xmlToJson };  // Exportamos la función para que pueda ser utilizada en otros archivos si es necesario
