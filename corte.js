const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Comandos ESC/POS para Epson
const ESC = '\x1B';
const INIT = ESC + '@';

// Diferentes comandos de corte (prueba uno por uno)
const CUT_COMMANDS = [
   // ESC + 'd' + '\x03',  // Corte estándar (completo)
    ESC + 'm',           // Corte parcial (alternativo 1)
   // ESC + 'i',           // Corte parcial (alternativo 2)
   // ESC + 'd' + '\x05',  // Corte con alimentación extra
   // ESC + 'V' + '\x41' + '\x00',  // Comando GS V para algunas Epson
];

// Ruta de impresión con prueba de cortes
app.post('/imprimir', (req, res) => {
    const { texto = "Prueba de corte" } = req.body;
    
    try {
        // 1. Envía texto de prueba
        let contenido = INIT + texto + '\n\n';

        // 2. Prueba TODOS los comandos de corte (uno tras otro)
        CUT_COMMANDS.forEach((cmd, i) => {
            contenido += `--- CORTE ${i+1} ---\n` + cmd;
        });

        fs.writeFileSync('/dev/usb/lp0', contenido);
        res.json({ 
            success: true,
            message: "Se enviaron 4 comandos de corte diferentes. Verifica cuál funcionó."
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Interfaz simple
app.get('/', (req, res) => {
    res.send(`
    <form action="/imprimir" method="post">
        <button type="submit">Probar Comandos de Corte</button>
    </form>
    `);
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor listo en http://localhost:3000');
});

