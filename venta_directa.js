const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// 1. Configuración del puerto (¡AJUSTA ESTO!)
const PORT = '/dev/ttyS3'; // Prueba también '/dev/ttyUSB0', '/dev/ttyACM0'

// 2. Conexión al puerto serial
const port = new SerialPort({
  path: PORT,
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// 3. Función mejorada para enviar comandos
function enviarComando(monto) {
  const ticket = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const comando = `0200|${monto.toString().padStart(9, '0')}|${ticket}|1|1`;
  
  // Calcular LRC (XOR de todos los bytes)
  let lrc = 0;
  for (let i = 0; i < comando.length; i++) {
    lrc ^= comando.charCodeAt(i);
  }
  lrc ^= '|'.charCodeAt(0); // Incluir el separador final
  
  const mensaje = `\x02${comando}\x03${String.fromCharCode(lrc)}`;
  
  console.log('Enviando comando:', mensaje);
  port.write(mensaje);
}

// 4. Manejo de respuestas
parser.on('data', data => {
  console.log('RESPUESTA CRUDA:', data);
  
  if (data.includes('\x020210')) { // Respuesta de venta
    const partes = data.split('|');
    if (partes[1] === '00') {
      console.log('✅ PAGO APROBADO');
      console.log('Código:', partes[5]);
      console.log('Tarjeta:', partes[9]);
    } else {
      console.log('❌ RECHAZADO. Código:', partes[1]);
    }
  }
});

// 5. Manejo de errores
port.on('error', err => {
  console.error('ERROR:', err.message);
});

// 6. Cuando se abre el puerto
port.on('open', () => {
  console.log('✅ Puerto abierto. Enviando venta...');
  enviarComando(15000); // Envía $15.000
});

// 7. Mantener el proceso activo
setInterval(() => {}, 1000);