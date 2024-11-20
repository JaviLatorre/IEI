const fs = require('fs');  // Importamos el módulo 'fs' para trabajar con archivos
const path = require('path');  // Importamos el módulo 'path' para manejar rutas de archivos
const csv = require('csv-parser');  // Importamos el módulo 'csv-parser' para leer archivos CSV

function csvToJson(csvFilePath, outputFolder) {  // Definimos una función que convertirá el CSV a JSON
  const results = [];  // Creamos un array vacío donde almacenaremos los resultados (cada fila del CSV)

  // Abrimos el archivo CSV y le indicamos que el delimitador es el punto y coma (';')
  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ';' }))  // Usamos el separador adecuado para que el parser entienda las columnas
    .on('data', (data) => {  // Cada vez que leemos una nueva fila (un objeto con los datos de la fila)
      // Limpiar las comillas innecesarias en los valores de cada columna
      for (const key in data) {  // Recorremos cada clave de la fila
        if (data.hasOwnProperty(key)) {  // Verificamos que la clave es propia del objeto
          data[key] = data[key].replace(/"/g, '').trim();  // Quitamos las comillas dobles y los espacios extra
        }
      }
      results.push(data);  // Añadimos la fila limpia al array de resultados
    })
    .on('end', () => {  // Cuando termine de leer todo el archivo CSV
      // Generamos el nombre del archivo JSON de salida, tomando el nombre del CSV y cambiando la extensión a '.json'
      const jsonFileName = path.basename(csvFilePath, path.extname(csvFilePath)) + '.json';
      // Creamos la ruta completa para el archivo de salida, usando la carpeta de salida y el nombre del archivo JSON
      const outputFilePath = path.join(outputFolder, jsonFileName);
      
      // Escribimos el contenido de 'results' (el array con las filas del CSV convertidas a JSON) en un archivo JSON
      fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');  // Usamos 'JSON.stringify' para convertir el array a JSON
      console.log(`Archivo JSON guardado en: ${outputFilePath}`);  // Imprimimos un mensaje indicando dónde se guardó el archivo JSON
    });
}

// Ejecutamos la conversión si el archivo se ejecuta directamente, especificando la ruta del CSV y la carpeta de salida
const csvFilePath = path.join(__dirname, '../FuentesDeDatos', 'bienes_inmuebles_interes_cultural.csv');
const outputFolder = path.join(__dirname, '../FuentesDeDatos');
csvToJson(csvFilePath, outputFolder);  // Llamamos a la función para convertir el CSV a JSON

module.exports = { csvToJson };  // Exportamos la función en caso de que la necesitemos en otro archivo

