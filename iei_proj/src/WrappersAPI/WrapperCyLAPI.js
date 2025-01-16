const express = require('express'); //Se usa para crear las API
const WrapperCyL = require('../Wrappers/WrapperCyL');
const path = require('path');

const app = express();
const PORT = 3002;
const xml2js = require('xml2js');



// Instancia del wrapper con el archivo JSON
const wrapper = new WrapperCyL('../FuentesDeDatos/monumentos_EntregaFinal.xml', 'utf-8');

// Endpoint para obtener los datos del JSON
app.get('/CyLAPI', async (req, res) => {
    try {
        const data = await wrapper.loadFile();
        res.json(data);
    } catch (error) {
      console.error('Error en el endpoint /CyLAPI:', error)
        res.status(500).json({ error: error });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});