const { euskadi } = require('./extractorEU');
const { castillayleon } = require('./extractorCYL');
const {eliminarBD} = require('./DAL');

(async () => {
    await eliminarBD();
    console.log('Ejecutando el extractor de Euskadi...');
    await euskadi(); // Espera a que euskadi termine
    console.log('Ejecutando el extractor de Castilla y León...');
    await castillayleon(); // Espera a que castillayleon termine
    
})();
