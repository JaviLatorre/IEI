// Importar módulos necesarios
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');

// Crear la aplicación Express
const app = express();
const port = 3001;

// Configurar cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware para procesar JSON
app.use(express.json());


app.get('/api/busqueda', async (req, res) =>{
    try {
        // Extraer datos del filtro de la solicitud
        const consulta = {
            localidad,
            codPostal,
            provincia,
            tipo                
        } = req.body;

        // Validar campos correctos

        // const filteredResults = dummyResults.filter((result) => {
        //     return (
        //       (filters.localidad === "" || result.localidad.toLowerCase().includes(filters.localidad.toLowerCase())) &&
        //       (filters.codPostal === "" || result.codPostal === filters.codPostal) &&
        //       (filters.provincia === "" || result.provincia.toLowerCase().includes(filters.provincia.toLowerCase())) &&
        //       (filters.tipo === "" || result.tipo === filters.tipo)
        //     );
        //   });

        // Buscar según los criterios en la tabal Monumentos de Supabase
        const {data, error} = await supabase
            .from('Monumento')
            .select('*')
        // Aplicar filtros
        if (consulta.localidad) {
            data.eq('en_localidad', consulta.localidad)
        }
        if (consulta.codPostal) {
            data.eq('codigo_postal', consulta.codPostal)
        }
        if (consulta.tipo) {
            data.eq('tipo', consulta.tipo)
        }
        if (consulta.provincia) {
                const {data2, error2} = await supabase.from('Localidad').select('nombre').eq('en_provincia', consulta.provincia)
                data2.array.forEach(localidad => {
                    data.eq('en_localidad', localidad)
                });
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
        const respuestaAPI = data.map(elemento => ({
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
            data: respuestaAPI
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
