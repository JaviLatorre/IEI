// Importar módulos necesarios
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');

// Crear la aplicación Express
const app = express();
const port = 3005;
let respuestaAPI = [];

// Configurar cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware para procesar JSON
app.use(express.json());


app.get('/search', async (req, res) =>{
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    console.log('Consulta:');
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
        let query = supabase
            .from('Monumento')
            .select('*')
        // Aplicar filtros
        if (consulta.localidad && consulta.localidad.trim() !== "") {
            query = query.eq('en_localidad', consulta.localidad)
        }
        if (consulta.codPostal && consulta.codPostal.trim() !== "") {
            query = query.eq('codigo_postal', consulta.codPostal)
        }
        if (consulta.tipo && consulta.tipo.trim() !== "") {
            query = query.eq('tipo', consulta.tipo)
        }
        if (consulta.provincia && consulta.provincia.trim() !== "") {
            
            const { data: localidades, error: error2 } = await supabase
                .from('Localidad')
                .select('nombre')
                .eq('en_provincia', consulta.provincia);
            if (error2 || localidades.length === 0 || localidades == null) {
                console.error('Error al buscar provincia: ', error2)
                return res.status(500).json({
                    message: 'Error al buscar las provincias en la base de datos.',
                    error: error.message
                });
            }
            
            if (localidades && localidades.length > 0) {
                console.log('ENTRANDO EN EL IF');
                query = query.in('en_localidad', localidades.map((l) => l.nombre));
            }
        }

        console.log(query);

        const { data, error } = await query;
        console.log(error)
        console.log(data[0])
        // Maneja errores de Supabase
        if (error) {
            console.error('Error al buscar en Supabase al realizar consulta : ', error);
            return res.status(500).json({
                 message: 'Error al buscar los monumentos en la base de datos.',
                 error: error.message
             });
        }
        else {
            // Responder con éxito
            const respuestaAPI = await Promise.all(
                data.map(async (elemento) => ({
                    nombre: elemento.nombre,
                    tipo: elemento.tipo,
                    direccion: elemento.direccion,
                    localidad: elemento.en_localidad,
                    codPostal: elemento.codigo_postal,
                    provincia: await localidadToProvincia(elemento.en_localidad),
                    descripcion: elemento.descripcion,
                    latitud: elemento.latitud,
                    longitud: elemento.longitud,
                }))
            );
            console.log(respuestaAPI[0])
            return res.status(200).json({
                ok: true,
                message: 'Datos buscados correctamente.',
                data: respuestaAPI,
            });
        }

    } catch (err) {
        // Maneja error del servidor
        console.error('Error en la API de busqueda en general: ', err);
        return res.status(500).json({
            message: 'Error interno del servidor.',
            error: err.message
        });
    }
})



 async function localidadToProvincia(localidad, res){
    const {data, error} = await supabase.from('Localidad').select('en_provincia').eq('nombre', localidad).single()
     if (error) {
        console.error('Error al buscar en Supabase: ', error);
             return res.status(500).json({
                 message: 'Error al buscar la provincia en la base de datos.',
                 error: error.message
             });     }
     return data.en_provincia;
 }
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor de carga escuchando en http://localhost:${port}`);
});
