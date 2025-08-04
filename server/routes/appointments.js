const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const emailService = require('../services/emailService');
const { authenticateToken, requirePatient, requireDoctor, requireDoctorOrAdmin } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Get available time slots for a doctor on a specific date
router.get('/available-slots/:doctorId/:date', authenticateToken, async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const requestedDate = new Date(date);

    // Check if date is in the future
    if (requestedDate <= new Date()) {
      return res.status(400).json({ message: 'Cannot book appointments for past dates' });
    }

    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const dayName = moment(requestedDate).format('dddd');
    const dayAvailability = doctor.availability.find(av => av.day === dayName);

    if (!dayAvailability) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for that date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Filter available slots
    const availableSlots = dayAvailability.slots.filter(slot => {
      if (!slot.isAvailable) return false;

      // Check if slot is already booked
      const isBooked = existingAppointments.some(appointment => 
        appointment.timeSlot.startTime === slot.startTime
      );

      return !isBooked;
    });

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Server error fetching available slots' });
  }
});

// Book a new appointment
router.post('/book', authenticateToken, requirePatient, [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
  body('type').isIn(['in-person', 'telemedicine']).withMessage('Type must be in-person or telemedicine'),
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { doctorId, appointmentDate, startTime, endTime, type, reason, symptoms } = req.body;
    const patientId = req.user._id;

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ message: 'Cannot book appointments for past dates' });
    }

    // Find doctor and validate
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor || !doctor.isActive || !doctor.isVerified) {
      return res.status(404).json({ message: 'Doctor not available' });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ user: patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Validate time slot availability
    const dayName = moment(appointmentDateTime).format('dddd');
    const dayAvailability = doctor.availability.find(av => av.day === dayName);
    
    if (!dayAvailability) {
      return res.status(400).json({ message: 'Doctor not available on this day' });
    }

    const slot = dayAvailability.slots.find(s => s.startTime === startTime && s.endTime === endTime);
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: 'Time slot not available' });
    }

    // Check for existing appointments at the same time
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      'timeSlot.startTime': startTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      timeSlot: { startTime, endTime },
      type,
      reason,
      symptoms: symptoms || [],
      amount: doctor.consultationFee,
      meetingLink: type === 'telemedicine' ? `https://meet.healthcare.com/room/${Date.now()}` : undefined
    });

    await appointment.save();

    // Populate for email
    await appointment.populate([
      { path: 'patient', model: 'User' },
      { path: 'doctor', populate: { path: 'user', model: 'User' } }
    ]);

    // Send confirmation emails
    await emailService.sendAppointmentConfirmation(appointment, appointment.patient, appointment.doctor);
    await emailService.sendDoctorAppointmentNotification(appointment, appointment.patient, appointment.doctor);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: appointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error booking appointment' });
  }
});

// Get appointments for current user
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    let populateFields = [];

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
      populateFields = [
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ];
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      query.doctor = doctor._id;
      populateFields = [
        { path: 'patient', select: 'firstName lastName email phone' }
      ];
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate(populateFields)
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: skip + appointments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// Get specific appointment details
router.get('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    const hasAccess = 
      (req.user.role === 'patient' && appointment.patient._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && appointment.doctor.user._id.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error fetching appointment' });
  }
});

// Cancel appointment
router.put('/:appointmentId/cancel', authenticateToken, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Cancellation reason must be less than 500 characters')
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user can cancel this appointment
    const canCancel = 
      (req.user.role === 'patient' && appointment.patient._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && appointment.doctor.user._id.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Appointment cannot be cancelled. Cancellation must be done at least 24 hours before the appointment.' 
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = reason;
    await appointment.save();

    // Send cancellation emails
    await emailService.sendAppointmentCancellation(appointment, appointment.patient, appointment.doctor, reason);

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
});

// Update appointment status (doctor only)
router.put('/:appointmentId/status', authenticateToken, requireDoctor, [
  body('status').isIn(['confirmed', 'in-progress', 'completed', 'no-show']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if this doctor owns the appointment
    if (appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment
    appointment.status = status;
    if (notes) {
      appointment.notes.doctor = notes;
    }

    await appointment.save();

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Server error updating appointment status' });
  }
});

// Add prescription to appointment (doctor only)
router.put('/:appointmentId/prescription', authenticateToken, requireDoctor, [
  body('prescription').isArray().withMessage('Prescription must be an array'),
  body('prescription.*.medication').trim().isLength({ min: 1 }).withMessage('Medication name is required'),
  body('prescription.*.dosage').trim().isLength({ min: 1 }).withMessage('Dosage is required'),
  body('prescription.*.frequency').trim().isLength({ min: 1 }).withMessage('Frequency is required'),
  body('diagnosis').optional().trim().isLength({ max: 1000 }).withMessage('Diagnosis must be less than 1000 characters')
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { prescription, diagnosis } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if this doctor owns the appointment
    if (appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment
    appointment.prescription = prescription;
    if (diagnosis) {
      appointment.diagnosis = diagnosis;
    }

    await appointment.save();

    res.json({
      message: 'Prescription added successfully',
      appointment
    });
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).json({ message: 'Server error adding prescription' });
  }
});

// Get appointment statistics (admin/doctor)
router.get('/stats/overview', authenticateToken, requireDoctorOrAdmin, async (req, res) => {
  try {
    let matchQuery = {};

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      matchQuery.doctor = doctor._id;
    }

    const stats = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAppointments = await Appointment.countDocuments(matchQuery);
    
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayAppointments = await Appointment.countDocuments({
      ...matchQuery,
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });

    res.json({
      totalAppointments,
      todayAppointments,
      statusBreakdown: stats,
      stats: {
        scheduled: stats.find(s => s._id === 'scheduled')?.count || 0,
        confirmed: stats.find(s => s._id === 'confirmed')?.count || 0,
        completed: stats.find(s => s._id === 'completed')?.count || 0,
        cancelled: stats.find(s => s._id === 'cancelled')?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ message: 'Server error fetching appointment stats' });
  }
});

module.exports = router;