const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  },
  type: {
    type: String,
    enum: ['in-person', 'telemedicine'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  symptoms: [{
    type: String
  }],
  notes: {
    patient: String,
    doctor: String
  },
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  diagnosis: {
    type: String
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String
  },
  transactionId: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  },
  rating: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    doctorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    patientFeedback: String,
    doctorFeedback: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ type: 1 });

// Virtual for appointment duration
appointmentSchema.virtual('duration').get(function() {
  if (this.timeSlot.startTime && this.timeSlot.endTime) {
    const start = new Date(`2000-01-01T${this.timeSlot.startTime}`);
    const end = new Date(`2000-01-01T${this.timeSlot.endTime}`);
    return Math.abs(end - start) / (1000 * 60); // duration in minutes
  }
  return 0;
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const timeDiff = appointmentDateTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff > 24 && this.status === 'scheduled';
};

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  return appointmentDateTime > now && ['scheduled', 'confirmed'].includes(this.status);
};

module.exports = mongoose.model('Appointment', appointmentSchema);