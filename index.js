const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к базе данных SQLite
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
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
            VALUES ('admin', 'admin123', 'admin', 'Admin User', 'admin@example.com', 'Admin Corp', 'logo.png', '', '', NULL, 'active')`);
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, logo, country, city, agencyId, status) 
            VALUES ('airline', 'airline123', 'airline', 'Airline Manager', 'airline1@example.com', 'Airline', 'logo.png', '', '', NULL, 'active')`);
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, logo, country, city, agencyId, status) 
            VALUES ('agent', 'agent123', 'agent', 'Agent', 'agent1@example.com', '', '', 'Country 1', 'City 1', 1, 'pending')`);
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, logo, country, city, agencyId, status) 
            VALUES ('agency', 'agency123', 'agency', 'Agency Manager', 'agency1@example.com', 'Agency', '', '', '', NULL, 'active')`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

function checkAuth(req, res, next) {
    if (!req.session.user) {
        res.redirect('/auth/login');
    } else {
        next();
    }
}

function checkAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        res.redirect('/auth/login');
    } else {
        next();
    }
}

// Функция для поиска пользователя
function findUser(username, password, callback) {
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            console.error(err.message);
            callback(null);
        } else {
            callback(row);
        }
    });
}

// Функция для поиска пользователя по ID
function findUserById(userId, callback) {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error(err.message);
            callback(null);
        } else {
            callback(row);
        }
    });
}

// Функция для получения пользователей по роли
function getUsersByRole(role, callback) {
    db.all('SELECT * FROM users WHERE role = ?', [role], (err, rows) => {
        if (err) {
            console.error(err.message);
            callback([]);
        } else {
            callback(rows);
        }
    });
}

// Функция для обновления профиля пользователя
function updateUserProfile(userId, profileData, callback) {
    const { company_name, name, logo, country, city } = profileData;
    db.run(`UPDATE users SET company_name = ?, name = ?, logo = ?, country = ?, city = ? WHERE id = ?`,
        [company_name, name, logo, country, city, userId], function(err) {
            if (err) {
                console.error(err.message);
                callback(false);
            } else {
                callback(true);
            }
        }
    );
}

const promos = [
    {
        id: 1,
        name: "Promo 1",
        description: "Description of Promo 1",
        country: "Country 1",
        city: "City 1",
        departure_city: "City 1",
        arrival_city: "City 2",
        travel_period: "2022-01-01 to 2022-12-31",
        commission_agency: 10.0,
        commission_agent: 5.0,
        airline: 'Airline'
    },
];

// Routes
app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.get('/auth/login', (req, res) => {
    db.all('SELECT role, username, password FROM users', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.send('Error retrieving users.');
        } else {
            res.render('login', { users: rows });
        }
    });
});

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    findUser(username, password, (user) => {
        if (user) {
            req.session.user = user;
            if (user.role === 'admin') {
                res.redirect('/admin/dashboard');
            } else if (user.role === 'agency') {
                res.redirect('/agency/dashboard');
            } else if (user.role === 'agent') {
                res.redirect('/agent/dashboard');
            } else {
                res.redirect('/airline/dashboard');
            }
        } else {
            res.send('Invalid username or password');
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/auth/login');
    });
});

app.get('/airline/dashboard', checkAuth, (req, res) => {
    const filteredPromos = promos.filter(promo => promo.airline === req.session.user.company_name);
    res.render('airline-dashboard', { user: req.session.user, promos: filteredPromos });
});

app.get('/airline/create-promo', checkAuth, (req, res) => {
    res.render('create-promo-step1');
});

app.post('/airline/create-promo/step1', checkAuth, (req, res) => {
    const { name, description, country, city } = req.body;
    req.session.promoData = { name, description, country, city };
    res.redirect('/airline/create-promo/step2');
});

app.get('/airline/create-promo/step2', checkAuth, (req, res) => {
    res.render('create-promo-step2');
});

app.post('/airline/create-promo/step2', checkAuth, (req, res) => {
    const { departure_city, arrival_city, travel_period } = req.body;
    req.session.promoData.departure_city = departure_city;
    req.session.promoData.arrival_city = arrival_city;
    req.session.promoData.travel_period = travel_period;
    res.redirect('/airline/create-promo/step3');
});

app.get('/airline/create-promo/step3', checkAuth, (req, res) => {
    res.render('create-promo-step3');
});

app.post('/airline/create-promo/step3', checkAuth, (req, res) => {
    const { commission_agency, commission_agent } = req.body;
    const promoData = req.session.promoData;
    promoData.commission_agency = commission_agency;
    promoData.commission_agent = commission_agent;
    promoData.airline = req.session.user.company_name; // Добавление названия авиакомпании

    // Save promo data
    promos.push({
        id: promos.length + 1,
        ...promoData
    });

    // Clear session data
    req.session.promoData = null;

    res.redirect('/airline/dashboard');
});

app.get('/profile', checkAuth, (req, res) => {
    findUserById(req.session.user.id, (user) => {
        if (user) {
            res.render('profile', { user: user, message: null });
        } else {
            res.send('User not found');
        }
    });
});

app.post('/profile', checkAuth, (req, res) => {
    const profileData = {
        company_name: req.body.company_name,
        name: req.body.name,
        logo: req.body.logo,
        country: req.body.country,
        city: req.body.city
    };
    updateUserProfile(req.session.user.id, profileData, (success) => {
        if (success) {
            findUserById(req.session.user.id, (user) => {
                req.session.user = user;
                res.render('profile', { user: user, message: 'Данные успешно изменены' });
            });
        } else {
            res.render('profile', { user: req.session.user, message: 'Упс! Что-то пошло не так.' });
        }
    });
});

