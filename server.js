const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const userModel = require('./models/user.model');
const verifyToken = require('./middleware/TokenVerify');
const cloudinary = require('cloudinary');

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Landing page
app.get('/', (req, res) => {
  res.render('landing');
});

// Dashboard
app.get('/dashboard', verifyToken, (req, res) => {
  res.render('dashboard');
});

// Signup page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Signup handler
app.post(
  '/signup-data',
  [
    body('name').trim().isLength({ min: 3 }),
    body('username').trim().isLength({ min: 3 }),
    body('email').trim().isEmail().isLength({ min: 10 }),
    body('number').trim().isLength({ min: 10 }),
    body('password').trim().isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Invalid input' });
    }

    const { name, username, email, number, password, interests } = req.body;

    try {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await userModel.create({
        name,
        username,
        email,
        number,
        password: hashedPassword,
        interests,
      });

      console.log({ name, username, email, number });
      setJwtCookie(res, { email: newUser.email });
      res.render('dashboard');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Login handler
app.post(
  '/dashboard',
  [
    body('email').trim().isEmail().isLength({ min: 10 }),
    body('password').trim().isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Invalid input' });
    }

    const { email, password } = req.body;

    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid email or password' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid email or password' }] });
      }

      console.log({ email });
      setJwtCookie(res, { email: user.email });
      res.render('dashboard');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Forgot password
app.get('/forgot', (req, res) => {
  res.render('forgot');
});

// Verify OTP (mock)
app.get('/verify-otp', (req, res) => {
  const { otp } = req.body;
  res.send('Password is reset successfully. Check your mail...');
});

// Protected Home route
app.get('/landing', verifyToken, (req, res) => {
  res.render('landing', { user: req.user });
});

// JWT Cookie Setter
function setJwtCookie(res, payload) {
  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  });
}

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
  });
  return res.redirect('/');
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port 3000');
});
