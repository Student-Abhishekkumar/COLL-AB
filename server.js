const express = require('express')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express()
app.use(cookieParser());

const { body, validationResult } = require('express-validator')
const dotenv = require('dotenv')
dotenv.config()
const connectDB = require('./config/db')
connectDB()
const bcrypt = require('bcrypt')
const userModel = require('./models/user.model')


app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
    res.render('index')
})




// signup validations 
app.post('/',
    body('name').trim().isLength(3),
    body('email').trim().isEmail().isLength(10),
    body('password').trim().isLength(5),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Invalid input'
            })
        }
        const { name, email, password } = req.body

        // password hashing....
        const hashedPassword = await bcrypt.hash(password, 10)

        // email validation... for existing 
        const Exist_email = await userModel.findOne({ email: email })
        if (Exist_email) {
            return res.status(400).json({ message: "Email already exist" })
        }
        await userModel.create({
            name: name,
            email: email,
            password: hashedPassword
        })
        console.log({
            name,
            email,
            password
        });

        res.render('home')

    })


// login validations
app.post('/login',
    body('email').trim().isEmail().isLength(10),
    body('password').trim().isLength(5),
    async (req, res) => {
        const error = validationResult(req)
        if (!error.isEmpty()) {
            return res.status(400).json({
                errors: error.array(),
                message: 'invalid input'
            })
        }

        const { email, password } = req.body;

        const user = await userModel.findOne({ email: email });
        if (!user) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid email or password' }],
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                errors: [{ msg: 'Invalid email or password' }],
            });
        }

        // ✅ Set JWT token in cookie after successful login
        setJwtCookie(res, { name: user.name, email: user.email });

        res.render('home');
    });

// ✅ Define function outside (anywhere in global scope)
function setJwtCookie(res, payload) {
    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: false, // true in production with HTTPS
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    });
}


app.listen(process.env.PORT, () => {
    console.log("server is running on port 3000");

})