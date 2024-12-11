const express = require('express'); //Se usa para crear las API
const WrapperEuskadi = require('../Wrappers/WrapperCV');
const path = require('path');

const app = express();
const PORT = 3000;

function csvToJson(csvFilePath, outputFolder) {  // Definimos una función que convertirá el CSV a JSON
    const results = [];  // Creamos un array vacío donde almacenaremos los resultados (cada fila del CSV)
  
    // Abrimos el archivo CSV y le indicamos que el delimitador es el punto y coma (';')
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (data) => {
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            data[key] = data[key].replace(/"/g, '').trim();
          }
        }
        results.push(data);
      })
      .on('end', () => {
        const jsonFileName = path.basename(csvFilePath, path.extname(csvFilePath)) + '.json';
        const outputFilePath = path.join(outputFolder, jsonFileName);
        fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');
        console.log(`Archivo JSON guardado en: ${outputFilePath}`);
      });
  }
  
  const xmlFilePath = path.join(__dirname, '../FuentesDeDatos', 'bienes_inmuebles_interes_cultural(Entrega 1).csv');
  const outputFolder = path.join(__dirname, '../FuentesDeDatos');
  csvToJson(xmlFilePath, outputFolder);  // Llamamos a la función para hacer la conversión

// Instancia del wrapper con el archivo JSON
const wrapper = new WrapperEuskadi('../FuentesDeDatos/bienes_inmuebles_interes_cultural(Entrega 1).json', 'utf-8');

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