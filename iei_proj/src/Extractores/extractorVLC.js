const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { Builder, By } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;
let nombresProcesados = [];
let motivosDescarte = "";
let modificaciones = "";
let motivoModificacion = "";
let registrosReparadosVLC = [];
let registrosRechazadosVLC = [];

let provincia = "";
let nombresInsertados = [];
const apiKey = 'AIzaSyD0LXYibe50Cav5v9mcH0ec0IT4YBUaAgQ';

// Función para consumir la API y devolver el archivo de datos en JSON
async function extraerDatos() {
    const fetch = (await import('node-fetch')).default;
    try {
        const response = await fetch('http://localhost:3001/CVAPI');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error extrayendo y guardando datos:', error);
    }
}

// Función principal
async function valencia() {
    registrosReparadosVLC.length = 0;
    registrosRechazadosVLC.length = 0;
    insertadas_correctamente = 0;
    insertadas_corregidas = 0;
    descartadas = 0;
    modificado = false;
    nombresProcesados = [];

    try {
        const data = await extraerDatos();

        console.log(data);

        for (const monumento of data) {
            modificado = false;
            await guardarEnBD(monumento);
        }

        console.log('Todos los monumentos han sido procesados.');
        console.log('Monumentos insertados correctamente:', insertadas_correctamente);
        console.log('Monumentos corregidos:', insertadas_corregidas);
        console.log('Monumentos descartados:', descartadas);
    } catch (err) {
        console.error('Error procesando los monumentos:', err);
    }
}

// Función para guardar en la base de datos
async function guardarEnBD(monumento) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        provincia = monumento.PROVINCIA;

        let correcto = await verificarProvincia();
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        municipio = monumento.MUNICIPIO;
        correcto = await verificarMunicipio(municipio);
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        correcto = await verificarNombre(monumento.DENOMINACION);
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        correcto = await verificarCoordenadas(monumento.UTMNORTE, monumento.UTMESTE);
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        const coordenadas = await obtenerCoordenadas(monumento);
        const latitud = coordenadas.latitud;
        const longitud = coordenadas.longitud;

        if (!latitud || !longitud) {
            registrarRechazo(monumento, "Coordenadas no disponibles");
            return;
        }

        const nombreMonumento = monumento.DENOMINACION;

        if (nombresProcesados.includes(nombreMonumento)) {
            motivosDescarte = `Monumento duplicado: ${nombreMonumento}`;
            descartadas++;
            registrarRechazo(monumento, "Monumento duplicado: ${nombreMonumento}");
            return ;
          }

        let codPost = await obtenerCodigoPostal(latitud, longitud);
        let direccion = await obtenerDireccion(latitud, longitud);
        codigoPostal = validarCodigoPostal(codPost, monumento.PROVINCIA);

        if (!codigoPostal) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        if (nombresInsertados.includes(monumento.DENOMINACION)) {
            registrarRechazo(monumento, "Monumento duplicado");
            return;
        } else {
            nombresInsertados.push(monumento.DENOMINACION);
        }

        // Guardar en la base de datos
        await supabase.from('Provincia').insert([{ nombre: provincia }]);
        await supabase.from('Localidad').insert([{ nombre: municipio, en_provincia: provincia }]);

        const tipo = determinarTipo(monumento.DENOMINACION || '');
        await supabase.from('Monumento').insert([{
            nombre: monumento.DENOMINACION || 'Nombre desconocido',
            tipo,
            direccion: direccion || 'Dirección no disponible',
            latitud: latitud,
            longitud: longitud,
            codigo_postal: codigoPostal || 'Código postal no disponible',
            en_localidad: municipio,
            descripcion: `Monumento en la localidad de ${municipio}`
        }]);

        if (modificado) {
            registrarReparacion(monumento, motivoModificacion, modificaciones);
            insertadas_corregidas++;
        } else {
            insertadas_correctamente++;
            nombresProcesados.push(nombreMonumento);
        }
    } catch (err) {
        console.error('Error guardando en BD', err);
        registrarRechazo(monumento, "Error al guardar en la base de datos");
        descartadas++;
    }
}

