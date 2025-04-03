// app.js
const { enviarVenta } = require('./venta');

console.log('[APP] Iniciando prueba de venta...');
enviarVenta(12500, (err, respuesta) => {
    if (err) {
        console.error('[APP] Error en transacción:', err.message);
    } else {
        console.log('[APP] Transacción exitosa:', respuesta);
    }
});