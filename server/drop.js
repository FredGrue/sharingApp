const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite-Datenbank initialisieren
const dbPath = path.resolve(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der SQLite-Datenbank:', err.message);
  } else {
    console.log('Verbunden mit der SQLite-Datenbank');
  }
});

// Tabellen löschen
const dropTablesQuery = `
  DROP TABLE IF EXISTS tickets;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS ticket_shares;
  DROP TABLE IF EXISTS active_tickets;
`;

db.exec(dropTablesQuery, (err) => {
  if (err) {
    console.error('Fehler beim Löschen der Tabellen:', err.message);
  } else {
    console.log('Alle Tabellen wurden erfolgreich gelöscht.');
  }

  // Verbindung zur Datenbank schließen
  db.close((err) => {
    if (err) {
      console.error('Fehler beim Schließen der Datenbank:', err.message);
    } else {
      console.log('Datenbankverbindung geschlossen.');
    }
  });
});
