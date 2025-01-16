const fs = require('fs'); //Para acceder al file system
const path = require('path');

class WrapperEuskadi {
    
    constructor(filePath) {
        this.filePath = filePath;
    }

    loadFile() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, 'utf-8', (err, data) => {
                if (err) {
                    reject(`Error reading file: ${err}`);
                } else {
                    try {
                        const updatedData = data.replace(/"address"\s:\s"([^"]*)"/g, (match, p1, offset, string) => {
                            // Verificar si este es el primer "address" dentro de su bloque JSON
                            const before = string.slice(0, offset); // Texto antes de este match
                            const isFirstAddress = before.lastIndexOf('{') > before.lastIndexOf('"address"');
                            return isFirstAddress ? `"firstAddress": "${p1}"` : match;
                        });
                        const jsonData = JSON.parse(updatedData);
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
}

module.exports = WrapperEuskadi;

// Uso del wrapper
// const wrapper = new JSONWrapper(path.resolve(__dirname, 'data.json'));
// wrapper.loadFile().then(data => console.log(data)).catch(err => console.error(err));
