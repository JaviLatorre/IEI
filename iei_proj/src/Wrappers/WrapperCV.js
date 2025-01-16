const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class WrapperCV {
    constructor(filePath) {
        this.filePath = path.resolve(filePath); // Convertimos a una ruta absoluta
        this.outputFolder = path.join(__dirname, '../FuentesDeDatos');
        this.jsonFilePath = ''; // Ruta donde se guardará el JSON
    }

    async loadFile() {
        try {
            // Convertir CSV a JSON
            await this.csvToJson(this.filePath, this.outputFolder);

            // Leer el archivo JSON convertido
            const data = await fs.promises.readFile(this.jsonFilePath, 'utf-8');
            return JSON.parse(data); // Convertir a objeto
        } catch (error) {
            throw new Error(`Error en loadFile: ${error.message}`);
        }
    }

    async csvToJson(csvFilePath, outputFolder) {
        return new Promise((resolve, reject) => {
            const results = [];
            const jsonFileName = path.basename(csvFilePath, path.extname(csvFilePath)) + '.json';
            this.jsonFilePath = path.join(outputFolder, jsonFileName);

            fs.createReadStream(csvFilePath)
                .pipe(csv({ separator: ';' }))
                .on('data', (data) => {
                    for (const key in data) {
                        if (data.hasOwnProperty(key)) {
                            data[key] = data[key].replace(/"/g, '').trim(); // Limpiar valores
                        }
                    }
                    results.push(data);
                })
                .on('end', () => {
                    try {
                        // Escribir el archivo JSON
                        fs.writeFileSync(this.jsonFilePath, JSON.stringify(results, null, 2), 'utf-8');
                        console.log(`Archivo JSON guardado en: ${this.jsonFilePath}`);
                        resolve(); // Resolvemos la promesa
                    } catch (writeError) {
                        reject(`Error escribiendo JSON: ${writeError}`);
                    }
                })
                .on('error', (err) => {
                    reject(`Error procesando CSV: ${err}`);
                });
        });
    }
}

module.exports = WrapperCV;
