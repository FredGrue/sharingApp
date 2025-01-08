const can = require('socketcan');
const dbc = require('dbc-js');
const dbcFile = dbc.parseFile('./example.dbc'); // DBC-Datei laden

// CAN-Channel konfigurieren
const channel = can.createRawChannel('can0', { bitrate: 500000 });
channel.start();

// Funktion zum Senden von CAN-Nachrichten
function sendCanMessage(messageName, signals) {
  const message = dbcFile.messages[messageName];
  if (!message) {
    throw new Error(`Nachricht ${messageName} nicht im DBC gefunden.`);
  }

  const encodedData = dbcFile.encode(message, signals);
  channel.send({ id: message.id, data: Buffer.from(encodedData) });

  console.log(`Gesendet: ${messageName} mit Signalen`, signals);
}

// Funktion zum Empfangen von CAN-Nachrichten
channel.addListener('onMessage', (msg) => {
  console.log('Empfangen:', msg);
});

module.exports = { sendCanMessage };
