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
);`;

// Neue Tabellen für Nutzer und Ticket-Sharing
const createUsersTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  lastActive TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

const createTicketSharesTableQuery = `
CREATE TABLE IF NOT EXISTS ticket_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticketId INTEGER NOT NULL,
  sharedWith TEXT NOT NULL,
  FOREIGN KEY (ticketId) REFERENCES tickets (id)
);
`;

db.run(createTableQuery, (err) => {
  if (err) {
    console.error('Fehler beim Erstellen der Tabelle:', err.message);
  } else {
    console.log('Tabelle "tickets" erfolgreich erstellt oder existiert bereits');
  }
});

// Tabellen erstellen
db.run(createUsersTableQuery, (err) => {
  if (err) {
    console.error('Fehler beim Erstellen der Tabelle "users":', err.message);
  } else {
    console.log('Tabelle "users" erfolgreich erstellt oder existiert bereits');
  }
});

db.run(createTicketSharesTableQuery, (err) => {
  if (err) {
    console.error('Fehler beim Erstellen der Tabelle "ticket_shares":', err.message);
  } else {
    console.log('Tabelle "ticket_shares" erfolgreich erstellt oder existiert bereits');
  }
});

const alterTicketsTableQuery = `
ALTER TABLE tickets
ADD COLUMN owner TEXT;
`;

db.run(alterTicketsTableQuery, (err) => {
  if (err) {
    console.log('Spalte "owner" existiert bereits in der Tabelle "tickets".');
  } else {
    console.log('Spalte "owner" erfolgreich zur Tabelle "tickets" hinzugefügt.');
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
    owner,
  } = req.body;

  const query = `
    INSERT INTO tickets (car, validUntil, doorAccess, windowAccess, trunkAccess, engineStart, speedLimit, owner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    car,
    validUntil,
    doorAccess ? 1 : 0,
    windowAccess ? 1 : 0,
    trunkAccess ? 1 : 0,
    engineStart ? 1 : 0,
    speedLimit || 'full',
    owner || 'Unbekannt',
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

app.delete('/api/tickets/:id', (req, res) => {
  const ticketId = req.params.id;
  console.log(`Versuche, Ticket mit ID ${ticketId} zu löschen`);

  const sql = 'DELETE FROM tickets WHERE id = ?';

  db.run(sql, [ticketId], function (err) {
    if (err) {
      console.error('Fehler beim Löschen des Tickets:', err.message);
      res.status(500).send({ error: 'Fehler beim Löschen des Tickets' });
    } else if (this.changes === 0) {
      console.warn(`Kein Ticket mit der ID ${ticketId} gefunden.`);
      res.status(404).send({ error: 'Ticket nicht gefunden' });
    } else {
      console.log(`Ticket mit ID ${ticketId} erfolgreich gelöscht.`);
      res.status(200).send({ message: 'Ticket erfolgreich gelöscht' });
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

// Nutzer registrieren oder letzten Aktivitätszeitstempel aktualisieren
app.post('/login', (req, res) => {
  const { username } = req.body;

  const query = `
    INSERT INTO users (username, lastActive)
    VALUES (?, datetime('now'))
    ON CONFLICT(username)
    DO UPDATE SET lastActive = datetime('now');
  `;

  db.run(query, [username], (err) => {
    if (err) {
      console.error('Fehler beim Speichern des Nutzers:', err.message);
      res.status(500).json({ error: 'Fehler beim Speichern des Nutzers' });
    } else {
      res.status(200).json({ message: 'Nutzer erfolgreich registriert oder aktualisiert' });
    }
  });
});

// Aktive Nutzer der letzten 1 Stunde abrufen
app.get('/active-users', (req, res) => {
  const query = `
    SELECT username FROM users
    WHERE lastActive >= datetime('now', '-1 hour');
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der aktiven Nutzer:', err.message);
      res.status(500).json({ error: 'Fehler beim Abrufen der aktiven Nutzer' });
    } else {
      res.json(rows.map((row) => row.username));
    }
  });
});

// Ticket mit einem Nutzer teilen
app.post('/share-ticket', (req, res) => {
  const { ticketId, sharedWith } = req.body;

  const query = `
    INSERT INTO ticket_shares (ticketId, sharedWith)
    VALUES (?, ?);
  `;

  db.run(query, [ticketId, sharedWith], (err) => {
    if (err) {
      console.error('Fehler beim Teilen des Tickets:', err.message);
      res.status(500).json({ error: 'Fehler beim Teilen des Tickets' });
    } else {
      res.status(200).json({ message: 'Ticket erfolgreich geteilt' });
    }
  });
});

// Zugewiesene Tickets für einen Nutzer abrufen
app.get('/assigned-tickets/:username', (req, res) => {
  const { username } = req.params;

  const query = `
    SELECT t.* FROM tickets t
    LEFT JOIN ticket_shares ts ON t.id = ts.ticketId
    WHERE t.owner = ? OR ts.sharedWith = ?
    ORDER BY t.validUntil ASC;
  `;

  db.all(query, [username, username], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der zugewiesenen Tickets:', err.message);
      res.status(500).json({ error: 'Fehler beim Abrufen der zugewiesenen Tickets' });
    } else {
      res.json(rows || []);
    }
  });
});
