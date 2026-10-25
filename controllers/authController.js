// This file contains the logic for the authentication routes (signup and login). Including error handling and JWT token creation.

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');


// Responds with JSON object containing error message for validation failures (from userModel.js).
const handelErrors = (err) => {
    //console.log(err.message, err.code);
    const errors = { email: '', password: '' };

    // Incorrect email
    if (err.message === 'Incorrect email') {
        errors.email = 'That email is not registered';
    }

    // Incorrect password
    if (err.message === 'Incorrect password') {
        errors.password = 'That password is incorrect';
    }


    // Duplicate error code
    if (err.code === 11000) {
        errors.email = 'That email is already registered';
        return errors;
    }

    // Validation errors for each error
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message;
        });
    }
    return errors;
}

const createToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {expiresIn: '24h' });
}

module.exports.signup_get = (req, res) => {
    res.render('signup');
}

module.exports.signup_post = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate the request body
        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password.trim()
        ) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Waits for user to be created then added to database if successful
        const user = await User.create({
            email,
            password
        });
        // Creates JWT token for user and sets it as a cookie in the response
        const token = createToken(user._id);

        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                error: 'Email is already registered'
            });
        }

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: Object.values(err.errors).map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        return next(err);
    }
}

module.exports.login_get = (req, res) => {
    res.render('login');
}

module.exports.login_post = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const user = await User.login(email.trim(), password);
        const token = createToken(user._id);

        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        if (
            err.message === 'Incorrect email' ||
            err.message === 'Incorrect password'
        ) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        return next(err);
    }
}

module.exports.logout_get = (req, res) => {
    res.clearCookie('jwt', {
    httpOnly: true,
    path: '/'
});
    res.redirect('/'); // Redirects the user to the home page after logging out
}