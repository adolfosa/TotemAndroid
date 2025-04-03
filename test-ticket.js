const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Comandos ESC/POS para Epson
const ESC = '\x1B';
const INIT = ESC + '@';
const RESET = ESC + '@';
const BOLD_ON = ESC + 'E\x01';
const BOLD_OFF = ESC + 'E\x00';
const ALIGN_CENTER = ESC + 'a\x01';
const ALIGN_LEFT = ESC + 'a\x00';
const ALIGN_RIGHT = ESC + 'a\x02';
const DOUBLE_HEIGHT = ESC + '!\x10';  // Altura doble
const NORMAL_HEIGHT = ESC + '!\x00';  // Altura normal
const CUT_PARTIAL = ESC + 'm';       // Corte parcial
const SET_SPANISH = ESC + 'R\x02';   // Configura región Latinoamérica
const SET_CP437 = ESC + 't\x00';     // Página de códigos CP437 (inglés)

// Configuración de página para ~10cm (considerando 80mm de ancho)
const LINE_LENGTH = 42; // Caracteres por línea (ajustado para 80mm)
const DIVIDER = '-'.repeat(LINE_LENGTH); // Usamos guión normal en lugar de '─'

// Generador de ticket profesional
function generateTravelTicket(data) {
    const {
        company = "TRANSPORTES SEGUROS",
        destination = "CANCÚN CENTRO",
        passenger = "JUAN PÉREZ",
        date = new Date().toLocaleDateString(),
        time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        seat = "B07",
        price = "175.50",
        ticketNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        boarding = "TERMINAL 2",
        gate = "3"
    } = data;

    // Configuración regional y página de códigos primero
    const configInicial = [
        INIT,
        SET_SPANISH,
        SET_CP437
    ].join('');

    const contenidoTicket = [
        configInicial,
        ALIGN_CENTER,
        BOLD_ON,
        DOUBLE_HEIGHT,
        company + '\n',
        NORMAL_HEIGHT,
        BOLD_OFF,
        'BOLETO DE VIAJE\n',
        DIVIDER + '\n',
        
        ALIGN_LEFT,
        `N°: ${ticketNumber}\n`,
        `FECHA: ${date}   HORA: ${time}\n`,
        DIVIDER.substring(0, 20) + '\n',
        
        ALIGN_CENTER,
        BOLD_ON,
        'DETALLES DEL VIAJE\n',
        BOLD_OFF,
        ALIGN_LEFT,
        `PASAJERO: ${passenger}\n`,
        `DESTINO: ${destination}\n`,
        `EMBARQUE: ${boarding}\n`,
        `PUERTA: ${gate}   ASIENTO: ${seat}\n`,
        DIVIDER + '\n',
        
        ALIGN_RIGHT,
        `TOTAL: $${price}\n\n`,
        
        ALIGN_CENTER,
        'Gracias por viajar con nosotros\n',
        'www.transportesseguros.com\n',
        '\n\n',  // Espacio para firma
        DIVIDER + '\n',
        'Conserve este ticket durante el viaje\n',
        '\n\n\n',  // Espacio antes del corte
        CUT_PARTIAL
    ].join('');

    return Buffer.from(contenidoTicket, 'ascii');
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

// Interfaz web profesional
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
                        <input type="text" id="date" name="date" value="${new Date().toLocaleDateString()}">
                    </div>
                    <div class="form-group">
                        <label for="time">Hora:</label>
                        <input type="text" id="time" name="time" value="${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}">
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
    </body>
    </html>
    `);
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor listo en http://localhost:3000');
});