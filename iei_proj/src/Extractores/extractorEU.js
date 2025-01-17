const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const { createClient } = require('@supabase/supabase-js');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;

let motivosDescarte = "";
let modificaciones = "";
let motivoModificacion = "";
let registrosReparadosEU = [];
let registrosRechazadosEU = [];

let provincia = "";

// Función para consumir la API y devolver el archivo de datos en JSON
async function extraerDatos() {
    const fetch = (await import('node-fetch')).default;
    try {
        const response = await fetch('http://localhost:3008/EuskadiAPI');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error extrayendo y guardando datos:', error);
    }
}

// Función principal
async function euskadi() {
    registrosReparadosEU.length = 0;
    registrosRechazadosEU.length = 0;
    insertadas_correctamente = 0;
    insertadas_corregidas = 0;
    descartadas = 0;
    modificado = false;
    
    try {
        const data = await extraerDatos();

        console.time('Tiempo de ejecución');
        for (const monumento of data) {
            await guardarEnBD(monumento);
        }
        console.timeEnd('Tiempo de ejecución');

        console.log('Todos los monumentos han sido procesados.');
        console.log('Monumentos insertados correctamente:', insertadas_correctamente);
        console.log('Monumentos corregidos:', insertadas_corregidas);
        console.log('Monumentos descartados:', descartadas);
        console.log('Motivos de descarte:', motivosDescarte);
    } catch (err) {
        console.error('Error:', err);
    }
}

// Función para guardar en la base de datos
async function guardarEnBD(monumento) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    modificado = false;
    provincia = monumento.territory;
    municipio = monumento.municipality;
    const nombreMonumento = monumento.documentName;
    const descripcionMonumento = monumento.documentDescription;
    const codigoPostal = monumento.postalCode;
    const direccionFinal = monumento.firstAddress;
    const longitud = monumento.lonwgs84;
    const latitud = monumento.latwgs84;
    const territoryCode = monumento.territorycode;

    if (!(await verificarProvincia())) {
        registrarRechazo(monumento, motivosDescarte);
        return;
    }

    if (!(await verificarMunicipio())) {
        registrarRechazo(monumento, motivosDescarte);
        return;
    }

    if (!(await verificarCodigoPostal(codigoPostal))) {
        registrarRechazo(monumento, motivosDescarte);
        return;
    }

    if (!(await verificarMonumento(monumento))) {
        registrarRechazo(monumento, motivosDescarte);
        return;
    }

    if (modificado) {
        registrarReparacion(monumento, motivoModificacion, modificaciones);
        insertadas_corregidas++;
    } else {
        insertadas_correctamente++;
    }

    try {
        await supabase.from('Provincia').insert([{ nombre: provincia }]);
        await supabase.from('Localidad').insert([{ nombre: municipio, en_provincia: provincia }]);
        await supabase.from('Monumento').insert([
            {
                nombre: nombreMonumento,
                tipo: determinarTipo(nombreMonumento),
                direccion: direccionFinal,
                descripcion: descripcionMonumento,
                latitud: latitud,
                longitud: longitud,
                codigo_postal: codigoPostal,
                en_localidad: municipio,
            },
        ]);
    } catch (error) {
        console.error('Error al guardar en la base de datos:', error);
    }
}

// Funciones de verificación y validación
async function verificarProvincia() {
    if (!provincia) {
        motivosDescarte = "Provincia no disponible";
        descartadas++;
        return false;
    }
    if (provincia === "Araba/Álava") {
        provincia = "Araba";
        modificaciones = "Provincia cambiada a Araba (Separar / y borrar Álava)";
        motivoModificacion = "Nombre de provincia con /";
        modificado = true;
        return true;
    }
    if (!["Gipuzkoa", "Bizkaia", "Araba"].includes(provincia)) {
        motivosDescarte = "Provincia no válida";
        descartadas++;
        return false;
    }
    return true;
}

async function verificarMunicipio() {
    if (!municipio) {
        motivosDescarte = "Municipio no disponible";
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

async function verificarCodigoPostal(codigoPostal) {
    if (!codigoPostal || codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) {
        motivosDescarte = "Código postal inexistente o de formato no válido";
        descartadas++;
        return false;
    }
    return true;
}

async function verificarMonumento(monumento) {
    if (!monumento.documentName || !monumento.documentDescription|| !monumento.latwgs84 || !monumento.lonwgs84) {
        motivosDescarte = "Datos del monumento incompletos";
        descartadas++;
        return false;
    } else if (!monumento.postalCode.startsWith(monumento.territorycode)) {
        motivosDescarte = "Código postal fuera de rango";
        descartadas++
        return false
    } else if (monumento.firstAddress == "") {
        direccionFinal = "Dirección no disponible"
        modificaciones = "Evitar null poniendo dirección no disponible"
        motivoModificacion = "Dirección del monumento es Null";
        modificado = true;
        return true
    } else if (monumento.lonwgs84 > 90 || monumento.latwgs84 > 90 || monumento.lonwgs84 < -90 || monumento.latwgs84 < -90) {
        motivosDescarte = "Longitud o latitud fuera de rango";
        descartadas++
        return false
    }
    return true;
}

function determinarTipo(denominacion) {
    const lowername = denominacion.toLowerCase();
    if (lowername.includes('iglesia') || lowername.includes('ermita')) return 'Iglesia-Ermita';
    if (lowername.includes('monasterio') || lowername.includes('convento')) return 'Monasterio-Convento';
    if (lowername.includes('castillo') || lowername.includes('fortaleza') || lowername.includes('torre')) return 'Castillo-Fortaleza-Torre';
    if (lowername.includes('palacio') || lowername.includes('casa')) return 'Edificio singular';
    return 'Otros';
}

// Función para registrar reparaciones y rechazos
function registrarReparacion(monumento, motivo, operacion) {
    console.log(monumento);
    registrosReparadosEU.push({
        fuente: "Euskadi",
        nombre: monumento.documentName,
        localidad: monumento.municipality,
        motivoError: motivo,
        operacion: operacion,
    });
}

function registrarRechazo(monumento, motivo) {
    registrosRechazadosEU.push({
        fuente: "Euskadi",
        nombre: monumento.documentName,
        localidad: monumento.municipality,
        motivoError: motivo,
    });
}

// Funciones para obtener datos
function getInsertadasCorrectamenteEU() {
    return insertadas_correctamente;
  
}

function getModificadosEU() {
    return insertadas_corregidas;
}

function getDescartadosEU() {
    return descartadas;
}

// Exportar funciones
module.exports = {
    euskadi,
    getInsertadasCorrectamenteEU,
    getModificadosEU,
    getDescartadosEU,
    registrosReparadosEU,
    registrosRechazadosEU,
};
