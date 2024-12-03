//fuente de datos bienes_inmuebles
const fs = require('fs');  
const path = require('path');  

const {Builder , By} = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');

const csv = require('csv-parser');  

const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;

let provincia = "";

function csvToJson(csvFilePath, outputFolder) {  // Definimos una función que convertirá el CSV a JSON
  const results = [];  // Creamos un array vacío donde almacenaremos los resultados (cada fila del CSV)

  // Abrimos el archivo CSV y le indicamos que el delimitador es el punto y coma (';')
  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          data[key] = data[key].replace(/"/g, '').trim();
        }
      }
      results.push(data);
    })
    .on('end', () => {
      const jsonFileName = path.basename(csvFilePath, path.extname(csvFilePath)) + '.json';
      const outputFilePath = path.join(outputFolder, jsonFileName);
      fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`Archivo JSON guardado en: ${outputFilePath}`);
    });
}
 
async function valencia() {
  try {
    const filepath = path.join(__dirname, '../FuentesDeDatos', 'bienes_inmuebles_interes_cultural.json');
    const data = await fs.promises.readFile(filepath, 'utf8');
   
    const jsonData = JSON.parse(data);
    const primerosCuatro = jsonData.slice(0,4);
 
    for (const monumento of primerosCuatro) {
      await guardarEnBD(monumento);
    }

    console.log('Todos los monumentos han sido procesados.');
    console.log('Monumentos insetados correctamente: ', insertadas_correctamente)
    console.log('Monumentos corregidos: ', insertadas_corregidas)
    console.log('Monumentos descartados: ', descartadas)

  } catch (err) {
    console.error('Error procesando los monumentos:', err);
  }
}
 
async function guardarEnBD(monumento) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try{

      const {latitud, longitud} = await obtenerCoordenadas(monumento);

      //Saca el código postal según las coordenadas y lo verifica
      let codigoPostal = latitud && longitud ? await await obtenerCodigoPostal(latitud, longitud) : 'Código postal no disponible';

      codigoPostal = validarCodigoPostal(codigoPostal, monumento.PROVINCIA);

      //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
      const { error: error1} = await supabase
              .from('Provincia')
              .insert([
              { nombre: monumento.PROVINCIA},
              ])
               .select()
      if(error1){
        console.error('Error guardando la procvincia:',error1);
      }
      
      //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
      const{ error: error2} = await supabase  
          .from('Localidad')
          .insert([{ nombre: monumento.MUNICIPIO, en_provincia: monumento.PROVINCIA }]);
      if (error2) console.error('Error guardando la localidad:', error2);
 
      // Insertar monumento
      const tipo = determinarTipo(monumento.DENOMINACION || '');
      const { error: error3 } = await supabase
          .from('Monumento')
          .insert([
              {
                  nombre: monumento.DENOMINACION || 'Nombre desconocido',
                  tipo,
                  direccion: coordenadas.direccion || 'Dirección no disponible',
                  latitud: parseFloat(coordenadas.latitud) || null,
                  longitud: parseFloat(coordenadas.longitud) || null,
                  codigo_postal: coordenadas.codigoPostal || 'Código postal no disponible',
                  en_localidad: monumento.MUNICIPIO,
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
 
async function obtenerCoordenadas(monumento) {
  let driver;
  try{
    driver = await new Builder().forBrowser('chrome').build();

    //para acceder a la página web 
    await driver.get('https://www.tool-online.com/es/conversion-coordenadas.php'); 

    await driver.findElement(By.xpath("/html/body/div[7]/div[2]/div[2]/div[3]/div[2]/button[1]")).click()

    let seleccionPaisOrigen = new Select(driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[1]/div[1]/div[4]/select")))
    await seleccionPaisOrigen.selectByVisibleText('Espana')

    let seleccionFormatoOrigen = new Select(driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[1]/div[1]/div[5]/div[1]/select")))
    await seleccionFormatoOrigen.selectByVisibleText('WGS 84 / UTM zone 30N')

    let seleccionPaisDestino = new Select(driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[4]/select")))
    await seleccionPaisDestino.selectByVisibleText('Espana')

    let seleccionFormatoDestino = new Select(driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[5]/div[1]/select")))
    await seleccionFormatoDestino.selectByVisibleText('ETRS89')

    await driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[1]/div[1]/div[1]/div[2]/div[2]/div[1]/input")).sendKeys(monumento.UTMNORTE)
    await driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[1]/div[1]/div[2]/div[2]/div[2]/div[1]/input")).sendKeys(monumento.UTMESTE)

    await driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[2]/button")).click()

    const latitud = await driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[2]/div[2]/div[2]/div[1]/input")).getAttribute('value');
    const longitud = await driver.findElement(By.xpath("/html/body/div[5]/div/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[1]/div[2]/div[2]/div[1]/input")).getAttribute('value');

    console.log(latitud)
    console.log(longitud)
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

    await driver.get('https://www.geocords.com');

    await driver.findElement(By.xpath("/html/body/div/div[2]/div[2]/div[2]/div[2]/button[1]")).click()

    await driver.findElement(By.xpath("/html/body/section[1]/div/div/div/div[1]/div/div/form/div/input")).sendKeys(`${latitud} ${longitud}`)

    await driver.findElement(By.xpath("/html/body/section[1]/div/div/div/div[1]/div/div/form/button")).click()

    const codigoPostal = await driver.findElement(By.xpath("/html/body/section[2]/div/div/div/div[1]/div/div[2]/p[6]/code")).getText();
    console.log(codigoPostal)

    return codigoPostal || 'Código postal no disponible';

 }catch(err){
      console.log('Error obteniendo el código postal:',err);
      return 'Código postal no disponible';
 }finally{
      if(driver) await driver.quit();

 }


}

function validarCodigoPostal(codigoPostal, provincia) {
  // Verifica si el código postal es nulo o indefinido
  if (!codigoPostal) {
    console.error("Error: Código postal no disponible.");
    return null;
  }

  // Elimina espacios extra por si acaso
  codigoPostal = codigoPostal.toString().trim();

  // Si la provincia es Alicante y el código postal tiene 4 dígitos, añade un 0 al inicio
  if (provincia.toUpperCase() === "ALICANTE" && codigoPostal.length === 4) {
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


valencia();