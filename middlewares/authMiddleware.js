// Replace this file with custom middleware functions, including authentication and rate limiting

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware function to check if the user is authenticated
const requireAuth = (req, res, next) => {
    // Support the existing JWT cookie and API bearer tokens.
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies?.jwt;

    if (!token) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decodedToken.id;
        return next();
    } catch (err) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}

// Check if the user is logged in
const checkUser = async (req, res, next) => {
    const token = await req.cookies.jwt;

    if (!token) {
        res.locals.user = null; // Set user to null if token is not present
        return next(); // Proceed to the next middleware or route handler if token is not present
    }

    jwt.verify(token, 'HahaSecretHere', async (err, decodedToken) => {
        if (err) {
            console.log(err.message);
            res.locals.user = null;; // Set user to null if token is invalid
            return next(); // Proceed to the next middleware or route handler if token is invalid
        }
        try {
            console.log(decodedToken);
            const user = await User.findById(decodedToken.id);
            res.locals.user = user || null; // Store the user in res.locals for access in views
            return next(); // Proceed to the next middleware or route handler if token is valid
        } catch (err) {
            return next(err);
        }
    })
}

module.exports = { requireAuth, checkUser };