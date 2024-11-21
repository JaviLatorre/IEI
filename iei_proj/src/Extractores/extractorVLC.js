const fs = require('fs');  
const path = require('path');  

const {Builder , By} = require('selenium-webdriver');

const csv = require('csv-parser');  

const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');


function csvToJson(csvFilePath, outputFolder) {  // Definimos una función que convertirá el CSV a JSON
  const results = [];  // Creamos un array vacío donde almacenaremos los resultados (cada fila del CSV)

  // Abrimos el archivo CSV y le indicamos que el delimitador es el punto y coma (';')
  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ';' }))  // Usamos el separador adecuado para que el parser entienda las columnas
    .on('data', (data) => {  // Cada vez que leemos una nueva fila (un objeto con los datos de la fila)
      // Limpiar las comillas innecesarias en los valores de cada columna
      for (const key in data) {  // Recorremos cada clave de la fila
        if (data.hasOwnProperty(key)) {  // Verificamos que la clave es propia del objeto
          data[key] = data[key].replace(/"/g, '').trim();  // Quitamos las comillas dobles y los espacios extra
        }
      }
      results.push(data);  // Añadimos la fila limpia al array de resultados
    })
    .on('end', () => {  // Cuando termine de leer todo el archivo CSV
      // Generamos el nombre del archivo JSON de salida, tomando el nombre del CSV y cambiando la extensión a '.json'
      const jsonFileName = path.basename(csvFilePath, path.extname(csvFilePath)) + '.json';
      // Creamos la ruta completa para el archivo de salida, usando la carpeta de salida y el nombre del archivo JSON
      const outputFilePath = path.join(outputFolder, jsonFileName);
      
      // Escribimos el contenido de 'results' (el array con las filas del CSV convertidas a JSON) en un archivo JSON
      fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');  // Usamos 'JSON.stringify' para convertir el array a JSON
      //console.log(Archivo JSON guardado en: ${outputFilePath});  // Imprimimos un mensaje indicando dónde se guardó el archivo JSON
    });
}

// Ejecutamos la conversión si el archivo se ejecuta directamente, especificando la ruta del CSV y la carpeta de salida
const csvFilePath = path.join(__dirname, '../FuentesDeDatos', 'bienes_inmuebles_interes_cultural.csv');
const outputFolder = path.join(__dirname, '../FuentesDeDatos');
csvToJson(csvFilePath, outputFolder);  // Llamamos a la función para convertir el CSV a JSON
//module.exports = { csvToJson };  // Exportamos la función en caso de que la necesitemos en otro archivo

async function valencia(){
  try {
    // Leer archivo JSON
    const filepath = path.join(__dirname, '../FuentesDeDatos', 'bienes_inmuebles_interes_cultural.json');
    const data = await fs.readFile(filepath, 'utf8');

    // Parsear el contenido como JSON
    const jsonData = JSON.parse(data);

    // Iterar sobre los monumentos y esperar que se complete cada operación
    for (const monumento of jsonData){
      await guardarEnBD(monumento);
    }

    console.log('Todos los monumentos han sido procesados.');
  } catch (err) {
    console.error('Error procesando los monumentos: ', err);
  }
}

async function guardarEnBD(monumento) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try{

      const {latitud, longitud} = await obtenerCoordenadas(monumento);

      const codigoPostal = latitud && longitud ? await await obtenerCodigoPostal(latitud, longitud) : 'Código postal no disponible';
      //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
      const { error: error1} = await supabase
              .from('Provincia')
              .insert([
              { nombre: monumento.provincia},
              ])
               .select()
      if(error1){
        console.error('Error guardando la procvincia:',error1);
      }
      
      //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
      const{ error: error2} = await supabase  
          .from('Localidad')
          .insert([
              { nombre: monumento.municipo, en_provincia: monumento.en_provincia },
            ])
            .select()
      if(error2){
          console.error('Error guardando la localidad:',error2);
      }

      //Insertar Monumento 
      const{ error: error3} = await supabase  
          .from('Monumento')
          .insert([
              { nombre: monumento.denominacion,
                tipo: determinarTipo(monumento.denominacion),
                direccion : direccion || 'Dirección no disponible',
                descripcion : 'Monumento en la localidad de ${monumento.municipio}', 
                latitud: parseFloat(monumento.UTMNORTE)|| null ,
                longitud: parseFloat(monumento.UTMESTE) || null,
                codigo_postal: codigoPostal,  
                en_localidad: monumento.municipo,
              },
            ])
            .select()
      if(error3){
          console.error('Error guardando el municipio:',error3);
      }

    }catch(err){
        console.error('Error guardando en BD', err);

    }

}

 function determinarTipo(denominacion){
 const lowername = denominacion.toLowerCase();

 if(lowername.includes('yacimiento')) return 'yacimiento arqueológico';
 if(lowername.includes('iglesia') || lowername.includes('ermita')) return 'Iglesia-Ermita';
 if(lowername.includes('monasterio') || lowername.includes('convento')) return 'Monasterio-Convento';
 if(lowername.includes('castillo') || lowername.includes('fortaleza') || lowername.includes('torre')) return 'Castillo-Fortaleza-Torre';
 if(lowername.includes('palacio') || lowername.includes('casa') || lowername.includes('teatro')  || lowername.includes('ayuntamiento')) return 'Iglesia-Ermita';
 if(lowername.includes('puente') ) return 'Puente';
 return 'otros';
}

// Función para obtener la dirección con Selenium
async function  obtenerCoordenadas(monumento) {
  let driver;
  try{
    driver = await new Builder().forBrowser('chrome').build();

    //para acceder a la página web 
    await driver.get('https://www.latlong.net/'); 
    
    const searchBox = await driver.findElement(By.id('place'));
    await searchBox.sendKeys(monumento.denominacion);

    const searchButton = await driver.findElement(By.xpath("//button[@type='button' and contains(text(), 'Find')]"));
    await searchButton.click();

    await driver.sleep(3000);

    const latitud = await driver.findElement(By.xpath("//input[@id='lat']")).getAttribute('value');
    const longitud = await driver.findElement(By.xpath("//input[@id='lng']")).getAttribute('value');

    return{
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),


    };

  }catch(err){

    console.error('Error obteniendo coordenadas', err);
    return {latitud: null, longitud: null}; 
  }finally{
    if( driver) await driver.quit();

  }


  
}

async function obtenerCodigoPostal(latitud, longitud){
 let driver; 
 try{
    driver = await new Builder().forBrowser('chrome').build();

    await driver.get('https://www.gps-coordinates.net/');

    const latInput = await driver.findElement(By.id('latitude'));
    const lngInput = await driver.findElement(By.id('longitude'));

    await latInput.sendKeys(latitud.toString());
    await lngInput.sendKeys(longitud.toString());

    const searchButton = await driver.findElement(By.xpath("//button[contains(text(), 'Get Address')]"));
    await searchButton.click();

   
    await driver.sleep(3000);

    
    const postalCodeElement = await driver.findElement(By.xpath("//span[@id='postal']"));
    const codigoPostal = await postalCodeElement.getText();

    return codigoPostal || 'Código postal no disponible';

 }catch(err){
      console.log('Error obteniendo el código postal:',err);
      return 'Código postal no disponible';
 }finally{
      if(driver) await driver.quit();

 }


}



valencia();