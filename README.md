# TotemAndroid
Repo para hacer pruebas de impresión en un totem android

# Impresora 
Linux asigna nombres de dispositivos (lp0, lp1, etc.) en orden secuencial según el momento de conexión

El primer dispositivo USB de impresión conectado se asigna a /dev/usb/lp0

Cada nuevo dispositivo recibe el siguiente número disponible (lp1, lp2, etc.)

El orden puede cambiar si:

Se conectan dispositivos en diferente secuencia

Se reinicia el sistema

Se cambian puertos USB físicos
