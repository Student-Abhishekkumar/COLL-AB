const express = require('express');
const router = express.Router();
const User = require('../models/user.model.js');
const verifyToken = require('../middleware/TokenVerify'); // 🛡️

router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const { email } = req.user; // 🧠 from token

        const user = await User.findOne({ email }); // 🎯 find by email

        if (!user) return res.status(404).send('User not found');

        res.render('dashboard.ejs', { user }); // 💡 pass user to EJS
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;