// Update and delete promo campaigns
app.get('/airline/edit-promo/:id', checkAuth, (req, res) => {
    const promoId = parseInt(req.params.id);
    const promo = promos.find(p => p.id === promoId);
    res.render('edit-promo', { promo: promo });
});

app.post('/airline/edit-promo/:id', checkAuth, (req, res) => {
    const promoId = parseInt(req.params.id);
    const { name, description, country, city, departure_city, arrival_city, travel_period, commission_agency, commission_agent } = req.body;
    const promo = promos.find(p => p.id === promoId);
    promo.name = name;
    promo.description = description;
    promo.country = country;
    promo.city = city;
    promo.departure_city = departure_city;
    promo.arrival_city = arrival_city;
    promo.travel_period = travel_period;
    promo.commission_agency = commission_agency;
    promo.commission_agent = commission_agent;
    res.redirect('/airline/dashboard');
});

app.post('/airline/delete-promo/:id', checkAuth, (req, res) => {
    const promoId = parseInt(req.params.id);
    const promoIndex = promos.findIndex(p => p.id === promoId);
    if (promoIndex > -1) {
        promos.splice(promoIndex, 1);
    }
    res.redirect('/airline/dashboard');
});

// Agency routes
app.get('/agency/dashboard', checkAuth, (req, res) => {
    res.render('agency-dashboard', { user: req.session.user, promos: promos });
});

app.get('/agency/profile', checkAuth, (req, res) => {
    res.render('profile', { user: req.session.user });
});

app.get('/agency/confirm-agents', checkAuth, (req, res) => {
    if (req.session.user.role !== 'agency') {
        return res.redirect('/auth/login');
    }
    db.all('SELECT * FROM users WHERE role = ? AND agencyId = ? AND status = ?', ['agent', req.session.user.id, 'pending'], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.send('Error retrieving agents.');
        }
        res.render('agency-confirm-agents', { user: req.session.user, agents: rows });
    });
});

app.post('/agency/confirm-agent', checkAuth, (req, res) => {
    if (req.session.user.role !== 'agency') {
        return res.redirect('/auth/login');
    }
    const { agentId } = req.body;
    db.run('UPDATE users SET status = ? WHERE id = ?', ['active', agentId], function(err) {
        if (err) {
            console.error(err.message);
            return res.send('Error confirming agent.');
        }
        res.redirect('/agency/confirm-agents');
    });
});

// Agent routes
app.get('/agent/dashboard', checkAuth, (req, res) => {
    if (req.session.user.status !== 'active') {
        res.send('Ждем подтверждения Агентства');
        return;
    }
    const filteredPromos = promos.filter(promo => 
        promo.country === req.session.user.country || promo.city === req.session.user.city
    );
    res.render('agent-dashboard', { user: req.session.user, promos: promos });
});

app.get('/agent/profile', checkAuth, (req, res) => {
    res.render('profile', { user: req.session.user });
});

// Admin routes
app.get('/admin/dashboard', checkAdmin, (req, res) => {
    res.render('admin-dashboard', { user: req.session.user });
});

app.get('/admin/user-management', checkAdmin, (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('admin-user-management', { user: req.session.user, allUsers: rows });
    });
});

app.post('/admin/verify-user', checkAdmin, (req, res) => {
    const { userId } = req.body;
    findUserById(userId, (user) => {
        if (user) {
            user.status = 'active';
            db.run(`UPDATE users SET status = ? WHERE id = ?`, ['active', userId], function(err) {
                if (err) {
                    console.error(err.message);
                }
                res.redirect('/admin/user-management');
            });
        } else {
            res.send('User not found');
        }
    });
});

app.post('/admin/delete-user', checkAdmin, (req, res) => {
    const { userId } = req.body;
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/admin/user-management');
    });
});

app.get('/admin/promo-management', checkAdmin, (req, res) => {
    res.render('admin-promo-management', { user: req.session.user, promos: promos });
});

app.get('/admin/manage-agents', checkAdmin, (req, res) => {
    getUsersByRole('agent', (agents) => {
        getUsersByRole('agency', (agencies) => {
            res.render('admin-manage-agents', { user: req.session.user, agents: agents, agencies: agencies });
        });
    });
});

app.post('/admin/link-agent', checkAdmin, (req, res) => {
    const { agentId, agencyId } = req.body;
    db.run('UPDATE users SET agencyId = ? WHERE id = ?', [agencyId, agentId], function(err) {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/admin/manage-agents');
    });
});

// Registration routes
app.get('/register-agent', (req, res) => {
    getUsersByRole('agency', (agencies) => {
        res.render('register-agent', { agencies: agencies });
    });
});

app.post('/register-agent', (req, res) => {
    const { name, email, password, country, city, agencyId } = req.body;
    db.run(`INSERT INTO users (username, password, role, name, email, country, city, agencyId, status) 
            VALUES (?, ?, 'agent', ?, ?, ?, ?, ?, 'pending')`, [email, password, name, email, country, city, agencyId], function(err) {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/auth/login');
    });
});

app.get('/register-agency', (req, res) => {
    res.render('register-agency');
});

app.post('/register-agency', (req, res) => {
    const { name, email, password, company_name } = req.body;
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, status) 
            VALUES (?, ?, 'agency', ?, ?, ?, 'pending')`, [email, password, name, email, company_name], function(err) {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/auth/login');
    });
});

app.get('/register-airline', (req, res) => {
    res.render('register-airline');
});

app.post('/register-airline', (req, res) => {
    const { name, email, password, company_name } = req.body;
    db.run(`INSERT INTO users (username, password, role, name, email, company_name, status) 
            VALUES (?, ?, 'airline', ?, ?, ?, 'pending')`, [email, password, name, email, company_name], function(err) {
        if (err) {
            console.error(err.message);
        }
        res.redirect('/auth/login');
    });
});

// Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
