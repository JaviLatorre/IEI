const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const { createClient } = require('@supabase/supabase-js');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;
let nombresProcesados = [];
let motivosDescarte = "";
let modificaciones = "";
let motivoModificacion = "";
let registrosReparadosCYL = [];
let registrosRechazadosCYL = [];

let provincia = "";

let codigoPostal = "";

// Función para consumir la API y devolver los datos en JSON
async function extraerDatos() {
    const fetch = (await import('node-fetch')).default;
    try {
        const response = await fetch('http://localhost:3002/CYLAPI'); // Cambia la URL según corresponda
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error extrayendo datos:', error);
    }
}

// Función principal
async function castillayleon() {
  
    registrosReparadosCYL.length = 0;
    registrosRechazadosCYL.length = 0;
    insertadas_correctamente = 0;
    insertadas_corregidas = 0;
    descartadas = 0;
    modificado = false;
    nombresProcesados = [];


    try {
        const data = await extraerDatos();

        console.log(data.monumentos.monumento);

        for (const monumento of data.monumentos.monumento) {
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
        provincia = monumento.poblacion.provincia;
        
        let correcto = await verificarProvincia();
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        municipio = monumento.poblacion.municipio;
        correcto = await verificarMunicipio();
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        const nombreMonumento = monumento.nombre;
        const descripcionMonumento = monumento.Descripcion;
        const latitud = monumento.coordenadas.latitud;
        const longitud = monumento.coordenadas.longitud;
        codigoPostal = monumento.codigoPostal;
        correcto = await verificarMonumento(monumento, latitud, longitud, codigoPostal, nombreMonumento, municipio);
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }

        correcto = await validarCodigoPostal(codigoPostal, provincia);
        if (!correcto) {
            registrarRechazo(monumento, motivosDescarte);
            return;
        }
        

        // Guardar en la base de datos
        await supabase.from('Provincia').insert([{ nombre: provincia }]);
        await supabase.from('Localidad').insert([{ nombre: municipio, en_provincia: provincia }]);
        await supabase.from('Monumento').insert([{
            nombre: nombreMonumento,
            tipo: determinarTipo(nombreMonumento),
            direccion: monumento.direccion || 'Dirección no disponible',
            descripcion: descripcionMonumento,
            latitud: monumento.coordenadas.latitud,
            longitud: monumento.coordenadas.longitud,
            codigo_postal: codigoPostal || 'Código postal no disponible',
            en_localidad: municipio,
        }]);

        if (modificado) {
            registrarReparacion(monumento, motivoModificacion, modificaciones);
            insertadas_corregidas++;
        } else {
            insertadas_correctamente++;
            nombresProcesados.push(nombreMonumento);
        }
    } catch (err) {
        console.error('Error guardando en BD:', err);
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
    const provinciasValidas = ["Ávila", "Burgos", "León", "Palencia", "Salamanca", "Segovia", "Soria", "Valladolid", "Zamora"];
    if (!provinciasValidas.includes(provincia)) {
        motivosDescarte = "Provincia no válida";
        descartadas++;
        return false;
    }
    return true;
}

async function verificarMunicipio() {
    if (!municipio) {
        motivosDescarte = 'Municipio no disponible';
        descartadas++;
        return false;
    }

    if (municipio.includes('/')) {
        municipio = municipio.split('/')[0];
        modificaciones = "Municipio dividido y modificado";
        motivoModificacion = "Nombre de municipio con /";
        modificado = true;
      }

    return true;
}

// Función para verificar el monumento
async function verificarMonumento(monumento, longitud, latitud, codigoPostal, nombreMonumento, municipio) {
    if (!monumento) {
      motivosDescarte = 'Monumento nulo';
      descartadas++;
      return false;
    }
  
    if (!latitud || !longitud) {
      motivosDescarte = 'Coordenadas incompletas';
      descartadas++;
      return false;
    }
  
    if (!/^[0-9.-]+$/.test(longitud)) {
      motivosDescarte = `Longitud inválida: ${longitud}`;
      descartadas++;
      return false;
    }
  
    if (!codigoPostal) {
      motivosDescarte = 'Código postal no disponible';
      descartadas++;
      return false;
    }
  
    if (nombresProcesados.includes(nombreMonumento)) {
      motivosDescarte = `Monumento duplicado: ${nombreMonumento}`;
      descartadas++;
      return false;
    }
  
    return true;
  }

  // Función para validar el código postal
function validarCodigoPostal(codigoPostal, provincia) {
    if (!codigoPostal) {
      motivosDescarte = 'Código postal no disponible';
      descartadas++;
      return false;
    }
  
    codigoPostal = codigoPostal.toString().trim();
  
    if ((provincia === "Ávila" || provincia === "Burgos") && codigoPostal.length === 4) {
        codigoPostal = "0" + codigoPostal;
        modificaciones = "Código postal cambiado a " + codigoPostal;
        motivoModificacion = "Código postal de 4 dígitos porque empieza por 0";
      modificado = true;
      return codigoPostal;
    }
  
    if ((provincia === "León" && !codigoPostal.startsWith("24")) || (provincia === "Palencia" && !codigoPostal.startsWith("34")) 
      || (provincia === "Salamanca" && !codigoPostal.startsWith("37")) || (provincia === "Segovia" && !codigoPostal.startsWith("40"))
      || (provincia === "Soria" && !codigoPostal.startsWith("42")) || (provincia === "Valladolid" && !codigoPostal.startsWith("47"))
      || (provincia === "Zamora" && !codigoPostal.startsWith("49")) || (provincia === "Ávila" && !codigoPostal.startsWith("04"))
      || (provincia === "Burgos" && !codigoPostal.startsWith("09"))
    ) {
      motivosDescarte = `Código postal inválido: ${codigoPostal}`;
      descartadas++;
      return false;
    }
  
    if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
      motivosDescarte = `Código postal inválido: ${codigoPostal}`;
      descartadas++;
      return false;
    }
  
    return codigoPostal;
  }

// Función para determinar el tipo de monumento
function determinarTipo(denominacion) {
    const lowername = denominacion.toLowerCase();
    if (lowername.includes('iglesia') || lowername.includes('ermita')) return 'Iglesia-Ermita';
    if (lowername.includes('monasterio') || lowername.includes('convento')) return 'Monasterio-Convento';
    if (lowername.includes('castillo') || lowername.includes('fortaleza') || lowername.includes('torre')) return 'Castillo-Fortaleza-Torre';
    if (lowername.includes('palacio') || lowername.includes('casa')) return 'Edificio singular';
    return 'Otros';
}

// Funciones para registrar reparaciones y rechazos
function registrarReparacion(monumento, motivo, operacion) {
    registrosReparadosCYL.push({
        fuente: "Castilla y León",
        nombre: monumento.nombre,
        localidad: monumento.poblacion.municipio,
        motivoError: motivo,
        operacion: operacion,
    });
}

function registrarRechazo(monumento, motivo) {
    registrosRechazadosCYL.push({
        fuente: "Castilla y León",
        nombre: monumento.nombre,
        provincia: monumento.poblacion.provincia,
        motivoError: motivo,
    });
}

// Funciones para obtener datos
function getInsertadasCorrectamenteCYL() {
    return insertadas_correctamente;
}

function getModificadosCYL() {
    return insertadas_corregidas;
}

function getDescartadosCYL() {
    return descartadas;
}

// Exportar funciones
module.exports = {
    castillayleon,
    getInsertadasCorrectamenteCYL,
    getModificadosCYL,
    getDescartadosCYL,
    registrosReparadosCYL,
    registrosRechazadosCYL,
};
