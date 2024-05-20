const express = require('express');
const router = express.Router();
const users = require('../models/user');

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user && user.status === 'active') {
        req.session.user = user;
        res.redirect('/dashboard');
    } else {
        res.send('Invalid login credentials or inactive account');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
