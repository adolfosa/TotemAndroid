                                                                         
// venta.js
const { SerialPort } = require('serialport');

// Configuración del puerto serial (ajusta según tu necesidad)
const port = new SerialPort({
    path: '/dev/ttySMT3',
    baudRate: 115200,
    autoOpen: false
});

/**
 * Función para enviar una venta al POS
 * @param {number} monto - Monto de la venta (ej: 1000 = $1.000)
 * @param {function} [callback] - Función callback para manejar la respuesta
 */
function enviarVenta(monto, callback) {
    if (!port.isOpen) {
        port.open(err => {
            if (err) return callback ? callback(err) : console.error('Error abriendo puerto:', err);
            _enviarComandoVenta(monto, callback);
        });
    } else {
        _enviarComandoVenta(monto, callback);
    }
}

// Función interna para enviar el comando
function _enviarComandoVenta(monto, callback) {
    try {
        const montoFormateado = monto.toString().padStart(8, '0');
        const comandoVenta = Buffer.from(`0200${montoFormateado}000000|`, 'ascii');

        port.write(comandoVenta, err => {
            if (err) {
                return callback ? callback(err) : console.error('Error enviando comando:', err);
            }

            console.log(`Comando de venta enviado: $${monto}`);

            // Esperar respuesta del POS (timeout de 30 segundos)
            const timeout = setTimeout(() => {
                port.removeAllListeners('data');
                callback && callback(new Error('Timeout: No se recibió respuesta del POS'));
            }, 30000);

            // Listener para la respuesta
            port.once('data', data => {
                clearTimeout(timeout);
                const respuesta = data.toString().trim();
                console.log('Respuesta del POS:', respuesta);
                callback && callback(null, respuesta);
            });
        });
    } catch (error) {
        callback ? callback(error) : console.error('Error inesperado:', error);
    }
}

// Manejo de errores global
port.on('error', err => {
    console.error('Error en el puerto serial:', err);
});

// Exportar la función para uso externo
module.exports = { enviarVenta, port };
