const fs = require('fs'); //Para acceder al file system
const path = require('path');
const csv = require('csv-parser'); 
let updatedPath;

class WrapperCV {
    
    constructor(filePath) {
        this.filePath = filePath;
    }

    async loadFile() {
        
        return new Promise((resolve, reject) => {
            const csvFilePath = this.filePath;
            const outputFolder = path.join(__dirname, '../FuentesDeDatos');
            csvToJson(csvFilePath, outputFolder);  // Llamamos a la función para hacer la conversión
            console.log(this.filePath)
            fs.readFile(this.filePath, 'utf-8', (err, data) => {
                if (err) {
                    reject(`Error reading file: ${err}`);
                } else {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (parseError) {
                        reject(`Error parsing JSON: ${parseError}`);
                    }
                }
            });
        });
    }

    getFilePath() {
        return this.filePath;
    }

    async csvToJson(csvFilePath, outputFolder) {  // Definimos una función que convertirá el CSV a JSON
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
            this.filePath = outputFilePath;
            fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');
            console.log(`Archivo JSON guardado en: ${outputFilePath}`);
          });
      }
}

module.exports = WrapperCV;