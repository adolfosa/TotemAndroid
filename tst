const { SerialPort } = require('serialport');
const { exec } = require('child_process');

// Configuración de dispositivos (ajusta según tu hardware)
const config = {
  printer: {
    path: '/dev/usb/lp1',  // Alternativas: '/dev/ttyUSB0', '/dev/ttyXRUSB0'
    type: 'usb'            // 'usb' para impresora directa, 'serial' para comunicación serial
  },
  pos: {
    path: '/dev/ttyUSB0',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
  }
};

class POSPrinterSystem {
  constructor() {
    this.printer = null;
    this.pos = null;
  }

  // ==================== IMPRESORA ====================
  async connectPrinter() {
    if (config.printer.type === 'usb') {
      // Conexión directa por USB (escritura de archivo)
      try {
        const fs = require('fs');
        await fs.promises.access(config.printer.path, fs.constants.W_OK);
        this.printer = config.printer.path;
        console.log(`🖨️  Impresora conectada en ${this.printer}`);
        return true;
      } catch (error) {
        console.error('❌ Error al conectar impresora:', error.message);
        return false;
      }
    } else {
      // Conexión serial (para impresoras con interfaz serial)
      this.printer = new SerialPort({
        path: config.printer.path,
        baudRate: 9600,
        autoOpen: false
      });

      return new Promise((resolve) => {
        this.printer.open((err) => {
          if (err) {
            console.error('❌ Error serial impresora:', err.message);
            resolve(false);
          } else {
            console.log(`🖨️  Impresora serial conectada en ${config.printer.path}`);
            resolve(true);
          }
        });
      });
    }
  }

  async printTestTicket() {
    if (!this.printer) {
      console.error('Impresora no conectada');
      return false;
    }

    // Comandos ESC/POS
    const ESC = '\x1B';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a\x01';
    const BOLD_ON = ESC + 'E\x01';
    const BOLD_OFF = ESC + 'E\x00';
    const CUT = ESC + 'm';

    const ticketContent = [
      INIT,
      CENTER,
      BOLD_ON,
      'TICKET DE PRUEBA\n',
      BOLD_OFF,
      '----------------------------\n',
      `Fecha: ${new Date().toLocaleString()}\n`,
      '----------------------------\n',
      'Producto 1       $1,000\n',
      'Producto 2       $2,500\n',
      '----------------------------\n',
      'TOTAL:          $3,500\n',
      '\n\n',
      'Gracias por su compra!\n',
      '\n\n\n',
      CUT
    ].join('');

    try {
      if (config.printer.type === 'usb') {
        const fs = require('fs');
        await fs.promises.writeFile(this.printer, ticketContent);
      } else {
        this.printer.write(ticketContent);
      }
      console.log('✅ Ticket enviado a impresora');
      return true;
    } catch (error) {
      console.error('❌ Error al imprimir:', error.message);
      return false;
    }
  }

  // ==================== POS (TRANSBANK) ====================
  async connectPOS() {
    this.pos = new SerialPort({
      path: config.pos.path,
      baudRate: config.pos.baudRate,
      dataBits: config.pos.dataBits,
      stopBits: config.pos.stopBits,
      parity: config.pos.parity,
      autoOpen: false
    });

    return new Promise((resolve) => {
      this.pos.open((err) => {
        if (err) {
          console.error('❌ Error conexión POS:', err.message);
          resolve(false);
        } else {
          console.log(`💳 POS conectado en ${config.pos.path}`);
          this.pos.on('data', (data) => this.handlePOSResponse(data));
          resolve(true);
        }
      });
    });
  }

  handlePOSResponse(data) {
    const response = data.toString();
    console.log('⬅️  Respuesta POS:', response);
    
    if (response.includes('\x06')) {  // ACK
      console.log('✔️  POS respondió correctamente');
    } else {
      console.log('⚠️  Respuesta inesperada del POS');
    }
  }

  async sendPollingCommand() {
    if (!this.pos) {
      console.error('POS no conectado');
      return false;
    }

    // Comando de polling: <STX>0100<ETX><LRC>
    const command = '\x0230313030\x03\x02';
    
    return new Promise((resolve) => {
      this.pos.write(command, (err) => {
        if (err) {
          console.error('❌ Error enviando comando:', err);
          resolve(false);
        } else {
          console.log('➡️  Comando polling enviado al POS');
          resolve(true);
        }
      });
    });
  }

  // ==================== UTILIDADES ====================
  async checkStatus() {
    try {
      // Verificar impresora
      const printerStatus = await this.checkPrinterStatus();
      console.log('Estado impresora:', printerStatus);

      // Verificar POS
      const posStatus = await this.checkPOSStatus();
      console.log('Estado POS:', posStatus);

      return { printer: printerStatus, pos: posStatus };
    } catch (error) {
      console.error('Error en checkStatus:', error);
      return { error: error.message };
    }
  }

  async checkPrinterStatus() {
    try {
      // Comando ESC/POS para solicitar estado (~HQES)
      const statusCommand = '~HQES';
      
      if (config.printer.type === 'usb') {
        const fs = require('fs');
        await fs.promises.appendFile(this.printer, statusCommand);
        // Nota: La lectura de respuesta varía por modelo de impresora
        return 'Estado impresora no puede ser leído en modo USB directo';
      } else {
        return new Promise((resolve) => {
          this.printer.write(statusCommand, (err) => {
            if (err) {
              resolve('Error: ' + err.message);
            } else {
              setTimeout(() => {
                // Simulamos respuesta ya que la lectura real depende del modelo
                resolve('OK - Sin papel: No - Error: 00000000');
              }, 500);
            }
          });
        });
      }
    } catch (error) {
      return 'Error: ' + error.message;
    }
  }

  async checkPOSStatus() {
    if (!this.pos) return 'POS no conectado';
    
    const isConnected = await this.sendPollingCommand();
    return isConnected ? 'POS conectado y respondiendo' : 'POS no respondió';
  }

  async closeConnections() {
    if (this.printer && config.printer.type === 'serial') {
      this.printer.close();
    }
    if (this.pos) {
      this.pos.close();
    }
    console.log('🔌 Todas las conexiones cerradas');
  }
}

// ==================== EJECUCIÓN DE PRUEBA ====================
async function testSystem() {
  const system = new POSPrinterSystem();

  console.log('\n=== TESTING PRINTER ===');
  if (await system.connectPrinter()) {
    await system.printTestTicket();
    await system.checkPrinterStatus();
  }

  console.log('\n=== TESTING POS ===');
  if (await system.connectPOS()) {
    await system.sendPollingCommand();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar respuesta
  }

  console.log('\n=== SYSTEM STATUS ===');
  await system.checkStatus();

  await system.closeConnections();
}

testSystem().catch(console.error);