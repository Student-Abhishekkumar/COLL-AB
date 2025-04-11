const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const userModel = require('./models/user.model');
const verifyToken = require('./middleware/TokenVerify');
const cloudinary = require('cloudinary')

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// landing page
app.get('/', (req, res) => {
    res.render('landing')
})

// for signup
app.get('/signup', (req, res) => {
    res.render('signup');
});

//  get signup data
app.post('/signup-data', (req, res)=>{
    const {name, username, email, number, password, interests} = req.body;
    console.log(name, username, email, number, password, interests);
    res.json({message: "data sended....."})
    
})

// login page render
app.get('/login', (req, res) => {
    res.render('login');
    })

// get login data
app.post('/login-data', (req, res) => {
    const {email, password} = req.body;
    console.log(email, password);
    res.json({message: "login data sended......."})
    })


// forgot password page render
app.get('/forgot', (req, res) => {
    res.render('forgot')
    })
    

app.get('/login', verifyToken, (req, res) => {
    res.render('home', { user: req.user });
});

// ✅ Function to set JWT token in cookie
function setJwtCookie(res, payload) {
    const token = jwt.sign(payload, process.env.SECRET_KEY  , { expiresIn: '1h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: false, // true in production with HTTPS
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    });
}
app.get('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: false // true if using HTTPS in production
    });
    return res.redirect('/');
});

// ✅ Signup Route
app.post('/',
    body('name').trim().isLength({ min: 3 }),
    body('email').trim().isEmail().isLength({ min: 10 }),
    body('password').trim().isLength({ min: 5 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Invalid input'
            });
        }

        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const Exist_email = await userModel.findOne({ email: email });
        if (Exist_email) {
            return res.status(400).json({ message: "Email already exist" });
        }

        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword
        });

        console.log({ name, email });

        setJwtCookie(res, { email: newUser.email });
        res.render('home');
        
    }
);

// ✅ Login Route
app.post('/login',
    body('email').trim().isEmail().isLength({ min: 10 }),
    body('password').trim().isLength({ min: 5 }),
    async (req, res) => {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
                errors: error.array(),
                message: 'Invalid input'
            });
        }

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid email or password' }]
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid email or password' }]
            });
        }

        console.log({ email });

        setJwtCookie(res, { email: user.email });
        res.render('home');
    }
);

// ✅ Server Start
app.listen(process.env.PORT || 3000, () => {
    console.log("server is running on port 3000");
});