// Funciones auxiliares de validación
async function verificarProvincia() {
    if (!provincia) {
        motivosDescarte = "Provincia no disponible";
        descartadas++;
        return false;
    }
    if (provincia === "CASTELLON") {
        provincia = "CASTELLÓN";
        modificaciones = "Añadida la tilde de Castelón";
        motivoModificacion = "'Castellon' sin tilde"
        modificado = true;
    }
    if (!["ALICANTE", "CASTELLÓN", "VALENCIA"].includes(provincia)) {
        motivosDescarte = "Provincia incorrecta";
        descartadas++;
        return false;
    }
    return true;
}

async function verificarMunicipio(municipio) {
    if (!municipio) {
        motivosDescarte = "Municipio no disponible";
        descartadas++;
        return false;
    }
    return true;
}

async function verificarNombre(nombre) {
    if (!nombre) {
        motivosDescarte = "Nombre del monumento no disponible";
        descartadas++;
        return false;
    }
    return true;
}

async function verificarCoordenadas(UTMNORTE, UTMESTE) {
    if (!UTMNORTE || !UTMESTE) {
        motivosDescarte = "Faltan coordenadas ";
        descartadas++;
        return false;
    }
    return true;
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

async function obtenerCodigoPostal(latitud, longitud) {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitud},${longitud}&key=${apiKey}`);
        const postalCode = response.data.results[0].address_components.find(c => c.types.includes("postal_code")).long_name;
        return postalCode;
    } catch (err) {
        console.error('Error obteniendo el código postal:', err);
        return null;
    }
}

async function obtenerDireccion(latitud, longitud) {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitud},${longitud}&key=${apiKey}`);
        return response.data.results[0].formatted_address;
    } catch (err) {
        console.error('Error obteniendo la dirección:', err);
        return null;
    }
}

function validarCodigoPostal(codigoPostal, provincia) {
    if (!codigoPostal || codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
        motivosDescarte = "Código postal no disponible o no válido";
        return null;
    }
    return codigoPostal;
}

function determinarTipo(denominacion) {
    const lowername = denominacion.toLowerCase();
    if (lowername.includes('yacimiento')) return 'Yacimiento Arqueológico';
    if (lowername.includes('iglesia') || lowername.includes('ermita')) return 'Iglesia-Ermita';
    if (lowername.includes('monasterio') || lowername.includes('convento')) return 'Monasterio-Convento';
    if (lowername.includes('castillo') || lowername.includes('fortaleza') || lowername.includes('torre')) return 'Castillo-Fortaleza-Torre';
    if (lowername.includes('palacio') || lowername.includes('casa')) return 'Edificio singular';
    return 'Otros';
}

// Funciones para registrar reparaciones y rechazos
function registrarReparacion(monumento, motivo, operacion) {
    registrosReparadosVLC.push({
        fuente: "Valencia",
        nombre: monumento.DENOMINACION,
        localidad: monumento.MUNICIPIO,
        motivoError: motivo,
        operacion: operacion,
    });
}

function registrarRechazo(monumento, motivo) {
    registrosRechazadosVLC.push({
        fuente: "Valencia",
        nombre: monumento.DENOMINACION,
        localidad: monumento.PROVINCIA,
        motivoError: motivo,
    });
}

// Funciones para obtener datos
function getInsertadasCorrectamenteVLC() {
    return insertadas_correctamente;
}

function getModificadosVLC() {
    return insertadas_corregidas;
}

function getDescartadosVLC() {
    return descartadas;
}

// Exportar funciones
module.exports = {
    valencia,
    getInsertadasCorrectamenteVLC,
    getModificadosVLC,
    getDescartadosVLC,
    registrosReparadosVLC,
    registrosRechazadosVLC,
};
