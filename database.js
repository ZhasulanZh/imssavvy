const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    // Создание таблицы пользователей
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        role TEXT,
        name TEXT,
        email TEXT,
        company_name TEXT,
        logo TEXT,
        country TEXT,
        city TEXT,
        agencyId INTEGER,
        status TEXT
    )`);

    // Добавление тестовых данных
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, logo, country, city, agencyId, status) 
            VALUES ('airline', 'airline123', 'airline', 'Airline Manager', 'airline1@example.com', 'Airline', 'logo.png', '', '', NULL, 'active')`);
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, logo, country, city, agencyId, status) 
            VALUES ('agent', 'agent123', 'agent', 'Agent', 'agent1@example.com', '', '', 'Country 1', 'City 1', 1, 'active')`);
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, logo, country, city, agencyId, status) 
            VALUES ('agency', 'agency123', 'agency', 'Agency Manager', 'agency1@example.com', 'Agency', '', '', '', NULL, 'active')`);
});

module.exports = db;
