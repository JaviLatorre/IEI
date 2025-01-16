const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class WrapperCyL {
    
    constructor(filePath) {
        this.filePath = filePath;
        this.outputFolder = path.join(__dirname, '../FuentesDeDatos');
        this.jsonFilePath = ''; // Ruta donde se guardará el JSON
    }
    
    async loadFile() {
        try {
                // Convertir XML a JSON
                await this.xmlToJson(this.filePath, this.outputFolder);
        
                // Leer el archivo JSON convertido
                const data = await fs.promises.readFile(this.jsonFilePath, 'utf-8');
                return JSON.parse(data); // Convertir a objeto
                } catch (error) {
                    throw new Error(`Error en loadFile: ${error.message}`);
                }
    }

    async xmlToJson(xmlFilePath, outputFolder) {
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: false });
      
        try {
          const data = await fs.promises.readFile(this.filePath, 'utf-8');  // Leemos el archivo XML
          parser.parseString(data, async (err, result) => {  // Parseamos el contenido del archivo XML
            if (err) {
              console.error(`Error al parsear el XML: ${err}`);
              return;
            }
      
            // Genera la ruta de salida y verifica si la carpeta existe
            const jsonFileName = path.basename(xmlFilePath, path.extname(xmlFilePath)) + '.json';
            const outputFilePath = path.join(outputFolder, jsonFileName);
            this.jsonFilePath = path.join(outputFolder, jsonFileName);
      
            // Guarda el JSON resultante de manera asíncrona
            await fs.promises.writeFile(outputFilePath, JSON.stringify(result, null, 2), 'utf-8');
            console.log(`Archivo JSON guardado en: ${this.jsonFilePath}`);
          });
        } catch (err) {
          console.error(`Error al leer el archivo XML: ${err}`);
        }
    }
      

    getFilePath() {
        return this.filePath;
    }
}

module.exports = WrapperCyL;