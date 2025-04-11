// middlewares/verifyToken.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, "chrono"); // Secret key
        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = user; // Attach user to request
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
    }
};

module.exports = verifyToken;
