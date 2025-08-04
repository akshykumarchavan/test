const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Get current patient's profile
router.get('/profile/me', authenticateToken, requirePatient, async (req, res) => {
  try {
    const patient = await getRow(`
      SELECT 
        p.id, p.date_of_birth, p.gender, p.blood_group, p.emergency_contact,
        p.medical_history, p.allergies,
        u.first_name, u.last_name, u.email, u.phone, u.created_at
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `, [req.user.id]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ error: 'Failed to get patient profile' });
  }
});

// Update patient profile
router.put('/profile/me', authenticateToken, requirePatient, [
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('bloodGroup').optional().isString(),
  body('emergencyContact').optional().isString(),
  body('medicalHistory').optional().isString(),
  body('allergies').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dateOfBirth, gender, bloodGroup, emergencyContact, medicalHistory, allergies } = req.body;
    
    const updates = [];
    const params = [];

    if (dateOfBirth !== undefined) {
      updates.push('date_of_birth = ?');
      params.push(dateOfBirth);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      params.push(gender);
    }
    if (bloodGroup !== undefined) {
      updates.push('blood_group = ?');
      params.push(bloodGroup);
    }
    if (emergencyContact !== undefined) {
      updates.push('emergency_contact = ?');
      params.push(emergencyContact);
    }
    if (medicalHistory !== undefined) {
      updates.push('medical_history = ?');
      params.push(medicalHistory);
    }
    if (allergies !== undefined) {
      updates.push('allergies = ?');
      params.push(allergies);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.user.id);

    await runQuery(
      `UPDATE patients SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    res.json({ message: 'Patient profile updated successfully' });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
});

// Get patient's medical history
router.get('/medical-history', authenticateToken, requirePatient, async (req, res) => {
  try {
    const appointments = await getAll(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.symptoms, a.diagnosis,
        a.prescription, a.notes, a.status,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name,
        d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ? AND a.status = 'completed'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.user.id]);

    res.json({ medicalHistory: appointments });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ error: 'Failed to get medical history' });
  }
});

// Get patient's upcoming appointments
router.get('/appointments/upcoming', authenticateToken, requirePatient, async (req, res) => {
  try {
    const appointments = await getAll(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
        a.symptoms,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name,
        d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ? AND a.appointment_date >= date('now') AND a.status != 'cancelled'
      ORDER BY a.appointment_date, a.appointment_time
    `, [req.user.id]);

    res.json({ appointments });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ error: 'Failed to get upcoming appointments' });
  }
});

// Get patient's past appointments
router.get('/appointments/past', authenticateToken, requirePatient, async (req, res) => {
  try {
    const appointments = await getAll(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
        a.symptoms, a.diagnosis, a.prescription, a.notes,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name,
        d.specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ? AND a.appointment_date < date('now')
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ appointments });
  } catch (error) {
    console.error('Get past appointments error:', error);
    res.status(500).json({ error: 'Failed to get past appointments' });
  }
});

// Get patient's statistics
router.get('/stats', authenticateToken, requirePatient, async (req, res) => {
  try {
    // Total appointments
    const totalAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ?
    `, [req.user.id]);

    // Completed appointments
    const completedAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ? AND a.status = 'completed'
    `, [req.user.id]);

    // Upcoming appointments
    const upcomingAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ? AND a.appointment_date >= date('now') AND a.status != 'cancelled'
    `, [req.user.id]);

    // Cancelled appointments
    const cancelledAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ? AND a.status = 'cancelled'
    `, [req.user.id]);

    res.json({
      stats: {
        totalAppointments: totalAppointments.count,
        completedAppointments: completedAppointments.count,
        upcomingAppointments: upcomingAppointments.count,
        cancelledAppointments: cancelledAppointments.count
      }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get patient's doctors (doctors they've seen)
router.get('/doctors', authenticateToken, requirePatient, async (req, res) => {
  try {
    const doctors = await getAll(`
      SELECT DISTINCT
        d.id, d.specialization, d.experience_years,
        u.first_name, u.last_name, u.email, u.phone,
        COUNT(a.id) as appointment_count,
        MAX(a.appointment_date) as last_appointment
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN appointments a ON d.id = a.doctor_id
      JOIN patients p ON a.patient_id = p.id
      WHERE p.user_id = ?
      GROUP BY d.id
      ORDER BY last_appointment DESC
    `, [req.user.id]);

    res.json({ doctors });
  } catch (error) {
    console.error('Get patient doctors error:', error);
    res.status(500).json({ error: 'Failed to get doctors' });
  }
});

module.exports = router;