const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const { castillayleon, getInsertadasCorrectamenteCYL, getModificadosCYL, getDescartadosCYL,registrosReparadosCYL,registrosRechazadosCYL } = require('../Extractores/extractorCYL');
const { euskadi, getInsertadasCorrectamenteEU, getModificadosEU, getDescartadosEU, registrosReparadosEU, registrosRechazadosEU } = require('../Extractores/extractorEU');
const { valencia, getInsertadasCorrectamenteVLC, getModificadosVLC, getDescartadosVLC ,registrosReparadosVLC, registrosRechazadosVLC} = require('../Extractores/extractorVLC');
const { eliminarBD } = require('../Extractores/DAL');
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');

const app = express();
const PORT = 3004;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());

// Endpoint para borrar los datos
app.delete('/api/borrar-datos', async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3003');
    try {
        console.log('Eliminando los datos de todas las tablas...');
        await eliminarBD();
        return res.status(200).json({ message: 'Todos los datos han sido eliminados correctamente.' });
    } catch (error) {
        console.error('Error al intentar borrar los datos:', error);
        return res.status(500).json({
            message: 'Error interno al intentar borrar los datos.',
            error: error.message,
        });
    }
});



app.get('/api/extractores', async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3003');
    const { fuente } = req.query; 
    const extractoresDisponibles = [
        'Castilla y León',
        'Euskadi',
        'Comunitat Valenciana',
        'Seleccionar todas'
    ];

    
    if (!fuente || !extractoresDisponibles.includes(fuente)) {
        return res.status(400).json({
            message: 'Por favor, selecciona una fuente de datos válida.',
            opcionesDisponibles: extractoresDisponibles
        });
    }

    try {
        let resultados = {
            registrosCargados: 0,
            registrosReparados: [],
            registrosRechazados: []
        };

        const combinarResultados = (nuevosResultados) => {
            resultados.registrosCargados += nuevosResultados.registrosCargados || 0;
            resultados.registrosReparados = resultados.registrosReparados.concat(nuevosResultados.registrosReparados || []);
            resultados.registrosRechazados = resultados.registrosRechazados.concat(nuevosResultados.registrosRechazados || []);
        };

        // Acción según la fuente seleccionada
        switch (fuente.toLowerCase()) {
            case 'castilla y león':
                console.log('Cargando datos desde Castilla y León...');
                await castillayleon();
                combinarResultados({
                    registrosCargados: getInsertadasCorrectamenteCYL(),
                    registrosReparados: registrosReparadosCYL,
                    registrosRechazados: registrosRechazadosCYL,
                });
                break;

            case 'euskadi':
                console.log('Cargando datos desde Euskadi...');
                await euskadi();
                combinarResultados({
                    registrosCargados: getInsertadasCorrectamenteEU(),
                    registrosReparados: registrosReparadosEU,
                    registrosRechazados: registrosRechazadosEU,
                });
                break;

                case 'comunitat valenciana':
                    console.log('Cargando datos desde Comunitat Valenciana...');
                    await valencia();
                    combinarResultados({
                        registrosCargados: getInsertadasCorrectamenteVLC(),
                        registrosReparados: registrosReparadosVLC,
                        registrosRechazados: registrosRechazadosVLC,
                    });
                    break;

            case 'seleccionar todas':
                console.log('Cargando datos de todas las fuentes...');
                await castillayleon();
                combinarResultados({
                    registrosCargados: getInsertadasCorrectamenteCYL(),
                    registrosReparados: getModificadosCYL(),
                    registrosRechazados: getDescartadosCYL()
                });
                await euskadi();
                combinarResultados({
                    registrosCargados: getInsertadasCorrectamenteEU(),
                    registrosReparados: getModificadosEU(),
                    registrosRechazados: getDescartadosEU()
                });
                await valencia();
                combinarResultados({
                    registrosCargados: getInsertadasCorrectamenteVLC(),
                    registrosReparados: getModificadosVLC(),
                    registrosRechazados: getDescartadosVLC()
                });
                break;

            default:
                return res.status(400).json({ message: 'Fuente no válida.' });
        }

        return res.status(201).json({
            message: `Datos cargados desde ${fuente} correctamente.`,
            resultados
        });
    } catch (error) {
        console.error('Error en la API de carga:', error);
        return res.status(500).json({
            message: 'Error interno en la API de carga.',
            error: error.message
        });
    }
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Permite el origen del frontend
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Métodos permitidos
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Encabezados permitidos
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Permitir cookies o credenciales si es necesario

    // Respuesta automática a preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); // Sin contenido para preflight
    }
    next();
});

// Inicializar el servidor
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
