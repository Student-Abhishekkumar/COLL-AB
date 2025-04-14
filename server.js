// backend.js
const express = require('express');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const connectDB = require('./config/db');
const userModel = require('./models/user.model');
const projectModel = require('./models/project.model');
const verifyToken = require('./middleware/TokenVerify');
const user_profile = require('./routes/User-profile.js');
const { name } = require('ejs');
const dashboard = require('./routes/user-dashboard.js');

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage });

function setJwtCookie(res, payload) {
  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 3600000
  });
}



// Routes
app.get('/', (req, res) => res.render('landing'));

app.get('/dashboard', verifyToken, async (req, res) => {
    const projects = await projectModel.find().populate('user').sort({ createdAt: -1 });
    res.render('dashboard', { projects });
  });

//  mentor routes
app.get('/mentor', (req,res)=>{
    res.render('mentor')
}) 


app.get('/project-board', (req, res)=>{
    res.json({
        message: 'Page is under maintenance',
    })
})

// collaboration routes
app.get('/collaborations', (req, res) => {
    res.render('collaboration')
    })


// user-profile routes

  app.use('/', user_profile);  
  app.use('/dashboard', dashboard);

app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup-data', [
  body('name').trim().isLength({ min: 3 }),
  body('username').trim().isLength({ min: 3 }),
  body('email').isEmail(),
  body('number').isLength({ min: 10 }),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, username, email, number, password, interests } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({ name, username, email, number, password: hashedPassword, interests });
    setJwtCookie(res, { email: newUser.email });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/login', (req, res) => res.render('login'));
app.post('/dashboard', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    setJwtCookie(res, { email: user.email });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/upload-project', upload.single('image'), verifyToken, async (req, res) => {
    try {
      const { title, description } = req.body;
      const file = req.file;
  
      if (!file) return res.status(400).json({ message: 'Image is required' });
  
      const fileName = `project-${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage
        .from('coll-ab')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
  
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image upload failed' });
      }
  
      const { data: publicUrlData } = supabase
        .storage
        .from('coll-ab')
        .getPublicUrl(fileName);
  
      const newProject = await projectModel.create({
        title,
        description,
        imageUrl: publicUrlData.publicUrl
      });
  
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });
  
  app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
