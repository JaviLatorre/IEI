//fuente de datos bienes_inmuebles
const fs = require('fs');  
const path = require('path');  
const axios = require('axios');

const {Builder , By} = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select'); 

const {SUPABASE_URL, SUPABASE_KEY} = require('../credencialesSupaBase')
const { createClient, SupabaseClient } = require('@supabase/supabase-js');
const { get } = require('http');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;
let nombresInsertados = [];
const apiKey = 'AIzaSyD0LXYibe50Cav5v9mcH0ec0IT4YBUaAgQ';

let provincia = "";

// Función para consumir la API y devolver el archivo de datos en JSON
async function extraerDatos(){
  const fetch = (await import('node-fetch')).default //Usamos una importación dinámica para este módulo porque es un modulo ESM y el proyecto usa CommonJS, así 
                                                      //lo podemos importar y no se queja.
  
  try {
      // Consumir la API
      const response = await fetch('http://localhost:3001/CVAPI');
      const data = await response.json();
      return data
  } catch (error) {
      console.error('Error extrayendo y guardando datos:', error);
  } 
} 
 
async function valencia() {
  try {
    const data = await extraerDatos()
    //console.log(data)
   
    //const jsonData = JSON.parse(data);
    //const primerosCuatro = jsonData.slice(0,4);
 
    for (const monumento of data) {
      modificado = false
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

      provincia = monumento.PROVINCIA

      let correcto = await verificarProvincia()
        if (!correcto) {
            return
        }
      
      municipio = monumento.MUNICIPIO
      correcto = await verificarMunicipio(municipio)
        if (!correcto) {
            return
        }
        
      correcto = await verificarNombre(monumento.DENOMINACION)
        if (!correcto) {
            return
        }

      correcto = await verificarCoordenadas(monumento.UTMNORTE, monumento.UTMESTE)
        if (!correcto) {
            return
        }

      // Obtén las coordenadas
      const coordenadas = await obtenerCoordenadas(monumento);
      const latitud = coordenadas.latitud;
      const longitud = coordenadas.longitud;
      console.log(latitud)
      console.log(longitud)
 
      // Verifica si las coordenadas son válidas antes de continuar
      if (!latitud || !longitud) {
        console.log(`Coordenadas no disponibles para el monumento: ${monumento.DENOMINACION}`);
        descartadas++;
        return;
      }

      // Obtén el código postal según las coordenadas
      let codPost = await obtenerCodigoPostal(latitud, longitud);
      let direccion = await obtenerDireccion(latitud, longitud);
      codigoPostal = validarCodigoPostal(codPost, monumento.PROVINCIA);

      if(nombresInsertados.length > 0 && nombresInsertados.includes(monumento.DENOMINACION)){
        console.log("Monumento ya guardado, este es un repetido")
        descartadas++;
        return;
      }
      else{
        nombresInsertados.push(monumento.DENOMINACION)
      }

      //Guardar en SupaBase la provincia donde se encuentra el monumento (si aún no está guardada)
      const { error: error1} = await supabase
              .from('Provincia')
              .insert([
              { nombre: provincia},
              ])
               .select()
      if(error1){
        console.error('Error guardando la provincia:',error1);
      }
      
      //Guardar en SupaBase el municipio donde se encuentra el monumento (si aún no está guardada)
      const{ error: error2} = await supabase  
          .from('Localidad')
          .insert([{ nombre: monumento.MUNICIPIO, en_provincia: provincia }]);
      if (error2) console.error('Error guardando la localidad:', error2);
 
      // Insertar monumento
      const tipo = determinarTipo(monumento.DENOMINACION || '');
      const { error: error3 } = await supabase
          .from('Monumento')
          .insert([
              {
                  nombre: monumento.DENOMINACION || 'Nombre desconocido',
                  tipo,
                  direccion: direccion || 'Dirección no disponible',
                  latitud: latitud,
                  longitud: longitud,
                  codigo_postal: codigoPostal || 'Código postal no disponible',
                  en_localidad: monumento.MUNICIPIO,
                  descripcion: `Monumento en la localidad de ${monumento.MUNICIPIO}`
              },
            ])
            .select()
      if(error3){
          console.error('Error guardando el municipio:',error3);
      }else{
        if(modificado){insertadas_corregidas++}
        else{insertadas_correctamente++}
      }

    }catch(err){
        console.error('Error guardando en BD', err);
        descartadas++

    }

}

async function verificarProvincia(){
  if(provincia == ""){
      descartadas++
      return false
  }
  else if(provincia ==="CASTELLON"){
    provincia = "CASTELLÓN"
    modificado = true
    return true
  }
  else if (provincia!= "ALICANTE" && provincia != "CASTELLÓN" && provincia != "VALENCIA"){
      descartadas++
      return false
  }
  return true
}

async function verificarMunicipio(municipio){
  if(municipio == ""){
      descartadas++
      return false
  } else{
    return true
  }
}

async function verificarNombre(nombre) {
  if(nombre == ""){
    descartadas++
    return false
  } else{
  return true
  }
}

async function verificarCoordenadas(UTMNORTE, UTMESTE) {
  if(UTMNORTE == "" || UTMESTE == ""){
    descartadas++
    return false
  } else{
    return true
  }
}
 function determinarTipo(denominacion){
 const lowername = denominacion.toLowerCase();

 if(lowername.includes('yacimiento')) return 'Yacimiento Arqueológico';
 if(lowername.includes('iglesia') || lowername.includes('ermita')) return 'Iglesia-Ermita';
 if(lowername.includes('monasterio') || lowername.includes('convento')) return 'Monasterio-Convento';
 if(lowername.includes('castillo') || lowername.includes('fortaleza') || lowername.includes('torre')) return 'Castillo-Fortaleza-Torre';
 if(lowername.includes('palacio') || lowername.includes('casa') || lowername.includes('teatro')  || lowername.includes('ayuntamiento')) return 'Edificio singular';
 if(lowername.includes('puente') ) return 'Puente';
 return 'Otros';
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
 try {
       // Primera solicitud para postal_code
       const postalCodeResponse = await axios.get(
         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitud},${longitud}&result_type=postal_code&key=${apiKey}`
       );
       const postalAddress = postalCodeResponse.data.results[0].formatted_address;
       const postalCodeMatch = postalAddress.match(/^\d{5}/);
       const codigoPostal = postalCodeMatch ? postalCodeMatch[0] : 'Código postal no encontrado';
       console.log(codigoPostal)

       return codigoPostal 

     } catch (error) {
       console.error('Error en la solicitud de código postal:', error.response?.data || error.message);
     }

}

async function obtenerDireccion(latitud, longitud){
  try {
        // Solicitud para street_address
        const streetAddressResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitud},${longitud}&result_type=street_address&key=${apiKey}`
        );
        let direccion = streetAddressResponse.data.results[0].formatted_address;
        console.log(direccion)

        return direccion
 
      } catch (error) {
        console.error('Error en la solicitud de dirección:', error.response?.data || error.message);
      }
 
 }
 

function validarCodigoPostal(codigoPostal, provincia) {
  // Verifica si el código postal es nulo o indefinido
  if (!codigoPostal) {
    console.error("Error: Código postal no disponible.");
    return null;
  }

  
  if(codigoPostal == 'Código postal no disponible') return codigoPostal
  // Elimina espacios extra por si acaso
  codigoPostal = codigoPostal.toString().trim();

  // Si la provincia es Alicante y el código postal tiene 4 dígitos, añade un 0 al inicio
  if (provincia.toUpperCase() === "ALICANTE" && codigoPostal.length === 4) {
    return "0" + codigoPostal;
  }

  // Comprueba que todos los códigos postales tengan 5 dígitos
  
  if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
    console.error(`Error: El código postal ${codigoPostal} es incorrecto para la provincia ${provincia}.`);
    return null;
  }

  // Devuelve el código postal válido
  return codigoPostal;
}

function getInsertadasCorrectamenteVLC() {
  return insertadas_correctamente;
}

function getModificadosVLC() {
  return insertadas_corregidas;
}

function getDescartadosVLC() {
  return descartadas;
}

module.exports = {valencia, getInsertadasCorrectamenteVLC, getModificadosVLC, getDescartadosVLC}