const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

// GET /api/users → fetch all users (protected)
router.get('/users', protect, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/users/:id → fetch one user (protected)
router.get('/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/users/:id → update own profile (protected)
router.put('/users/:id', protect, async (req, res) => {
    try {
        if (req.user.id !== req.params.id)
            return res.status(403).json({ success: false, message: 'Forbidden. You can only edit your own profile.' });

        const { name, age, phone, gender } = req.body;
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { name, age, phone, gender },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Profile updated!', user: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/users/:id → delete own account (protected)
router.delete('/users/:id', protect, async (req, res) => {
    try {
        if (req.user.id !== req.params.id)
            return res.status(403).json({ success: false, message: 'Forbidden.' });

        await User.findByIdAndDelete(req.params.id);
        res.clearCookie('token');
        res.json({ success: true, message: 'Account deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;