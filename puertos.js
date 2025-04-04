// Añade esto al inicio del archivo para importar SerialPort
const { SerialPort } = require('serialport');

const puertosPosibles = [
  '/dev/ttySMT3',
  '/dev/ttyS3',
  '/dev/ttyS1',
  '/dev/ttyUSB0',
  '/dev/usb/lp0'
];

puertosPosibles.forEach(puerto => {
  const port = new SerialPort({ 
    path: puerto,
    baudRate: 115200,
    autoOpen: false,
    lock: false  // ← Importante para Android
  });
  
  port.open(err => {
    if (err) {
      console.log(`❌ ${puerto}: Error (${err.message})`);
    } else {
      console.log(`✅ ${puerto}: ¡Conectado!`);
      // Prueba comunicación rápida
      port.write(Buffer.from('020000010000000000|', 'ascii'), (err) => {
        if (err) {
          console.log(`⚠️  ${puerto}: Error al escribir`);
        } else {
          console.log(`📤 ${puerto}: Comando enviado`);
          // Escuchar respuesta
          port.once('data', data => {
            console.log(`📥 ${puerto}: Respuesta: ${data.toString()}`);
          });
        }
        port.close();
      });
    }
  });
});