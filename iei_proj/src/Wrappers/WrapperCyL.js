class WrapperCyL {
    
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

module.exports = WrapperCyL;