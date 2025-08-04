const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendAppointmentConfirmation, sendAppointmentReminder, sendAppointmentCancellation } = require('../utils/emailService');

const router = express.Router();

// Get all appointments (filtered by user role)
router.get('/', auth, async (req, res) => {
  try {
    let appointments;
    const { status, date, page = 1, limit = 10 } = req.query;

    const query = {};
    const skip = (page - 1) * limit;

    // Filter by user role
    if (req.user.role === 'doctor') {
      query.doctorId = req.user.userId;
    } else if (req.user.role === 'patient') {
      query.patientId = req.user.userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone'
        }
      })
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single appointment
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone'
        }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    if (req.user.role !== 'admin' && 
        appointment.patientId._id.toString() !== req.user.userId && 
        appointment.doctorId.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new appointment
router.post('/', auth, [
  body('doctorId').isMongoId(),
  body('appointmentDate').isISO8601(),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
  body('reason').notEmpty().trim(),
  body('appointmentType').isIn(['in-person', 'telemedicine', 'follow-up', 'emergency'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      symptoms,
      notes,
      appointmentType
    } = req.body;

    // Check if doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({ message: 'Doctor is not available for appointments' });
    }

    // Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: req.user.userId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      reason,
      symptoms,
      notes,
      appointmentType,
      amount: doctor.consultationFee
    });

    await appointment.save();

    // Populate appointment with user details
    await appointment.populate('patientId', 'firstName lastName email');
    await appointment.populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: 'firstName lastName email'
      }
    });

    // Send confirmation email
    try {
      await sendAppointmentConfirmation(appointment);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.patch('/:id/status', auth, [
  body('status').isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']),
  body('cancellationReason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, cancellationReason, doctorNotes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to update
    if (req.user.role !== 'admin' && 
        appointment.patientId.toString() !== req.user.userId && 
        appointment.doctorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = new Date();
    }

    if (doctorNotes && req.user.role === 'doctor') {
      appointment.doctorNotes = doctorNotes;
    }

    await appointment.save();

    // Send appropriate email notifications
    try {
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        await sendAppointmentCancellation(appointment);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment (prescription, notes, etc.)
router.put('/:id', auth, async (req, res) => {
  try {
    const { prescription, doctorNotes, symptoms, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only doctors can update prescription and doctor notes
    if (req.user.role === 'doctor') {
      if (prescription) appointment.prescription = prescription;
      if (doctorNotes) appointment.doctorNotes = doctorNotes;
    }

    // Patients can update their symptoms and notes
    if (req.user.role === 'patient') {
      if (symptoms) appointment.symptoms = symptoms;
      if (notes) appointment.notes = notes;
    }

    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a doctor
router.get('/available-slots/:doctorId', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const { doctorId } = req.params;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const availability = doctor.availability[dayOfWeek];

    if (!availability.isAvailable) {
      return res.json({ slots: [] });
    }

    // Generate time slots
    const slots = [];
    const startTime = new Date(`2000-01-01T${availability.start}`);
    const endTime = new Date(`2000-01-01T${availability.end}`);
    const duration = doctor.consultationDuration;

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      if (slotEnd <= endTime) {
        slots.push({
          start: currentTime.toTimeString().slice(0, 5),
          end: slotEnd.toTimeString().slice(0, 5)
        });
      }
      currentTime = slotEnd;
    }

    // Filter out booked slots
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    const bookedSlots = bookedAppointments.map(apt => ({
      start: apt.startTime,
      end: apt.endTime
    }));

    const availableSlots = slots.filter(slot => {
      return !bookedSlots.some(booked => 
        (slot.start >= booked.start && slot.start < booked.end) ||
        (slot.end > booked.start && slot.end <= booked.end) ||
        (slot.start <= booked.start && slot.end >= booked.end)
      );
    });

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;