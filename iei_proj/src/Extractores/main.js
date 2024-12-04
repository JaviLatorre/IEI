const { euskadi, getInsertadasCorrectamenteEU, getModificadosEU, getDescartadosEU } = require('./extractorEU');
const { castillayleon, getInsertadasCorrectamenteCYL, getModificadosCYL, getDescartadosCYL } = require('./extractorCYL');
const { valencia, getInsertadasCorrectamenteVLC, getModificadosVLC, getDescartadosVLC } = require('./extractorVLC');
const {eliminarBD} = require('./DAL');

(async () => {
    await eliminarBD();
    console.log('Ejecutando el extractor de Euskadi...');
    await euskadi(); // Espera a que euskadi termine
    console.log('Ejecutando el extractor de Castilla y León...');
    await castillayleon(); // Espera a que castillayleon termine
    console.log('Ejecutando el extractor de Valencia...');
    await valencia(); // Espera a que valencia termine
    console.log('Todos los extractores han sido ejecutados.');
    console.log('Resultados Finales:');
    console.log(`Insertadas correctamente en Euskadi: `, getInsertadasCorrectamenteEU());
    console.log('Insertadas corregidas en Euskadi: ', getModificadosEU());
    console.log('Descartadas en Euskadi: ', getDescartadosEU());
    console.log(`Insertadas correctamente en Castilla y León: `, getInsertadasCorrectamenteCYL());
    console.log('Insertadas corregidas en Castilla y León: ', getModificadosCYL());
    console.log('Descartadas en Castilla y León: ', getDescartadosCYL());
    console.log(`Insertadas correctamente en Comunidad Valenciana: `, getInsertadasCorrectamenteVLC());
    console.log('Insertadas corregidas en Comunidad Valenciana: ', getModificadosVLC());
    console.log('Descartadas en Comunidad Valenciana: ', getDescartadosVLC());
})();
