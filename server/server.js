const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// CORS-Konfiguration für alle Ursprünge
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware zum Parsen von JSON
app.use(express.json());

// SQLite-Datenbank initialisieren
const dbPath = path.resolve(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der SQLite-Datenbank:', err.message);
  } else {
    console.log('Verbunden mit der SQLite-Datenbank');
  }
});

// Erstelle die Tabelle "tickets", falls sie noch nicht existiert
const createTableQuery = `
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car TEXT NOT NULL,
  validUntil TEXT NOT NULL,
  doorAccess INTEGER DEFAULT 0,
  windowAccess INTEGER DEFAULT 0,
  trunkAccess INTEGER DEFAULT 0,
  engineStart INTEGER DEFAULT 0,
  speedLimit TEXT DEFAULT 'full',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

db.run(createTableQuery, (err) => {
  if (err) {
    console.error('Fehler beim Erstellen der Tabelle:', err.message);
  } else {
    console.log('Tabelle "tickets" erfolgreich erstellt oder existiert bereits');
  }
});

// API-Endpunkt: Alle gültigen Tickets abrufen
app.get('/tickets', (req, res) => {
  console.log('GET /tickets aufgerufen');
  const currentDate = new Date().toISOString();

  const query = `
    SELECT * FROM tickets
    WHERE validUntil > ?
    ORDER BY validUntil ASC;
  `;

  db.all(query, [currentDate], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der Tickets:', err.message);
      res.status(500).json({ error: 'Fehler beim Abrufen der Tickets' });
    } else {
      console.log('Daten erfolgreich abgerufen:', rows);
      res.json(rows || []);
    }
  });
});

// API-Endpunkt: Neues Ticket erstellen
app.post('/tickets', (req, res) => {
  const {
    car,
    validUntil,
    doorAccess,
    windowAccess,
    trunkAccess,
    engineStart,
    speedLimit,
  } = req.body;

  const query = `
    INSERT INTO tickets (car, validUntil, doorAccess, windowAccess, trunkAccess, engineStart, speedLimit)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    car,
    validUntil,
    doorAccess ? 1 : 0,
    windowAccess ? 1 : 0,
    trunkAccess ? 1 : 0,
    engineStart ? 1 : 0,
    speedLimit || 'full',
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error('Fehler beim Erstellen des Tickets:', err.message);
      res.status(500).json({ error: 'Fehler beim Erstellen des Tickets' });
    } else {
      res.status(201).json({ message: 'Ticket erfolgreich erstellt', ticketId: this.lastID });
    }
  });
});

// Test-Route zum Debuggen
app.get('/test', (req, res) => {
  res.send('Test-Route funktioniert!');
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
