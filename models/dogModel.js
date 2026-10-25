const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },

    status: {
      type: String,
      enum: ['available', 'adopted'],
      default: 'available'
    },

    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null
    },

    thankYouMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null
    },

    adoptedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('dog', dogSchema);