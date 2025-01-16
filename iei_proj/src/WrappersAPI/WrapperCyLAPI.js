const express = require('express'); //Se usa para crear las API
const WrapperEuskadi = require('../Wrappers/WrapperCyL');
const path = require('path');

const app = express();
const PORT = 3002;
const xml2js = require('xml2js');

async function xmlToJson(xmlFilePath, outputFolder) {
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: false });
  
    try {
      const data = await fs.readFile(xmlFilePath, 'utf-8');  // Leemos el archivo XML
      parser.parseString(data, async (err, result) => {  // Parseamos el contenido del archivo XML
        if (err) {
          console.error(`Error al parsear el XML: ${err}`);
          return;
        }
  
        // Genera la ruta de salida y verifica si la carpeta existe
        const jsonFileName = path.basename(xmlFilePath, path.extname(xmlFilePath)) + '.json';
        const outputFilePath = path.join(outputFolder, jsonFileName);
  
        // Asegúrate de que la carpeta de salida exista
        if (!fs.access(outputFolder)) {
          await fs.mkdir(outputFolder, { recursive: true });
        }
  
        // Guarda el JSON resultante de manera asíncrona
        await fs.writeFile(outputFilePath, JSON.stringify(result, null, 2), 'utf-8');
        //console.log(`Archivo JSON guardado en: ${outputFilePath}`);
      });
    } catch (err) {
      console.error(`Error al leer el archivo XML: ${err}`);
    }
  }
  
  // Si este archivo se ejecuta directamente, convertimos el archivo XML especificado a JSON
  const xmlFilePath = path.join(__dirname, '../FuentesDeDatos', 'monumentosEntrega1.xml');
  const outputFolder = path.join(__dirname, '../FuentesDeDatos');
  xmlToJson(xmlFilePath, outputFolder);  // Llamamos a la función para hacer la conversión



// Instancia del wrapper con el archivo JSON
const wrapper = new WrapperEuskadi('../FuentesDeDatos/monumentosEntrega1.json', 'utf-8');

// Endpoint para obtener los datos del JSON
app.get('/CyLAPI', async (req, res) => {
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