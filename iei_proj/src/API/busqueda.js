// Importar módulos necesarios
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');

// Crear la aplicación Express
const app = express();
const port = 3005;
let respuestaApi = [];

// Configurar cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware para procesar JSON
app.use(express.json());


app.get('/API/busqueda.js', async (req, res) =>{
    try {
        // Extraer datos del filtro de la solicitud
        const consulta = {
            localidad,
            codPostal,
            provincia,
            tipo                
        } = req.query;

        console.log('la api se llama')
        console.log(consulta);
        // Buscar según los criterios en la tabal Monumentos de Supabase
        let query = await supabase
            .from('Monumento')
            .select('*')
        // Aplicar filtros
        if (consulta.localidad) {
            query.eq('en_localidad', consulta.localidad)
        }
        if (consulta.codPostal) {
            query.eq('codigo_postal', consulta.codPostal)
        }
        if (consulta.tipo) {
            query.eq('tipo', consulta.tipo)
        }
        if (consulta.provincia) {
            
            const { data: localidades, error: error2 } = await supabase
            .from('Localidad')
            .select('nombre')
            .eq('en_provincia', provincia);
    
            if (error2) throw error2;
    
            if (localidades && localidades.length > 0) {
                query = query.in('en_localidad', localidades.map((l) => l.nombre));
            }
        }

        // Maneja errores de Supabase
        if (error) {
            console.error('Error al buscar en Supabase: ', error);
            return res.status(500).json({
                message: 'Error al buscar los monumentos en la base de datos.',
                error: error.message
            });
        }

        // Responder con éxito
        respuestaAPI = data.map(elemento => ({
            nombre: elemento.nombre,
            tipo: elemento.tipo,
            direccion: elemento.direccion,
            localidad: elemento.en_localidad,
            codPostal: elemento.codigo_postal,
            provincia: localidadToProvincia(elemento.localidad),
            descripcion: elemento.descripcion,
            latitud: elemento.latitud,
            longitud: elemento.longitud,

        }))

        return res.status(200).json({
            message: 'Datos buscados correctamente.',
            data
        });

    } catch (err) {
        // Maneja error del servidor
        console.error('Error en la API de busqueda: ', err);
        return res.status(500).json({
            message: 'Error interno del servidor.',
            error: err.message
        });
    }
})

app.post('/api/busqueda', async (req, res) =>{
    return res.status(201).json({
        message: 'Datos cargados correctamente.',
        data: respuestaApi
    });
})

async function localidadToProvincia(localidad){
    const {data, error} = await supabase.from('Localidad').select('en_provincia').eq('nombre', localidad).single()
    if (error) {
        console.error('Error al buscar en Supabase: ', error);
            return res.status(500).json({
                message: 'Error al buscar la provincia en la base de datos.',
                error: error.message
            });
    }
    return data.en_provincia;
}
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor de carga escuchando en http://localhost:${port}`);
});
