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
}

module.exports = WrapperEuskadi;

// Uso del wrapper
// const wrapper = new JSONWrapper(path.resolve(__dirname, 'data.json'));
// wrapper.loadFile().then(data => console.log(data)).catch(err => console.error(err));
