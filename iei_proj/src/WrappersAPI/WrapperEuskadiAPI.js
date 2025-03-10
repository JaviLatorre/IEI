const express = require('express'); //Se usa para crear las API
const WrapperEuskadi = require('../Wrappers/WrapperEuskadi');
const path = require('path');

const app = express();
//app.use(express.json());
const port = 3008;

// Instancia del wrapper con el archivo JSON
const wrapper = new WrapperEuskadi('../FuentesDeDatos/edificios_EntregaFinal.json');

// Endpoint para obtener los datos del JSON
app.get('/EuskadiAPI', async (req, res) => {
    try {
        const data = await wrapper.loadFile();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});
