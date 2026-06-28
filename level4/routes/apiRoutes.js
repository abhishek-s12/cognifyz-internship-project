const express     = require('express');
const router      = express.Router();
const axios       = require('axios');
const rateLimit   = require('express-rate-limit');
const NodeCache   = require('node-cache');
const User        = require('../models/User');
const protect     = require('../middleware/authMiddleware');

// Cache instance — TTL 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

// Rate limiter — 20 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many requests. Please wait a minute.' }
});

router.use(limiter);

// ── GET /api/users ──
router.get('/users', protect, async (req, res) => {
    try {
        const cacheKey = 'all_users';
        const cached   = cache.get(cacheKey);

        if (cached) {
            return res.json({ success: true, source: 'cache', count: cached.length, users: cached });
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 });
        cache.set(cacheKey, users);

        res.json({ success: true, source: 'database', count: users.length, users });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── GET /api/users/:id ──
router.get('/users/:id', protect, async (req, res) => {
    try {
        const cacheKey = `user_${req.params.id}`;
        const cached   = cache.get(cacheKey);

        if (cached)
            return res.json({ success: true, source: 'cache', user: cached });

        const user = await User.findById(req.params.id).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found.' });

        cache.set(cacheKey, user);
        res.json({ success: true, source: 'database', user });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── PUT /api/users/:id ──
router.put('/users/:id', protect, async (req, res) => {
    try {
        if (req.user.id !== req.params.id)
            return res.status(403).json({ success: false, message: 'Forbidden.' });

        const { name, age, phone, gender } = req.body;
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { name, age, phone, gender },
            { new: true }
        ).select('-password');

        // Invalidate cache on update
        cache.del('all_users');
        cache.del(`user_${req.params.id}`);

        res.json({ success: true, message: 'Profile updated!', user: updated });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── DELETE /api/users/:id ──
router.delete('/users/:id', protect, async (req, res) => {
    try {
        if (req.user.id !== req.params.id)
            return res.status(403).json({ success: false, message: 'Forbidden.' });

        await User.findByIdAndDelete(req.params.id);
        cache.del('all_users');
        cache.del(`user_${req.params.id}`);
        res.clearCookie('token');
        res.json({ success: true, message: 'Account deleted.' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── GET /api/weather/:city — External API + Cache ──
router.get('/weather/:city', protect, async (req, res) => {
    const city     = req.params.city.trim();
    const cacheKey = `weather_${city.toLowerCase()}`;
    const cached   = cache.get(cacheKey);

    if (cached)
        return res.json({ success: true, source: 'cache', weather: cached });

    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q:     city,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            },
            timeout: 5000
        });

        const d = response.data;
        const weather = {
            city:        d.name,
            country:     d.sys.country,
            temp:        d.main.temp,
            feels_like:  d.main.feels_like,
            humidity:    d.main.humidity,
            description: d.weather[0].description,
            icon:        d.weather[0].icon,
            wind:        d.wind.speed
        };

        cache.set(cacheKey, weather, 300); // Cache 5 minutes
        res.json({ success: true, source: 'api', weather });

    } catch (err) {
        if (err.response?.status === 404)
            return res.status(404).json({ success: false, message: `City "${city}" not found.` });
        if (err.code === 'ECONNABORTED')
            return res.status(504).json({ success: false, message: 'Weather API timeout.' });
        return res.status(500).json({ success: false, message: 'Failed to fetch weather data.' });
    }
});

// ── GET /api/cache/stats — Cache stats ──
router.get('/cache/stats', protect, (req, res) => {
    const stats = cache.getStats();
    const keys  = cache.keys();
    res.json({ success: true, stats, cachedKeys: keys });
});

module.exports = router;