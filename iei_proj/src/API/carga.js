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

// Ruta para manejar la carga de datos
app.post('/api/carga', async (req, res) => {
    try {
        // Extraer datos del cuerpo de la solicitud
        const {
            nombre,
            tipo,
            direccion,
            descripcion,
            latitud,
            longitud,
            codigo_postal,
            en_localidad
        } = req.body;

        // Validar que los campos obligatorios estén presentes
        if (!nombre || !tipo || !direccion || !en_localidad) {
            return res.status(400).json({
                message: 'Faltan datos obligatorios: nombre, tipo, direccion, en_localidad.'
            });
        }

        // Insertar los datos en la tabla Monumento en Supabase
        const { data, error } = await supabase
            .from('Monumento')
            .insert([
                {
                    nombre,
                    tipo,
                    direccion,
                    descripcion: descripcion || 'Descripción no disponible',
                    latitud: latitud || null,
                    longitud: longitud || null,
                    codigo_postal: codigo_postal || null,
                    en_localidad
                }
            ])
            .select();

        // Manejar errores de Supabase
        if (error) {
            console.error('Error al insertar en Supabase:', error);
            return res.status(500).json({
                message: 'Error al guardar los datos en la base de datos.',
                error: error.message
            });
        }

        // Responder con éxito
        return res.status(201).json({
            message: 'Datos cargados correctamente.',
            data
        });
    } catch (err) {
        // Manejar errores del servidor
        console.error('Error en la API de carga:', err);
        return res.status(500).json({
            message: 'Error interno del servidor.',
            error: err.message
        });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor de carga escuchando en http://localhost:${port}`);
});
