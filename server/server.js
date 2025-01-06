// server.js

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
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

// Tabellen beim Neustart des Servers leeren
const clearTablesQuery = `
  DELETE FROM tickets;
  DELETE FROM users;
  DELETE FROM ticket_shares;
  DELETE FROM active_tickets;
`;

db.exec(clearTablesQuery, (err) => {
  if (err) {
    console.error('Fehler beim Leeren der Tabellen:', err.message);
  } else {
    console.log('Alle Tabellen wurden geleert.');
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
  lastActive TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT "inactive",
  homeAddress TEXT, -- Adresse des Nutzers
  dob TEXT, -- Geburtsdatum
  driverLicense TEXT, -- Führerscheinklassen, als kommaseparierte Werte gespeichert
  climateTemperature INTEGER DEFAULT 22, -- Temperatur-Voreinstellung
  fanIntensity INTEGER DEFAULT 2, -- Lüfterstufe (0-4)
  seatPosition TEXT DEFAULT "Normal", -- Sitzposition
  favoriteColor TEXT -- Bevorzugte Farbe
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

const createActiveTicket = `
CREATE TABLE IF NOT EXISTS active_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticketId INTEGER NOT NULL,
  username TEXT NOT NULL,
  UNIQUE(ticketId, username),
  FOREIGN KEY (ticketId) REFERENCES tickets(id)
);
`;

db.run(createTableQuery);
db.run(createUsersTableQuery);
db.run(createTicketSharesTableQuery);
db.run(createActiveTicket);

// Hilfsfunktion für leere Ergebnisse
function handleEmptyResult(rows, message) {
  if (!rows || rows.length === 0) {
    console.log(message);
    return null; // Keine Ergebnisse
  }
  return rows; // Ergebnisse vorhanden
}

// Hilfsfunktion: Datenbankzustand prüfen
function checkDatabaseState() {
  const tables = ['tickets', 'users', 'ticket_shares', 'active_tickets'];

  tables.forEach((table) => {
    const query = `SELECT COUNT(*) as count FROM ${table}`;
    db.get(query, [], (err, row) => {
      if (err) {
        console.error(`Fehler beim Abrufen des Datenbankzustands für ${table}:`, err.message);
      } else if (row.count === 0) {
        console.log(`Tabelle ${table} ist leer.`);
      } else {
        console.log(`Tabelle ${table} enthält ${row.count} Einträge.`);
      }
    });
  });
}

checkDatabaseState();

// Socket.io-Verbindung
io.on('connection', (socket) => {
  console.log('Ein neuer Client ist verbunden.');

  socket.on('register', (username) => {
    console.log(`Socket ${socket.id} tritt Raum ${username} bei.`);
    socket.join(username);
  });

  socket.on('notifyDeletion', ({ username, ticketId }) => {
    console.log(`Benachrichtigung an ${username} über die Löschung von Ticket ${ticketId}`);
    io.to(username).emit('ticketDeletionRequest', { ticketId });
  });

  socket.on('disconnect', () => {
    console.log('Ein Client hat die Verbindung getrennt.');
  });
});

// Endpunkt: Nutzerinformationen abrufen
app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], (err, row) => {
    if (err) {
      console.error('Fehler beim Abrufen der Nutzerdaten:', err.message);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Nutzerdaten' });
    }
    res.status(200).json(row || {});
  });
});

// Endpunkt: Nutzerinformationen aktualisieren
app.put('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const {
    homeAddress,
    dob,
    driverLicense,
    climateTemperature,
    fanIntensity,
    seatPosition,
    favoriteColor,
  } = req.body;

  const query = `
    UPDATE users
    SET homeAddress = ?, dob = ?, driverLicense = ?, climateTemperature = ?, 
        fanIntensity = ?, seatPosition = ?, favoriteColor = ?
    WHERE username = ?
  `;

  db.run(
    query,
    [homeAddress, dob, driverLicense, climateTemperature, fanIntensity, seatPosition, favoriteColor, username],
    function (err) {
      if (err) {
        console.error('Fehler beim Aktualisieren der Nutzerdaten:', err.message);
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der Nutzerdaten' });
      }
      res.status(200).json({ message: 'Nutzerdaten erfolgreich aktualisiert.' });
    }
  );
});

