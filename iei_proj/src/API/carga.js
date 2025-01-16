const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const { castillayleon } = require('../Extractores/extractorCYL');
const { euskadi } = require('../Extractores/extractorEU');
const { valencia } = require('../Extractores/extractorVLC');
const {eliminarBD } = require('../Extractores/DAL');
const { SUPABASE_URL, SUPABASE_KEY } = require('../credencialesSupaBase');

const app = express();
const PORT = 3004;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());

app.delete('/api/borrar-datos', async (req, res) => {
    try {
        console.log('Eliminando los datos de todas las tablas...');
        await eliminarBD();
        return res.status(200).json({ message: 'Todos los datos han sido eliminados correctamente.' });
    } catch (error) {
        console.error('Error al intentar borrar los datos:', error);
        return res.status(500).json({ message: 'Error interno al intentar borrar los datos.', error: error.message });
    }
});



app.get('/api/extractores', (req, res) => {
    const extractoresDisponibles = [
        'Castilla y León',
        'Euskadi',
        'Comunitat Valenciana',
        'Seleccionar todas'
    ];
    if (!fuente) {
        return res.status(400).json({ message: 'Por favor, selecciona una fuente de datos.' });
    }

    try {
        let resultados = {
            registrosCargados: 0,
            registrosReparados: [],
            registrosRechazados: []
        };

        const combinarResultados = (nuevosResultados) => {
            resultados.registrosCargados += nuevosResultados.registrosCargados;
            resultados.registrosReparados = resultados.registrosReparados.concat(nuevosResultados.registrosReparados);
            resultados.registrosRechazados = resultados.registrosRechazados.concat(nuevosResultados.registrosRechazados);
        };

        if (fuente.toLowerCase() === 'seleccionar todas') {
            console.log('Cargando datos de todas las fuentes...');
            
             castillayleon();
            combinarResultados({
                registrosCargados: getInsertadasCorrectamenteCL(),
                registrosReparados: getModificadosCL(),
                registrosRechazados: getDescartadosCL()
            });

            
             euskadi();
            combinarResultados({
                registrosCargados: getInsertadasCorrectamenteEU(),
                registrosReparados: getModificadosEU(),
                registrosRechazados: getDescartadosEU()
            });

             valencia();
            combinarResultados({
                registrosCargados: getInsertadasCorrectamenteVLC(),
                registrosReparados: getModificadosVLC(),
                registrosRechazados: getDescartadosVLC()
            });

        } else {
            switch (fuente.toLowerCase()) {
                case 'castilla y león':
                    console.log('Cargando datos desde Castilla y León...');
                     castillayleon();
                    combinarResultados({
                        registrosCargados: getInsertadasCorrectamenteCL(),
                        registrosReparados: getModificadosCL(),
                        registrosRechazados: getDescartadosCL()
                    });
                    break;

                case 'euskadi':
                    console.log('Cargando datos desde Euskadi...');
                     euskadi();
                    combinarResultados({
                        registrosCargados: getInsertadasCorrectamenteEU(),
                        registrosReparados: getModificadosEU(),
                        registrosRechazados: getDescartadosEU()
                    });
                    break;

                case 'comunitat valenciana':
                    console.log('Cargando datos desde Comunitat Valenciana...');
                     valencia();
                    combinarResultados({
                        registrosCargados: getInsertadasCorrectamenteVLC(),
                        registrosReparados: getModificadosVLC(),
                        registrosRechazados: getDescartadosVLC()
                    });
                    break;

                default:
                    return res.status(400).json({ message: 'Fuente no válida.' });
            }
        }

        return res.status(201).json({
            message: `Datos cargados desde ${fuente} correctamente.`,
            resultados
        });
    } catch (error) {
        console.error('Error en la API de carga:', error);
        return res.status(500).json({ message: 'Error interno en la API de carga.', error: error.message });
    }

   

  });
   
   //Inicializar el servidor 
   app.listen(PORT, () => {console.log(`API corriendo en https://localhost:${PORT}`)});
