// This file contains the user model for the authentication routes (signup and login)
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

// Arrays in email and password fields provide custom error messages if validation failures.
const userSchema = new mongoose.Schema({
    
    email: {
        type: String, 
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'please enter a valid email']
    },
    password: {
        type: String, 
        required: [true, 'Please enter a password'],
        minLength: [8, 'Minimum password length is 8 characters']
    }
});

// Fires after a doc is saved to the database
userSchema.post('save', function(doc, next) {
    console.log('New user was created and saved', doc);
    next();
});

// Fires before a doc is saved to the database. No "next" due to bcrypt being asynchronous.
userSchema.pre('save', async function() {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
}); 

// method to login user
userSchema.statics.login = async function(email, password) {
    const user = await this.findOne({ email });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
        throw Error('Incorrect password');
    }
    throw Error('Incorrect email');
}

const User = mongoose.model('user', userSchema);
module.exports = User;