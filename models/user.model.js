const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true,
        minlenght: [3, 'Name must be at least 3 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: [true, 'Email already exists'],
        trim: true,
        minlenght: [10, 'Email must be at least 10 characters']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        trim: true,
        minlenght: [8, 'Password must be at least 8 characters']

    }
})
const user = mongoose.model('user', userSchema);

module.exports = user;


