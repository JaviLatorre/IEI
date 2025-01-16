const express = require('express'); //Se usa para crear las API
const path = require('path');
const WrapperCV = require('../Wrappers/WrapperCV');

const app = express();
//app.use(express.json());
const port = 3001;

// Instancia del wrapper con el archivo CSV
const wrapper = new WrapperCV('../FuentesDeDatos/bienes_inmuebles_interes_cultural_EntregaFinal.csv');

// Endpoint para obtener los datos del JSON
app.get('/CVAPI', async (req, res) => {
    try {
        const data = await wrapper.loadFile();
        res.json(data);
    } catch (error) {
        console.error('Error en el endpoint /CVAPI:', error);
        res.status(500).json({ error: error.message || error.toString() });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});