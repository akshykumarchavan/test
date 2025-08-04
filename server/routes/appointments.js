const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requireDoctor, requirePatient } = require('../middleware/auth');
const { sendAppointmentEmail } = require('../services/emailService');
const moment = require('moment');

const router = express.Router();

// Get all appointments (filtered by user role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let appointments;
    
    if (req.user.role === 'doctor') {
      // Get doctor's appointments
      appointments = await getAll(`
        SELECT 
          a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
          a.symptoms, a.diagnosis, a.prescription, a.notes, a.created_at,
          p.user_id as patient_user_id,
          u.first_name as patient_first_name, u.last_name as patient_last_name,
          u.email as patient_email, u.phone as patient_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE d.user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [req.user.id]);
    } else if (req.user.role === 'patient') {
      // Get patient's appointments
      appointments = await getAll(`
        SELECT 
          a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
          a.symptoms, a.diagnosis, a.prescription, a.notes, a.created_at,
          d.user_id as doctor_user_id,
          u.first_name as doctor_first_name, u.last_name as doctor_last_name,
          u.email as doctor_email, doc.specialization
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        JOIN doctors doc ON d.id = doc.id
        WHERE p.user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `, [req.user.id]);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

// Book new appointment
router.post('/', authenticateToken, requirePatient, [
  body('doctorId').isInt(),
  body('appointmentDate').isISO8601(),
  body('appointmentTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('symptoms').optional().isString(),
  body('duration').optional().isInt({ min: 15, max: 120 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, appointmentDate, appointmentTime, symptoms, duration = 30 } = req.body;

    // Check if date is in the future
    const appointmentDateTime = moment(`${appointmentDate} ${appointmentTime}`);
    if (appointmentDateTime.isBefore(moment())) {
      return res.status(400).json({ error: 'Appointment date must be in the future' });
    }

    // Get patient ID
    const patient = await getRow('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    // Check if doctor exists
    const doctor = await getRow('SELECT id FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check for time conflicts
    const conflictingAppointment = await getRow(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'
    `, [doctorId, appointmentDate, appointmentTime]);

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot is already booked' });
    }

    // Create appointment
    const result = await runQuery(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, duration, symptoms)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [patient.id, doctorId, appointmentDate, appointmentTime, duration, symptoms]);

    // Get appointment details for email
    const appointment = await getRow(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.symptoms,
        u.first_name as patient_first_name, u.last_name as patient_last_name, u.email as patient_email,
        doc.first_name as doctor_first_name, doc.last_name as doctor_last_name, doc.email as doctor_email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc ON d.user_id = doc.id
      WHERE a.id = ?
    `, [result.id]);

    // Send email notifications
    if (process.env.EMAIL_ENABLED === 'true') {
      try {
        await sendAppointmentEmail(appointment, 'confirmation');
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        id: result.id,
        appointmentDate,
        appointmentTime,
        symptoms
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Update appointment status (doctor only)
router.put('/:id/status', authenticateToken, requireDoctor, [
  body('status').isIn(['confirmed', 'completed', 'cancelled', 'no_show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if appointment exists and belongs to this doctor
    const appointment = await getRow(`
      SELECT a.*, d.user_id as doctor_user_id
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ? AND d.user_id = ?
    `, [id, req.user.id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment status
    await runQuery(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Send email notification for status change
    if (process.env.EMAIL_ENABLED === 'true') {
      try {
        const appointmentDetails = await getRow(`
          SELECT 
            a.id, a.appointment_date, a.appointment_time, a.status,
            u.first_name as patient_first_name, u.last_name as patient_last_name, u.email as patient_email,
            doc.first_name as doctor_first_name, doc.last_name as doctor_last_name, doc.email as doctor_email
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users u ON p.user_id = u.id
          JOIN doctors d ON a.doctor_id = d.id
          JOIN users doc ON d.user_id = doc.id
          WHERE a.id = ?
        `, [id]);
        
        await sendAppointmentEmail(appointmentDetails, 'status_update');
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.json({ message: 'Appointment status updated successfully' });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// Update appointment details (doctor only)
router.put('/:id', authenticateToken, requireDoctor, [
  body('diagnosis').optional().isString(),
  body('prescription').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { diagnosis, prescription, notes } = req.body;

    // Check if appointment exists and belongs to this doctor
    const appointment = await getRow(`
      SELECT a.*, d.user_id as doctor_user_id
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ? AND d.user_id = ?
    `, [id, req.user.id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment details
    const updates = [];
    const params = [];

    if (diagnosis !== undefined) {
      updates.push('diagnosis = ?');
      params.push(diagnosis);
    }
    if (prescription !== undefined) {
      updates.push('prescription = ?');
      params.push(prescription);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await runQuery(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel appointment (patient only)
router.delete('/:id', authenticateToken, requirePatient, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists and belongs to this patient
    const appointment = await getRow(`
      SELECT a.*, p.user_id as patient_user_id
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ? AND p.user_id = ?
    `, [id, req.user.id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    // Cancel appointment
    await runQuery(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', id]
    );

    // Send cancellation email
    if (process.env.EMAIL_ENABLED === 'true') {
      try {
        const appointmentDetails = await getRow(`
          SELECT 
            a.id, a.appointment_date, a.appointment_time,
            u.first_name as patient_first_name, u.last_name as patient_last_name, u.email as patient_email,
            doc.first_name as doctor_first_name, doc.last_name as doctor_last_name, doc.email as doctor_email
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users u ON p.user_id = u.id
          JOIN doctors d ON a.doctor_id = d.id
          JOIN users doc ON d.user_id = doc.id
          WHERE a.id = ?
        `, [id]);
        
        await sendAppointmentEmail(appointmentDetails, 'cancellation');
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Get available time slots for a doctor
router.get('/available-slots/:doctorId', authenticateToken, [
  body('date').isISO8601()
], async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Get doctor's working hours
    const doctor = await getRow(`
      SELECT working_hours, available_days
      FROM doctors
      WHERE id = ?
    `, [doctorId]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Get booked slots for the date
    const bookedSlots = await getAll(`
      SELECT appointment_time, duration
      FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'
    `, [doctorId, date]);

    // Generate available time slots (assuming 9 AM to 5 PM, 30-minute intervals)
    const workingHours = { start: '09:00', end: '17:00' };
    const slotDuration = 30; // minutes
    const availableSlots = [];

    let currentTime = moment(workingHours.start, 'HH:mm');
    const endTime = moment(workingHours.end, 'HH:mm');

    while (currentTime.isBefore(endTime)) {
      const timeSlot = currentTime.format('HH:mm');
      
      // Check if this slot is available
      const isBooked = bookedSlots.some(slot => {
        const slotStart = moment(slot.appointment_time, 'HH:mm');
        const slotEnd = slotStart.clone().add(slot.duration, 'minutes');
        const currentSlotEnd = currentTime.clone().add(slotDuration, 'minutes');
        
        return currentTime.isBefore(slotEnd) && slotStart.isBefore(currentSlotEnd);
      });

      if (!isBooked) {
        availableSlots.push(timeSlot);
      }

      currentTime.add(slotDuration, 'minutes');
    }

    res.json({ availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

module.exports = router;