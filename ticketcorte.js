const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Comandos ESC/POS para Epson
const ESC = '\x1B';
const INIT = ESC + '@';
const BOLD_ON = ESC + 'E\x01';
const BOLD_OFF = ESC + 'E\x00';
const ALIGN_CENTER = ESC + 'a\x01';
const ALIGN_LEFT = ESC + 'a\x00';

// Comandos de corte (descomenta los que necesites probar)
const CUT_COMMANDS = {
    partial: ESC + 'm',           // Corte parcial
    full: ESC + 'd\x03',         // Corte completo
    feed_and_cut: ESC + 'd\x05', // Corte con alimentación extra
    alternate: ESC + 'i'          // Corte alternativo
};

// Generador de ticket de viaje
function generateTravelTicket(destination, date, seat, price, cutType = 'partial') {
    const cutCommand = CUT_COMMANDS[cutType] || CUT_COMMANDS.partial;
    
    return [
        INIT,
        ALIGN_CENTER,
        BOLD_ON,
        'TRANSPORTE TURÍSTICO\n',
        BOLD_OFF,
        '========================\n',
        ALIGN_LEFT,
        `Destino: ${destination}\n`,
        `Fecha:   ${date}\n`,
        `Asiento: ${seat}\n`,
        `Precio:  $${price}\n\n`,
        'Gracias por viajar con nosotros!\n',
        '========================\n',
        cutCommand
    ].join('');
}

// Ruta para imprimir ticket
app.post('/imprimir-ticket', (req, res) => {
    const { destination, date, seat, price, cutType } = req.body;
    
    try {
        const ticketContent = generateTravelTicket(
            destination || "Ciudad Ejemplo",
            date || new Date().toLocaleDateString(),
            seat || "A12",
            price || "150.00",
            cutType
        );

        fs.writeFileSync('/dev/usb/lp0', ticketContent);
        res.json({ 
            success: true,
            message: "Ticket impreso correctamente"
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Interfaz web para generación de tickets
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sistema de Tickets de Viaje</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
            form { display: grid; gap: 15px; }
            label { display: grid; gap: 5px; }
            input, select { padding: 8px; }
            button { background: #0066cc; color: white; border: none; padding: 10px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Generador de Tickets de Viaje</h1>
        <form action="/imprimir-ticket" method="post">
            <label>
                Destino:
                <input type="text" name="destination" required value="Playa del Carmen">
            </label>
            
            <label>
                Fecha:
                <input type="text" name="date" required value="${new Date().toLocaleDateString()}">
            </label>
            
            <label>
                Asiento:
                <input type="text" name="seat" required value="B07">
            </label>
            
            <label>
                Precio:
                <input type="text" name="price" required value="175.50">
            </label>
            
            <label>
                Tipo de Corte:
                <select name="cutType">
                    <option value="partial">Corte Parcial</option>
                    <option value="full">Corte Completo</option>
                    <option value="feed_and_cut">Corte con Alimentación</option>
                    <option value="alternate">Corte Alternativo</option>
                </select>
            </label>
            
            <button type="submit">Imprimir Ticket</button>
        </form>
    </body>
    </html>
    `);
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor listo en http://localhost:3000');
});