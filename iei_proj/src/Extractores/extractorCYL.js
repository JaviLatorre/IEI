const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');
const { createClient } = require('@supabase/supabase-js');

let insertadas_correctamente = 0;
let insertadas_corregidas = 0;
let descartadas = 0;
let modificado = false;

let registrosReparadosCYL = [];
let registrosRechazadosCYL = [];

let provincia = "";

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

    try {
        const data = await extraerDatos();

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
            registrarRechazo(monumento, "Provincia no válida "+ provincia);
            return;
        }

        municipio = monumento.poblacion.municipio;
        correcto = await verificarMunicipio();
        if (!correcto) {
            registrarRechazo(monumento, "Municipio no válido");
            return;
        }

        const nombreMonumento = monumento.nombre;
        const descripcionMonumento = monumento.Descripcion;

        if (!nombreMonumento || !descripcionMonumento) {
            registrarRechazo(monumento, "Datos del monumento incompletos");
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
            codigo_postal: monumento.codigoPostal || 'Código postal no disponible',
            en_localidad: municipio,
        }]);

        if (modificado) {
            registrarReparacion(monumento, "Datos corregidos");
            insertadas_corregidas++;
        } else {
            insertadas_correctamente++;
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
        descartadas++;
        return false;
    }
    const provinciasValidas = ["Ávila", "Burgos", "León", "Palencia", "Salamanca", "Segovia", "Soria", "Valladolid", "Zamora"];
    if (!provinciasValidas.includes(provincia)) {
        descartadas++;
        return false;
    }
    return true;
}

async function verificarMunicipio() {
    if (!municipio) {
        descartadas++;
        return false;
    }
    return true;
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
function registrarReparacion(monumento, motivo) {
    registrosReparadosCYL.push({
        fuente: "Castilla y León",
        nombre: monumento.nombre,
        localidad: monumento.municipio,
        motivoError: motivo,
    });
}

function registrarRechazo(monumento, motivo) {
    registrosRechazadosCYL.push({
        fuente: "Castilla y León",
        nombre: monumento.nombre,
        localidad: monumento.municipio,
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
