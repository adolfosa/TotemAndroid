const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración específica para Epson NP-TC801 (Thermal Head CAP06-347)
const ESC = '\x1B';
const INIT = ESC + '@' + ESC + 'R\x00' + ESC + 't\x00'; // Inicialización + USA + CP437
const BOLD_ON = ESC + 'E\x01';
const BOLD_OFF = ESC + 'E\x00';
const ALIGN_CENTER = ESC + 'a\x01';
const ALIGN_LEFT = ESC + 'a\x00';
const ALIGN_RIGHT = ESC + 'a\x02';
const DOUBLE_HEIGHT = ESC + '!\x10';
const NORMAL_HEIGHT = ESC + '!\x00';
const CUT_PARTIAL = ESC + 'm';

// Mapeo de caracteres específico para CP437 (Epson NP-TC801)
const CHAR_MAP = {
    '°': '\xF8',  // Símbolo grado
    'á': '\xA0',  // á en CP437
    'é': '\x82',  // é en CP437
    'í': '\xA1',  // í en CP437
    'ó': '\xA2',  // ó en CP437
    'ú': '\xA3',  // ú en CP437 (este es el código correcto para la ú)
    'ñ': '\xA4',  // ñ en CP437
    'Ñ': '\xA5',  // Ñ en CP437
    'ü': '\x81',  // ü en CP437
    'Á': '\xB5',  // Á en CP437
    'É': '\x90',  // É en CP437
    'Í': '\xD6',  // Í en CP437
    'Ó': '\xE0',  // Ó en CP437
    'Ú': '\xE9',  // Ú en CP437
    '¿': '\xA8',  // ¿ en CP437
    '¡': '\xAD'   // ¡ en CP437
};

function encodeForEpson(text) {
    return text.split('').map(char => {
        // Reemplazar caracteres especiales según el mapa
        if (CHAR_MAP[char]) return CHAR_MAP[char];
        // Mantener caracteres ASCII estándar
        return char.charCodeAt(0) < 128 ? char : '?';
    }).join('');
}

// Configuración de página
const LINE_LENGTH = 42;
const DIVIDER = '-'.repeat(LINE_LENGTH);

function generateTravelTicket(data) {
    const {
        company = "TRANSPORTES SEGUROS",
        destination = "CANCÚN CENTRO",
        passenger = "JUAN PÉREZ",
        date = new Date().toLocaleDateString('es-MX'),
        time = new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
        seat = "B07",
        price = "175.50",
        ticketNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        boarding = "TERMINAL 2",
        gate = "3"
    } = data;

    const contenidoTicket = [
        INIT,
        ALIGN_CENTER,
        BOLD_ON,
        DOUBLE_HEIGHT,
        encodeForEpson(company) + '\n',
        NORMAL_HEIGHT,
        BOLD_OFF,
        encodeForEpson('BOLETO DE VIAJE') + '\n',
        DIVIDER + '\n',
        
        ALIGN_LEFT,
        encodeForEpson(`N°: ${ticketNumber}`) + '\n',
        encodeForEpson(`FECHA: ${date}   HORA: ${time}`) + '\n',
        DIVIDER.substring(0, 20) + '\n',
        
        ALIGN_CENTER,
        BOLD_ON,
        encodeForEpson('DETALLES DEL VIAJE') + '\n',
        BOLD_OFF,
        ALIGN_LEFT,
        encodeForEpson(`PASAJERO: ${passenger}`) + '\n',
        encodeForEpson(`DESTINO: ${destination}`) + '\n',
        encodeForEpson(`EMBARQUE: ${boarding}`) + '\n',
        encodeForEpson(`PUERTA: ${gate}   ASIENTO: ${seat}`) + '\n',
        DIVIDER + '\n',
        
        ALIGN_RIGHT,
        encodeForEpson(`TOTAL: $${price}`) + '\n\n',
        
        ALIGN_CENTER,
        encodeForEpson('Gracias por viajar con nosotros') + '\n',
        'www.transportesseguros.com\n',
        '\n\n',
        DIVIDER + '\n',
        encodeForEpson('Conserve este ticket durante el viaje') + '\n',
        '\n\n\n',
        CUT_PARTIAL
    ].join('');

    return Buffer.from(contenidoTicket, 'binary');
}

// Ruta para imprimir ticket
app.post('/imprimir-ticket', (req, res) => {
    try {
        const ticketContent = generateTravelTicket(req.body);
        fs.writeFileSync('/dev/usb/lp0', ticketContent);
        res.json({ 
            success: true,
            message: "Ticket impreso correctamente"
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ 
            error: "Error al imprimir",
            details: err.message 
        });
    }
});



// Interfaz web (se mantiene igual)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sistema de Tickets de Viaje</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            :root {
                --primary: #2c3e50;
                --secondary: #3498db;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f7fa;
                color: #333;
            }
            .ticket-form {
                background: white;
                border-radius: 8px;
                padding: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: var(--primary);
                text-align: center;
                margin-bottom: 25px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: var(--primary);
            }
            input, select {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 16px;
            }
            button {
                background-color: var(--secondary);
                color: white;
                border: none;
                padding: 12px 20px;
                width: 100%;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 10px;
                transition: background 0.3s;
            }
            button:hover {
                background-color: #2980b9;
            }
            .form-row {
                display: flex;
                gap: 15px;
            }
            .form-row .form-group {
                flex: 1;
            }
            @media (max-width: 480px) {
                .form-row {
                    flex-direction: column;
                    gap: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="ticket-form">
            <h1>Generador de Tickets de Viaje</h1>
            <form action="/imprimir-ticket" method="post">
                <div class="form-group">
                    <label for="company">Empresa:</label>
                    <input type="text" id="company" name="company" value="TRANSPORTES SEGUROS">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="passenger">Pasajero:</label>
                        <input type="text" id="passenger" name="passenger" value="JUAN PÉREZ">
                    </div>
                    <div class="form-group">
                        <label for="destination">Destino:</label>
                        <input type="text" id="destination" name="destination" value="CANCÚN CENTRO">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="date">Fecha:</label>
                        <input type="text" id="date" name="date" value="${new Date().toLocaleDateString('es-MX')}">
                    </div>
                    <div class="form-group">
                        <label for="time">Hora:</label>
                        <input type="text" id="time" name="time" value="${new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="boarding">Terminal:</label>
                        <input type="text" id="boarding" name="boarding" value="TERMINAL 2">
                    </div>
                    <div class="form-group">
                        <label for="gate">Puerta:</label>
                        <input type="text" id="gate" name="gate" value="3">
                    </div>
                    <div class="form-group">
                        <label for="seat">Asiento:</label>
                        <input type="text" id="seat" name="seat" value="B07">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="price">Precio ($):</label>
                    <input type="text" id="price" name="price" value="175.50">
                </div>
                
                <button type="submit">IMPRIMIR TICKET</button>
            </form>
        </div>
        <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;">
            <button onclick="location.href='/test-char'" style="background: #ff9800;">
                Probar Caracteres Especiales
            </button>
        </div>
    </body>
    </html>
    `);
});

// Ruta para probar caracteres
app.get('/test-char', (req, res) => {
    try {
        testU(); // Ejecuta la función de prueba
        res.send('Prueba de caracteres enviada a la impresora');
    } catch (err) {
        res.status(500).send('Error al probar caracteres: ' + err.message);
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor listo en http://localhost:3000');
});