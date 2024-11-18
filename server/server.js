//server.js

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http'); // Wichtig
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
});
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

// Erstelle die Tabellen, falls sie noch nicht existieren
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
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  owner TEXT
);`;

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
  FOREIGN KEY (ticketId) REFERENCES tickets (id),
  UNIQUE (ticketId, sharedWith)
);
`;

db.run(createTableQuery);
db.run(createUsersTableQuery);
db.run(createTicketSharesTableQuery);

// Tabelle löschen und neu erstellen


// Socket.io-Verbindung
io.on('connection', (socket) => {
  console.log('Ein neuer Client ist verbunden.');
  socket.on('disconnect', () => {
    console.log('Ein Client hat die Verbindung getrennt.');
  });
});

// In your backend server file (e.g., index.js or app.js)
app.get('/api/tickets', (req, res) => {
  const query = `SELECT * FROM tickets ORDER BY createdAt DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('SQL-Fehler beim Abrufen der Tickets:', err.message);
      res.status(500).json({ message: 'SQL-Fehler', error: err.message });
    } else if (!rows || rows.length === 0) {
      console.warn('Keine Tickets gefunden.');
      res.status(404).json({ message: 'Keine Tickets gefunden' });
    } else {
      res.json(rows);
    }
  });
});

// API-Endpunkt: Neues Ticket erstellen
app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
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
    UPDATE tickets
    SET car = ?, validUntil = ?, doorAccess = ?, windowAccess = ?, trunkAccess = ?, engineStart = ?, speedLimit = ?, owner = ?
    WHERE id = ?;
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
    id,
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error('Fehler beim Aktualisieren des Tickets:', err.message);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Tickets' });
    } else {
      console.log(`Ticket mit ID ${id} erfolgreich aktualisiert.`);
      // Emit das 'ticketUpdated'-Event mit der ID des aktualisierten Tickets
      io.emit('ticketUpdated', { ticketId: id });
      res.status(200).json({ message: 'Ticket erfolgreich aktualisiert' });
    }
  });
});


app.post('/api/tickets', (req, res) => {
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
      const ticketId = this.lastID;
      console.log(`Neues Ticket erstellt mit ID ${ticketId}.`);
      io.emit('ticketCreated', { ticketId });
      res.status(201).json({ message: 'Ticket erfolgreich erstellt', ticketId });
    }
  });
});


// API-Endpunkt: Ticket teilen und WebSocket-Ereignis auslösen
app.post('/api/tickets/:ticketId/share', (req, res) => {
  const { ticketId } = req.params;
  const { sharedWith } = req.body;

  if (!sharedWith) {
    return res.status(400).json({ message: 'sharedWith ist erforderlich' });
  }

  const query = `
    INSERT INTO ticket_shares (ticketId, sharedWith)
    VALUES (?, ?)
    ON CONFLICT(ticketId, sharedWith) DO NOTHING;
  `;

  db.run(query, [ticketId, sharedWith], (err) => {
    if (err) {
      console.error('Fehler beim Teilen des Tickets:', err.message);
      res.status(500).json({ message: 'Fehler beim Teilen des Tickets' });
    } else {
      io.emit('ticketShared', { ticketId, sharedWith });
      res.status(200).json({ message: 'Ticket erfolgreich geteilt' });
    }
  });
});

// API-Endpunkt: Zugewiesene Tickets für einen Nutzer abrufen
app.get('/api/assigned-tickets/:username', (req, res) => {
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

// Server starten
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

// API-Endpunkt: Aktive Nutzer abrufen
app.get('/api/active-users', (req, res) => {
  const query = `
    SELECT username, lastActive FROM users
    ORDER BY username;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der aktiven Nutzer:', err.message);
      res.status(500).json({ error: 'Fehler beim Abrufen der aktiven Nutzer' });
    } else {
      console.log('Aktive Nutzer:', rows);
      const activeUsers = rows.map((row) => row.username);
      res.json(activeUsers);
    }
  });
});

// API-Endpunkt: Nutzer-Login
app.post('/login', (req, res) => {
  const { userName } = req.body;

  if (!userName) {
    res.status(400).json({ error: 'Nutzername fehlt' });
    return;
  }

  const query = `
    INSERT INTO users (username, lastActive)
    VALUES (?, datetime('now'))
    ON CONFLICT(username) DO UPDATE SET lastActive = datetime('now');
  `;

  db.run(query, [userName], (err) => {
    if (err) {
      console.error('Fehler beim Aktualisieren des Nutzers:', err.message);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Nutzers' });
    } else {
      console.log(`Nutzer "${userName}" erfolgreich eingeloggt und lastActive aktualisiert.`);
      res.status(200).json({ message: 'Login erfolgreich' });
    }
  });
});

// DELETE-Route für das Löschen eines Tickets
app.delete('/api/tickets/:id', (req, res) => {
  const ticketId = req.params.id;

  if (!ticketId) {
    res.status(400).json({ error: 'Ticket-ID fehlt' });
    return;
  }

  const query = `DELETE FROM tickets WHERE id = ?`;

  db.run(query, [ticketId], (err) => {
    if (err) {
      console.error('Fehler beim Löschen des Tickets:', err.message);
      res.status(500).json({ error: 'Fehler beim Löschen des Tickets' });
    } else {
      console.log(`Ticket mit ID ${ticketId} erfolgreich gelöscht.`);
      res.status(200).json({ message: 'Ticket erfolgreich gelöscht' });
    }
  });
});

app.post('/api/tickets/:ticketId/share', (req, res) => {
  const { ticketId } = req.params;
  const { sharedWith } = req.body;

  if (!sharedWith) {
    return res.status(400).json({ message: 'sharedWith ist erforderlich' });
  }

  const query = `
    INSERT INTO ticket_shares (ticketId, sharedWith)
    VALUES (?, ?)
    ON CONFLICT(ticketId, sharedWith) DO NOTHING;
  `;

  db.run(query, [ticketId, sharedWith], (err) => {
    if (err) {
      console.error('Fehler beim Teilen des Tickets:', err.message);
      res.status(500).json({ message: 'Fehler beim Teilen des Tickets' });
    } else {
      io.emit('ticketShared', { ticketId, sharedWith });
      res.status(200).json({ message: 'Ticket erfolgreich geteilt' });
    }
  });
});

// API-Endpunkt: Geteiltes Ticket zurückgeben
app.post('/api/tickets/:ticketId/return', (req, res) => {
  const { ticketId } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Nutzername fehlt' });
  }

  const query = `
    DELETE FROM ticket_shares
    WHERE ticketId = ? AND sharedWith = ?;
  `;

  db.run(query, [ticketId, username], (err) => {
    if (err) {
      console.error('Fehler beim Zurückgeben des geteilten Tickets:', err.message);
      res.status(500).json({ message: 'Fehler beim Zurückgeben des Tickets' });
    } else {
      console.log(`Geteiltes Ticket mit ID ${ticketId} wurde von ${username} zurückgegeben.`);
      // WebSocket-Benachrichtigung an den Ersteller des Tickets
      io.emit('ticketReturned', { ticketId, returnedBy: username });
      res.status(200).json({ message: 'Ticket erfolgreich zurückgegeben' });
    }
  });
});