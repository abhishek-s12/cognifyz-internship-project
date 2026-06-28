const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (!token)
        return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

module.exports = protect;