// API-Endpunkte
app.get('/api/tickets', (req, res) => {
  const query = `SELECT * FROM tickets ORDER BY createdAt DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der Tickets:', err.message);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Tickets' });
    }

    res.status(200).json({ data: rows || [] }); // Immer ein Array zurückgeben
  });
});


app.post('/api/tickets', (req, res) => {
  const { car, validUntil, doorAccess, windowAccess, trunkAccess, engineStart, speedLimit, owner } = req.body;

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
      return res.status(500).json({ error: 'Fehler beim Erstellen des Tickets' });
    }
    const ticketId = this.lastID;
    io.emit('ticketCreated', { ticketId });
    res.status(201).json({ message: 'Ticket erfolgreich erstellt', ticketId });
  });
});

// Ticket löschen
app.delete('/api/tickets/:id', (req, res) => {
  const { id } = req.params;

  // Überprüfen, ob das Ticket aktiv genutzt wird
  const checkActiveQuery = `
    SELECT username
    FROM active_tickets
    WHERE ticketId = ?;
  `;

  db.all(checkActiveQuery, [id], (err, rows) => {
    if (err) {
      console.error(`Fehler beim Überprüfen der aktiven Nutzer für Ticket ${id}:`, err.message);
      return res.status(500).json({ error: 'Fehler beim Überprüfen der aktiven Nutzer' });
    }

    if (rows.length > 0) {
      return res.status(400).json({ error: 'Ticket wird aktiv genutzt und kann nicht gelöscht werden.' });
    }

    // Abhängige Einträge in `ticket_shares` und `active_tickets` löschen
    const deleteSharesQuery = `DELETE FROM ticket_shares WHERE ticketId = ?`;
    const deleteActiveTicketsQuery = `DELETE FROM active_tickets WHERE ticketId = ?`;

    db.run(deleteSharesQuery, [id], (err) => {
      if (err) {
        console.error(`Fehler beim Löschen von Ticket-Sharing-Einträgen für Ticket ${id}:`, err.message);
        return res.status(500).json({ error: 'Fehler beim Löschen von Ticket-Sharing-Einträgen' });
      }

      db.run(deleteActiveTicketsQuery, [id], (err) => {
        if (err) {
          console.error(`Fehler beim Löschen von aktiven Ticket-Einträgen für Ticket ${id}:`, err.message);
          return res.status(500).json({ error: 'Fehler beim Löschen von aktiven Ticket-Einträgen' });
        }

        // Schließlich das Ticket löschen
        const deleteQuery = `DELETE FROM tickets WHERE id = ?`;

        db.run(deleteQuery, [id], (err) => {
          if (err) {
            console.error(`Fehler beim Löschen des Tickets ${id}:`, err.message);
            return res.status(500).json({ error: 'Fehler beim Löschen des Tickets' });
          }

          io.emit('ticketDeleted', { ticketId: id });
          console.log(`Ticket ${id} erfolgreich gelöscht.`);
          res.status(200).json({ message: `Ticket ${id} erfolgreich gelöscht` });
        });
      });
    });
  });
});

app.get('/api/active-users', (req, res) => {
  const query = `
    SELECT username, lastActive
    FROM users
    WHERE status = "active"
    ORDER BY lastActive DESC;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der aktiven Nutzer:', err.message);
      return res.status(500).json({ error: 'Fehler beim Abrufen der aktiven Nutzer' });
    }
    handleEmptyResult(rows, res, 'Keine aktiven Nutzer gefunden.');
    res.status(200).json({ data: rows || [] });
  });
});

