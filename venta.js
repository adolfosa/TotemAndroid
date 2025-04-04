const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// 1. Configuración básica del puerto (AJUSTA EL PUERTO SEGÚN TU SISTEMA)
const port = new SerialPort({
  path:  '/dev/ttyUSB0',
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// 2. Función para enviar transacción de venta
function enviarVenta(monto) {
  const ticket = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // Formato: <STX>0200|monto|ticket|1|1<ETX><LRC>
  const comando = `0200|${monto.toString().padStart(9, '0')}|${ticket}|1|1`;
  
  // Calcular LRC (XOR de todos los caracteres incluyendo |)
  let lrc = 0;
  for (let i = 0; i < comando.length; i++) {
    lrc ^= comando.charCodeAt(i);
  }
  
  // Construir mensaje completo
  const mensaje = `\x02${comando}\x03${String.fromCharCode(lrc)}`;
  
  console.log('Enviando:', mensaje);
  port.write(mensaje);
}

// 3. Escuchar respuestas del POS
parser.on('data', data => {
  console.log('POS respondió:', data);
  
  // Si es una respuesta de venta (0210)
  if (data.startsWith('\x020210')) {
    const campos = data.split('|');
    if (campos[1] === '00') {
      console.log('✅ Pago APROBADO');
      console.log('Nº Operación:', campos[8]);
      console.log('Tarjeta:', campos[9]);
    } else {
      console.log('❌ Pago RECHAZADO:', campos[1]);
    }
  }
});

// 4. Manejo de errores
port.on('error', err => {
  console.error('Error en puerto serial:', err);
});

// 5. Ejemplo de uso - Simular venta de $15.000
enviarVenta(15000);

// Mantener el proceso activo
process.stdin.resume();