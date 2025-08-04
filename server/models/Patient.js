const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
      prescribedBy: String
    }],
    surgeries: [{
      procedure: String,
      date: Date,
      hospital: String,
      surgeon: String,
      notes: String
    }],
    familyHistory: [{
      relation: String,
      condition: String,
      notes: String
    }]
  },
  vitals: {
    height: {
      value: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        default: 'kg'
      }
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date,
    copay: Number
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  preferredDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  medicalReports: [{
    title: String,
    type: {
      type: String,
      enum: ['lab', 'imaging', 'prescription', 'diagnosis', 'other']
    },
    date: Date,
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    fileUrl: String,
    notes: String
  }],
  preferences: {
    communicationMethod: {
      type: String,
      enum: ['email', 'sms', 'phone', 'app'],
      default: 'email'
    },
    reminderTime: {
      type: Number,
      default: 24 // hours before appointment
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true
});

// Indexes
patientSchema.index({ user: 1 });
patientSchema.index({ 'medicalHistory.allergies': 1 });
patientSchema.index({ 'vitals.bloodType': 1 });

// Calculate BMI
patientSchema.virtual('bmi').get(function() {
  if (this.vitals.height?.value && this.vitals.weight?.value) {
    const heightInMeters = this.vitals.height.value / 100;
    return Math.round((this.vitals.weight.value / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  return null;
});

// Get BMI category
patientSchema.methods.getBMICategory = function() {
  const bmi = this.bmi;
  if (!bmi) return 'Unknown';
  
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

module.exports = mongoose.model('Patient', patientSchema);