app.get('/api/active-tickets/:ticketId', (req, res) => {
  const { ticketId } = req.params;

  const query = `
    SELECT username
    FROM active_tickets
    WHERE ticketId = ?;
  `;

  db.all(query, [ticketId], (err, rows) => {
    if (err) {
      console.error(`Fehler beim Abrufen der aktiven Nutzer für Ticket ${ticketId}:`, err.message);
      return res.status(500).json({ error: 'Fehler beim Abrufen der aktiven Nutzer' });
    }

    res.status(200).json(rows || []); // Gibt immer ein Array zurück
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://192.168.0.121:${PORT}`);
});

// Login-Endpunkt
app.post('/login', (req, res) => {
  const { userName } = req.body;

  if (!userName) {
    return res.status(400).json({ error: 'Benutzername ist erforderlich' });
  }

  const query = `INSERT INTO users (username, status) VALUES (?, "active") ON CONFLICT(username) DO UPDATE SET lastActive = CURRENT_TIMESTAMP, status = "active"`;

  db.run(query, [userName], function (err) {
    if (err) {
      console.error('Fehler beim Hinzufügen oder Aktualisieren des Nutzers:', err.message);
      return res.status(500).json({ error: 'Fehler beim Verarbeiten der Login-Anfrage' });
    }

    console.log(`Nutzer ${userName} wurde erfolgreich hinzugefügt oder aktualisiert.`);
    res.status(200).json({ message: 'Login erfolgreich', userName });
  });
});

app.get('/api/assigned-tickets/:username', (req, res) => {
  const { username } = req.params;

  const query = `
    SELECT tickets.* 
    FROM tickets
    INNER JOIN ticket_shares 
    ON tickets.id = ticket_shares.ticketId
    WHERE ticket_shares.sharedWith = ?;
  `;

  db.all(query, [username], (err, rows) => {
    if (err) {
      console.error(`Fehler beim Abrufen der zugewiesenen Tickets für ${username}:`, err.message);
      return res.status(500).json({ error: 'Fehler beim Abrufen der zugewiesenen Tickets' });
    }

    res.status(200).json({ data: rows || [] }); // Immer ein Array zurückgeben
  });
});

app.post('/api/tickets/:id/share', (req, res) => {
  const { id } = req.params;
  const { sharedWith } = req.body;

  // Ticket mit Nutzer teilen
  const shareQuery = `
    INSERT INTO ticket_shares (ticketId, sharedWith)
    VALUES (?, ?)
    ON CONFLICT DO NOTHING;
  `;

  db.run(shareQuery, [id, sharedWith], function (err) {
    if (err) {
      console.error(`Fehler beim Teilen des Tickets ${id}:`, err.message);
      return res.status(500).json({ error: 'Fehler beim Teilen des Tickets' });
    }

    // Nachricht an den Nutzer über Socket.io
    io.to(sharedWith).emit('ticketSharedWithYou', { ticketId: id });

    console.log(`Ticket ${id} wurde erfolgreich mit ${sharedWith} geteilt.`);
    res.status(200).json({ message: `Ticket ${id} erfolgreich mit ${sharedWith} geteilt.` });
  });
});

app.post('/api/tickets/:id/return', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  const deleteQuery = `
    DELETE FROM ticket_shares
    WHERE ticketId = ? AND sharedWith = ?;
  `;

  db.run(deleteQuery, [id, username], function (err) {
    if (err) {
      console.error(`Fehler beim Zurückgeben des Tickets ${id}:`, err.message);
      return res.status(500).json({ error: 'Fehler beim Zurückgeben des Tickets' });
    }

    // Nachricht an den Besitzer des Tickets senden
    const ownerQuery = `SELECT owner FROM tickets WHERE id = ?;`;

    db.get(ownerQuery, [id], (err, row) => {
      if (err) {
        console.error(`Fehler beim Abrufen des Besitzers für Ticket ${id}:`, err.message);
        return res.status(500).json({ error: 'Fehler beim Abrufen des Ticket-Besitzers' });
      }

      if (row && row.owner) {
        io.to(row.owner).emit('ticketReturned', {
          ticketId: id,
          returnedBy: username,
        });
      }

      console.log(`Ticket ${id} wurde erfolgreich von ${username} zurückgegeben.`);
      res.status(200).json({ message: `Ticket ${id} erfolgreich zurückgegeben.` });
    });
  });
});

app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { car, validUntil, doorAccess, windowAccess, trunkAccess, engineStart, speedLimit, owner } = req.body;

  const updateQuery = `
    UPDATE tickets
    SET car = ?, validUntil = ?, doorAccess = ?, windowAccess = ?, trunkAccess = ?, engineStart = ?, speedLimit = ?, owner = ?
    WHERE id = ?
  `;

  const params = [
    car,
    validUntil,
    doorAccess ? 1 : 0,
    windowAccess ? 1 : 0,
    trunkAccess ? 1 : 0,
    engineStart ? 1 : 0,
    speedLimit,
    owner,
    id,
  ];

  db.run(updateQuery, params, function (err) {
    if (err) {
      console.error(`Fehler beim Aktualisieren des Tickets ${id}:`, err.message);
      return res.status(500).json({ error: 'Fehler beim Aktualisieren des Tickets' });
    }

    if (this.changes === 0) {
      console.warn(`Ticket ${id} wurde nicht gefunden.`);
      return res.status(404).json({ error: `Ticket ${id} nicht gefunden.` });
    }

    console.log(`Ticket ${id} erfolgreich aktualisiert.`);
    res.status(200).json({ message: `Ticket ${id} erfolgreich aktualisiert.` });
  });
});

// Endpunkt: Nutzerinformationen aktualisieren
app.put('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const {
    homeAddress,
    dob,
    driverLicense,
    climateTemperature,
    fanIntensity,
    seatPosition,
    favoriteColor,
  } = req.body;

  console.log('Empfangene Nutzerdaten:', {
    username,
    homeAddress,
    dob,
    driverLicense,
    climateTemperature,
    fanIntensity,
    seatPosition,
    favoriteColor,
  }); // Debugging-Log

  const query = `
    UPDATE users
    SET homeAddress = ?, dob = ?, driverLicense = ?, climateTemperature = ?, 
        fanIntensity = ?, seatPosition = ?, favoriteColor = ?
    WHERE username = ?
  `;

  const params = [
    homeAddress,
    dob,
    driverLicense,
    climateTemperature,
    fanIntensity,
    seatPosition,
    favoriteColor,
    username,
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error('Fehler beim Aktualisieren der Nutzerdaten:', err.message); // Fehlerdetails ausgeben
      console.log('SQL-Query:', query); // Debugging-Log
      console.log('Parameter:', params); // Debugging-Log
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der Nutzerdaten' });
    }
    if (this.changes === 0) {
      console.warn('Kein Benutzer mit diesem Namen gefunden:', username); // Warnung ausgeben
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }
    res.status(200).json({ message: 'Nutzerdaten erfolgreich aktualisiert.' });
  });
});

// Endpunkt: Alle Nutzer aus der users-Tabelle abrufen
app.get('/api/users', (req, res) => {
  const query = `SELECT * FROM users`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der Nutzerdaten:', err.message);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Nutzerdaten' });
    }

    res.status(200).json(rows); // Gibt die gesamte Tabelle im JSON-Format zurück
  });
});

