const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, age, phone, gender } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2)
        errors.push('Name must be at least 2 characters.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email))
        errors.push('Valid email is required.');

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passRegex.test(password))
        errors.push('Password must be 8+ chars with uppercase, lowercase, number & special character.');

    if (errors.length > 0)
        return res.status(400).json({ success: false, errors });

    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing)
            return res.status(409).json({ success: false, errors: ['Email already registered.'] });

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashed,
            age: age ? parseInt(age) : undefined,
            phone: phone?.trim(),
            gender
        });

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, errors: ['Server error. Try again.'] });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ success: false, errors: ['Email and password are required.'] });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(401).json({ success: false, errors: ['Invalid email or password.'] });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ success: false, errors: ['Invalid email or password.'] });

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            message: 'Login successful!',
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, errors: ['Server error.'] });
    }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out.' });
});

module.exports = router;