const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    // Invalid JSON request body
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        'body' in err
    ) {
        return res.status(400).json({
            error: 'Invalid JSON payload'
        });
    }

    // Invalid MongoDB document ID
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    // Mongoose validation errors
    if (err instanceof mongoose.Error.ValidationError) {
        const details = Object.values(err.errors).map(
            error => ({
                field: error.path,
                message: error.message
            })
        );

        return res.status(400).json({
            error: 'Validation failed',
            details
        });
    }

    // Duplicate unique field
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'A record with that value already exists'
        });
    }

    // Unexpected error
    console.error(err);

    return res.status(500).json({
        error: 'Internal server error'
    });
};

module.exports = errorHandler;