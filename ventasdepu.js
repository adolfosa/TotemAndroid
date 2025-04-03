// venta-final.js
const { SerialPort } = require('serialport');

// 1. Configuración ÓPTIMA para Android
const port = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 115200,
  lock: false,       // ← CLAVE para evitar bloqueos en Android
  autoOpen: false,   // Abrir manualmente
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
});

// 2. Función mejorada con control de errores
function enviarVenta(monto, callback) {
  port.open(async (err) => {
    if (err) {
      console.error('❌ Error al abrir puerto:', err.message);
      console.log('🔧 Soluciones rápidas:');
      console.log('1. Reinicia el POS y desconecta/reconecta el cable USB');
      console.log('2. Ejecuta en Termux:');
      console.log('   cat /dev/ttyUSB0 &');  // Libera el puerto
      return callback && callback(err);
    }

    console.log('✅ Puerto abierto. Enviando venta...');
    
    try {
      const comando = `0200${monto.toString().padStart(8, '0')}000000|`;
      port.write(Buffer.from(comando, 'ascii'), (err) => {
        if (err) {
          console.error('📤 Error al enviar:', err.message);
          return callback && callback(err);
        }
        console.log('💰 Comando enviado correctamente');
      });

      // Esperar respuesta (timeout 30s)
      const timeout = setTimeout(() => {
        port.removeAllListeners('data');
        callback && callback(new Error('Timeout: POS no respondió'));
      }, 30000);

      port.once('data', (data) => {
        clearTimeout(timeout);
        const respuesta = data.toString().trim();
        console.log('🖨️ Respuesta POS:', respuesta);
        callback && callback(null, respuesta);
      });

    } catch (error) {
      console.error('💥 Error inesperado:', error);
      callback && callback(error);
    }
  });
}

// 3. Ejemplo de uso
enviarVenta(5000, (err, resp) => {
  if (err) {
    console.error('❌ Transacción fallida:', err.message);
  } else {
    console.log('✅ Transacción exitosa:', resp);
  }
  port.close();  // Cerrar siempre el puerto
});

// 4. Manejo de errores global
port.on('error', (err) => {
  console.error('⚡ Error en puerto serial:', err.message);
});