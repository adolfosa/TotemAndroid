// venta.js
const { SerialPort } = require('serialport');

// Configuración del puerto serial - USB donde está realmente conectado el POS
const port = new SerialPort({
    path: '/dev/ttyUSB0',  // Puerto confirmado por dmesg
    baudRate: 115200,      // Velocidad estándar (ajustar si es necesario)
    dataBits: 8,           // Configuración típica para POS
    stopBits: 1,
    parity: 'none',
    autoOpen: false        // Abrir manualmente para mejor control
});

/**
 * Función mejorada para enviar una venta al POS
 * @param {number} monto - Monto de la venta (ej: 1000 = $1.000)
 * @param {function} [callback] - Función callback para manejar la respuesta
 */
function enviarVenta(monto, callback) {
    if (!port.isOpen) {
        port.open(err => {
            if (err) {
                const errorMsg = `Error abriendo puerto: ${err.message}`;
                return callback ? callback(new Error(errorMsg)) : console.error(errorMsg);
            }
            _enviarComandoVenta(monto, callback);
        });
    } else {
        _enviarComandoVenta(monto, callback);
    }
}

// Función interna mejorada para enviar comandos
function _enviarComandoVenta(monto, callback) {
    try {
        // Validación del monto
        if (isNaN(monto) || monto <= 0) {
            const error = new Error('Monto inválido');
            return callback ? callback(error) : console.error(error.message);
        }

        const montoFormateado = monto.toString().padStart(8, '0');
        const comandoVenta = Buffer.from(`0200${montoFormateado}000000|`, 'ascii');

        // Limpiar listeners previos para evitar duplicados
        port.removeAllListeners('data');

        port.write(comandoVenta, err => {
            if (err) {
                const errorMsg = `Error enviando comando: ${err.message}`;
                return callback ? callback(new Error(errorMsg)) : console.error(errorMsg);
            }

            console.log(`💰 Comando de venta enviado: $${monto}`);

            // Timeout para respuesta (30 segundos)
            const timeout = setTimeout(() => {
                port.removeAllListeners('data');
                const error = new Error('Timeout: El POS no respondió en 30 segundos');
                callback && callback(error);
            }, 30000);

            // Listener para respuesta
            port.once('data', data => {
                clearTimeout(timeout);
                const respuesta = data.toString().trim();
                console.log('🖨️ Respuesta del POS:', respuesta);
                
                // Verificar respuesta válida (ajustar según protocolo de tu POS)
                if (respuesta.includes('APPROVED') || respuesta.includes('OK')) {
                    callback && callback(null, respuesta);
                } else {
                    callback && callback(new Error(`Respuesta del POS no exitosa: ${respuesta}`));
                }
            });
        });
    } catch (error) {
        const errorMsg = `Error inesperado: ${error.message}`;
        callback ? callback(new Error(errorMsg)) : console.error(errorMsg);
    }
}

// Manejo mejorado de errores
port.on('error', err => {
    console.error('⚠️ Error crítico en puerto serial:', err.message);
    // Cerrar puerto para evitar corrupción
    if (port.isOpen) port.close();
});

// Cerrar puerto al terminar el proceso
process.on('SIGINT', () => {
    if (port.isOpen) {
        port.close(() => {
            console.log('Puerto serial cerrado correctamente');
            process.exit();
        });
    } else {
        process.exit();
    }
});

module.exports = { enviarVenta, port };