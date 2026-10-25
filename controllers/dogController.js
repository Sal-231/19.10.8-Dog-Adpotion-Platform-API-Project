const Dog = require('../models/dogModel');
const mongoose = require('mongoose');

module.exports.register_post = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        // Validate the request body
        if (
            typeof name !== 'string' ||
            typeof description !== 'string' ||
            !name.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                error: 'Name and description are required'
            });
        }

        // Create the dog and associate it with the logged-in user
        const dog = await Dog.create({
            name: name.trim(),
            description: description.trim(),
            owner: req.userId
        });

        return res.status(201).json({
            message: 'Dog registered successfully',
            dog
        });
    } catch (err) {
        next(err);
    }
};

module.exports.adopt_post = async (req, res, next) => {
    try {
        const { id } = req.body;
        const { thankYouMessage } = req.body;

        // Validate dog ID
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid dog ID'
            });
        }

        // Validate thank you message
        if (
            typeof thankYouMessage !== 'string' ||
            !thankYouMessage.trim()
        ) {
            return res.status(400).json({
                error: 'A thank-you message is required'
            });
        }

        if (thankYouMessage.trim().length > 1000) {
            return res.status(400).json({
                error: 'Thank-you message cannot exceed 1000 characters'
            });
        }

        // Find the dog by ID
        const Dog = require('../models/dogModel');

        // Find the dog first so we can provide specific errors.
        const existingDog = await Dog.findById(id);
        
        // Check if the dog exists
        if (!existingDog) {
            return res.status(404).json({
                error: 'Dog not found'
            });
        }
        
        if (existingDog.owner.toString() === req.userId.toString()) {
            return res.status(403).json({
                error: 'You cannot adopt a dog you registered'
            });
        }

        // Atomically adopt only if the dog is still available.
        const adoptedDog = await Dog.findOneAndUpdate(
            {
                _id: id,
                status: 'available',
                owner: { $ne: req.userId }
            },
            {
                $set: {
                    status: 'adopted',
                    adoptedBy: req.userId,
                    thankYouMessage: thankYouMessage.trim(),
                    adoptedAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!adoptedDog) {
            return res.status(409).json({
                error: 'This dog has already been adopted'
            });
        }

        return res.status(200).json({
            message: 'Dog adopted successfully',
            dog: adoptedDog
        });

    } catch (err) {
        console.error(err);
        return next(err);
    }
}

module.exports.delete_dog = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate the dog ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid dog ID'
            });
        }

        // Find the dog
        const dog = await Dog.findById(id);

        if (!dog) {
            return res.status(404).json({
                error: 'Dog not found'
            });
        }

        // Only the owner of the dog can delete it
        if(dog.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                error: 'You are not authorized to delete this dog'
            })
        }

        // Adopted dogs cannot be deleted
        if(dog.status === 'adopted') {
            return res.status(403).json({
                error: 'Adopted dogs cannot be deleted'
            });
        }

        // Delete the dog only if it is still available
        const deletedDog = await Dog.findOneAndDelete({
            _id: id,
            status: 'available'
        });
        if (!deletedDog) {
            return res.status(409).json({
                error: 'This dog has already been adopted or deleted'
            });
        }

        return res.status(200).json({
            message: 'Dog removed successfully',
            dog: deletedDog
        });

    } catch (err) {
        return next(err);
    }
}

module.exports.get_my_dogs = async (req, res, next) => {
    try {
        const { status, page = '1', limit = '10' } = req.query;

        // Validate status filter
        if (
            status !== undefined &&
            !['available', 'adopted'].includes(status)
        ) {
            return res.status(400).json({
                error: 'Status must be available or adopted'
            });
        }

        // Validate pagination parameters
        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                error: 'Page must be positive and limit must be between 1 and 100'
            });
        }

        // Only retrieve dogs registered by the authenticated user
        const filter = {
            owner: req.userId
        };

        if (status) {
            filter.status = status;
        }

        const [dogs, total] = await Promise.all([
            Dog.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .lean(),

            Dog.countDocuments(filter)
        ]);

        return res.status(200).json({
            dogs,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (err) {
        return next(err);
    }
}

module.exports.get_adopted_dogs = async (req, res, next) => {
    try {
        const { page = '1', limit = '10' } = req.query;

        // Validate pagination parameters
        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                error: 'Page must be positive and limit must be between 1 and 100'
            });
        }

        // Find dogs adopted by the authenticated user
        const filter = {
            adoptedBy: req.userId,
            status: 'adopted'
        };

        const [dogs, total] = await Promise.all([
            Dog.find(filter)
                .sort({ adoptedAt: -1, _id: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .lean(),

            Dog.countDocuments(filter)
        ]);

        return res.status(200).json({
            dogs,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (err) {
        return next(err);
    }
};