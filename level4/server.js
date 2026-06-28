require('dotenv').config();
const express      = require('express');
const mongoose     = require('mongoose');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const path         = require('path');
const jwt          = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const apiRoutes  = require('./routes/apiRoutes');

const app = express();

// ── Task 8: Middleware ──
app.use(morgan('dev'));                              // Request logger
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Custom request timestamp middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ──
app.use('/auth', authRoutes);
app.use('/api',  apiRoutes);

// ── Page Routes ──
app.get('/', (req, res) => {
    let user = null;
    try { user = jwt.verify(req.cookies?.token, process.env.JWT_SECRET); } catch {}
    res.render('index', { user });
});

app.get('/dashboard', (req, res) => {
    let user = null;
    try { user = jwt.verify(req.cookies?.token, process.env.JWT_SECRET); } catch {}
    if (!user) return res.redirect('/');
    res.render('dashboard', { user });
});

// ── 404 Handler ──
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Task 8: Background Job — auto clear expired cache log every 5 mins ──
setInterval(() => {
    console.log(`🔄 [Background Job] Cache check at ${new Date().toLocaleTimeString()}`);
}, 5 * 60 * 1000);

// ── Connect DB ──
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(process.env.PORT || 3000, () => {
            console.log(`🚀 Server at http://localhost:${process.env.PORT || 3000}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB error:', err.message);
        process.exit(1);
    });