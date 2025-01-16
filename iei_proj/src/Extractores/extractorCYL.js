// fuente de datos monumentos
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const { createClient } = require('@supabase/supabase-js');

const fs = require('fs').promises;  // Usamos la versión Promesa de 'fs' para trabajar con async/await
const path = require('path');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;
let nombresProcesados = [];
let motivosDescarte = [];

let provincia = "";

// Función para consumir la API y devolver el archivo de datos en JSON
async function extraerDatos(){
  const fetch = (await import('node-fetch')).default //Usamos una importación dinámica para este módulo porque es un modulo ESM y el proyecto usa CommonJS, así 
                                                      //lo podemos importar y no se queja.
  
  try {
      // Consumir la API
      const response = await fetch('http://localhost:3002/CyLAPI');
      const data = await response.json();
      return data
  } catch (error) {
      console.error('Error extrayendo y guardando datos:', error);
  } 
}

// Función principal para procesar el archivo JSON
async function castillayleon() {
  try {
    console.log("goadfa")
    const data = await extraerDatos()
    console.log(JSON.stringify(data, null, 2))

    const monumentos = data?.monumentos?.monumento || [];

    console.time('Tiempo de ejecución');

    // Procesar cada monumento
    for (const monumento of monumentos) {
      await guardarEnBD(monumento);
    }

    console.timeEnd('Tiempo de ejecución');
    console.log(`Número de monumentos procesados: ${monumentos.length}`);
    console.log('Monumentos insertados correctamente:', insertadas_correctamente);
    console.log('Monumentos corregidos:', insertadas_corregidas);
    console.log('Monumentos descartados:', descartadas);
    console.log('Motivos de descarte:', motivosDescarte);
  } catch (err) {
    console.error('Error procesando el archivo JSON:', err);
  }
}

// Función para guardar el monumento en la base de datos
async function guardarEnBD(monumento) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  provincia = monumento.poblacion.provincia;
  let municipio = monumento.poblacion.municipio;
  const nombreMonumento = monumento.nombre;
  let longitudFinal = monumento.coordenadas.longitud;
  const latitud = monumento.coordenadas.latitud;
  const codigoPostal = monumento.codigoPostal;
  modificado = false;

  // Verificar datos
  //if (!(await verificarProvincia())) return;
  if (!(await verificarMunicipio(municipio))) return;
  if (!(await verificarMonumento(monumento, longitudFinal, latitud, codigoPostal, nombreMonumento, municipio))) return;

  const codiPostalValidado = validarCodigoPostal(codigoPostal, provincia);
  if (!codiPostalValidado) return;
    console.log(codiPostalValidado)

  if (modificado) insertadas_corregidas++;
  else insertadas_correctamente++;

  try {
    // Insertar provincia
    await supabase.from('Provincia').upsert([{ nombre: provincia }]);

    // Insertar municipio
    await supabase.from('Localidad').upsert([{ nombre: municipio, en_provincia: provincia }]);

    // Insertar monumento
    const { error } = await supabase.from('Monumento').insert([
      {
        nombre: nombreMonumento,
        tipo: determinarTipo(monumento.tipoMonumento),
        direccion: determinarDireccion(monumento.calle),
        descripcion: limpiarDescripcion(monumento.Descripcion),
        latitud: latitud,
        longitud: longitudFinal,
        codigo_postal: codiPostalValidado,
        en_localidad: municipio,
      },
    ]);

    if (error) {
      console.error('Error al insertar el monumento:', error.message);
    } else {
      nombresProcesados.push(nombreMonumento);
    }
  } catch (err) {
    console.error('Error guardando en BD:', err);
  }
}

// Función para normalizar texto (sin acentos y en mayúsculas)
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Función para determinar el tipo de monumento
function determinarTipo(denominacion) {
  const lowername = denominacion.toLowerCase();

  if (lowername.includes('yacimiento')) return 'Yacimiento Arqueológico';
  if (lowername.includes('iglesia') || lowername.includes('ermita') || lowername.includes('catedral') || lowername.includes('sinagoga')) return 'Iglesia-Ermita';
  if (lowername.includes('monasterio') || lowername.includes('convento') || lowername.includes('santuario')) return 'Monasterio-Convento';
  if (lowername.includes('castillo') || lowername.includes('palacio') || lowername.includes('torre') || lowername.includes('muralla') || lowername.includes('puerta')) return 'Castillo-Fortaleza-Torre';
  if (lowername.includes('puente')) return 'Puente';
  return 'Otros';
}

// Función para determinar la dirección
function determinarDireccion(calle) {
  if (!calle) return 'Dirección no disponible';
  return calle;
}

// Función para limpiar descripciones
function limpiarDescripcion(texto) {
  return texto ? texto.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '') : '';
}

// Función para validar el código postal
function validarCodigoPostal(codigoPostal, provincia) {
  if (!codigoPostal) {
    motivosDescarte.push('Código postal no disponible');
    descartadas++;
    return false;
  }

  codigoPostal = codigoPostal.toString().trim();

  if ((provincia === "Ávila" || provincia === "Burgos") && codigoPostal.length === 4) {
    modificado = true;
    return "0" + codigoPostal;
  }

  if ((provincia === "León" && !codigoPostal.startsWith("24")) || (provincia === "Palencia" && !codigoPostal.startsWith("34")) 
    || (provincia === "Salamanca" && !codigoPostal.startsWith("37")) || (provincia === "Segovia" && !codigoPostal.startsWith("40"))
    || (provincia === "Soria" && !codigoPostal.startsWith("42")) || (provincia === "Valladolid" && !codigoPostal.startsWith("47"))
    || (provincia === "Zamora" && !codigoPostal.startsWith("49")) || (provincia === "Ávila" && !codigoPostal.startsWith("04"))
    || (provincia === "Burgos" && !codigoPostal.startsWith("09"))
  ) {
    motivosDescarte.push(`Código postal inválido: ${codigoPostal}`);
    descartadas++;
    return false;
  }

  if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
    motivosDescarte.push(`Código postal inválido: ${codigoPostal}`);
    descartadas++;
    return false;
  }

  return codigoPostal;
}

// Función para verificar la provincia
async function verificarProvincia() {
  const provinciasValidas = ["LEÓN", "PALENCIA", "BURGOS", "ZAMORA", "VALLADOLID", "SORIA", "SEGOVIA", "SALAMANCA", "ÁVILA"];

  if (!provinciasValidas.includes(provincia)) {
    motivosDescarte.push(`Provincia inválida: ${provincia}`);
    descartadas++;
    return false;
  }
  return true;
}

// Función para verificar el municipio
async function verificarMunicipio(municipio) {
  if (!municipio) {
    motivosDescarte.push('Municipio no disponible');
    descartadas++;
    return false;
  }

  if (municipio.includes('/')) {
    municipio = municipio.split('/')[0];
    modificado = true;
  }

  return true;
}

// Función para verificar el monumento
async function verificarMonumento(monumento, longitud, latitud, codigoPostal, nombreMonumento, municipio) {
  if (!monumento) {
    motivosDescarte.push('Monumento nulo');
    descartadas++;
    return false;
  }

  if (!latitud || !longitud) {
    motivosDescarte.push('Coordenadas incompletas');
    descartadas++;
    return false;
  }

  if (!/^[0-9.-]+$/.test(longitud)) {
    motivosDescarte.push(`Longitud inválida: ${longitud}`);
    modificado = true;
  }

  if (!codigoPostal) {
    motivosDescarte.push('Código postal no disponible');
    descartadas++;
    return false;
  }

  if (nombresProcesados.includes(nombreMonumento)) {
    motivosDescarte.push(`Monumento duplicado: ${nombreMonumento}`);
    descartadas++;
    return false;
  }

  return true;
}

function getInsertadasCorrectamenteCL() {
    return insertadas_correctamente;
}

function getModificadosCL() {
    return insertadas_corregidas;
}

function getDescartadosCL() {
    return descartadas;
}

castillayleon()

module.exports = { castillayleon, getInsertadasCorrectamenteCL, getModificadosCL, getDescartadosCL };
