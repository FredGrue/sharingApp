const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Datenbankpfad
const dbPath = path.resolve(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der SQLite-Datenbank:', err.message);
  } else {
    console.log('Verbunden mit der SQLite-Datenbank.');
  }
});

// Spalten, die hinzugefügt werden sollen
const newColumns = [
  { name: 'homeAddress', type: 'TEXT' },
  { name: 'dob', type: 'TEXT' },
  { name: 'driverLicense', type: 'TEXT' },
  { name: 'climateTemperature', type: 'INTEGER DEFAULT 22' },
  { name: 'fanIntensity', type: 'INTEGER DEFAULT 2' },
  { name: 'seatPosition', type: 'TEXT DEFAULT "Normal"' },
  { name: 'favoriteColor', type: 'TEXT' },
];

// Spalten prüfen und bei Bedarf hinzufügen
db.serialize(() => {
  newColumns.forEach((column) => {
    const query = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`;
    db.run(query, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Fehler beim Hinzufügen der Spalte ${column.name}:`, err.message);
      } else {
        console.log(`Spalte ${column.name} erfolgreich hinzugefügt oder existiert bereits.`);
      }
    });
  });
});

// Verbindung schließen
db.close((err) => {
  if (err) {
    console.error('Fehler beim Schließen der Datenbank:', err.message);
  } else {
    console.log('Datenbankverbindung geschlossen.');
  }
});
