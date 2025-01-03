const express = require('express'); //Se usa para crear las API
const path = require('path');
const WrapperCV = require('../Wrappers/WrapperCV');

const app = express();
const PORT = 3000;

// Instancia del wrapper con el archivo CSV
const wrapper = new WrapperCV('../FuentesDeDatos/bienes_inmuebles_interes_cultural(Entrega 1).csv');

// Endpoint para obtener los datos del JSON
app.get('/CVAPI', async (req, res) => {
    try {
        const data = await wrapper.loadFile();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});