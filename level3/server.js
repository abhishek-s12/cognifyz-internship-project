require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const apiRoutes  = require('./routes/apiRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount routes
app.use('/auth', authRoutes);
app.use('/api',  apiRoutes);

// Page routes
app.get('/', (req, res) => {
    const token = req.cookies?.token;
    let user = null;
    if (token) {
        try { user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
    }
    res.render('index', { user });
});

app.get('/dashboard', (req, res) => {
    const token = req.cookies?.token;
    let user = null;
    if (token) {
        try { user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
    }
    if (!user) return res.redirect('/');
    res.render('dashboard', { user });
});

// Connect DB then start server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(process.env.PORT || 3000, () => {
            console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3000}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });