const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuingOrganization: String,
    year: Number,
    expiryDate: Date
  }],
  languages: [{
    type: String,
    trim: true
  }],
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    monday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    },
    tuesday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    },
    wednesday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    },
    thursday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    },
    friday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    },
    saturday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    },
    sunday: {
      start: String,
      end: String,
      isAvailable: { type: Boolean, default: false }
    }
  },
  consultationDuration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  hospitalAffiliations: [{
    name: String,
    position: String,
    from: Date,
    to: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  return this.userId ? `${this.userId.firstName} ${this.userId.lastName}` : '';
});

// Ensure virtual fields are serialized
doctorSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Doctor', doctorSchema);