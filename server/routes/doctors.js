const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requireDoctor } = require('../middleware/auth');

const router = express.Router();

// Get all doctors (public endpoint)
router.get('/', async (req, res) => {
  try {
    const doctors = await getAll(`
      SELECT 
        d.id, d.specialization, d.experience_years, d.bio, d.consultation_fee,
        d.available_days, d.working_hours,
        u.first_name, u.last_name, u.email, u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY u.first_name, u.last_name
    `);

    res.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Failed to get doctors' });
  }
});

// Get doctor by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const doctor = await getRow(`
      SELECT 
        d.id, d.specialization, d.experience_years, d.bio, d.consultation_fee,
        d.available_days, d.working_hours,
        u.first_name, u.last_name, u.email, u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Failed to get doctor' });
  }
});

// Get current doctor's profile
router.get('/profile/me', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const doctor = await getRow(`
      SELECT 
        d.id, d.specialization, d.license_number, d.experience_years, d.bio, 
        d.consultation_fee, d.available_days, d.working_hours,
        u.first_name, u.last_name, u.email, u.phone, u.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = ?
    `, [req.user.id]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    res.json({ doctor });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ error: 'Failed to get doctor profile' });
  }
});

// Update doctor profile
router.put('/profile/me', authenticateToken, requireDoctor, [
  body('specialization').optional().isString(),
  body('experienceYears').optional().isInt({ min: 0, max: 50 }),
  body('bio').optional().isString(),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('availableDays').optional().isString(),
  body('workingHours').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { specialization, experienceYears, bio, consultationFee, availableDays, workingHours } = req.body;
    
    const updates = [];
    const params = [];

    if (specialization !== undefined) {
      updates.push('specialization = ?');
      params.push(specialization);
    }
    if (experienceYears !== undefined) {
      updates.push('experience_years = ?');
      params.push(experienceYears);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (consultationFee !== undefined) {
      updates.push('consultation_fee = ?');
      params.push(consultationFee);
    }
    if (availableDays !== undefined) {
      updates.push('available_days = ?');
      params.push(availableDays);
    }
    if (workingHours !== undefined) {
      updates.push('working_hours = ?');
      params.push(workingHours);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.user.id);

    await runQuery(
      `UPDATE doctors SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    res.json({ message: 'Doctor profile updated successfully' });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
});

// Get doctor's schedule
router.get('/schedule/me', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const { date } = req.query;
    
    let appointments;
    if (date) {
      // Get appointments for specific date
      appointments = await getAll(`
        SELECT 
          a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
          a.symptoms, a.diagnosis, a.prescription, a.notes,
          u.first_name as patient_first_name, u.last_name as patient_last_name,
          u.email as patient_email, u.phone as patient_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE d.user_id = ? AND a.appointment_date = ?
        ORDER BY a.appointment_time
      `, [req.user.id, date]);
    } else {
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      appointments = await getAll(`
        SELECT 
          a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
          a.symptoms, a.diagnosis, a.prescription, a.notes,
          u.first_name as patient_first_name, u.last_name as patient_last_name,
          u.email as patient_email, u.phone as patient_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE d.user_id = ? AND a.appointment_date = ?
        ORDER BY a.appointment_time
      `, [req.user.id, today]);
    }

    res.json({ appointments });
  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({ error: 'Failed to get doctor schedule' });
  }
});

// Get doctor's upcoming appointments
router.get('/appointments/upcoming', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const appointments = await getAll(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.duration, a.status,
        a.symptoms, a.diagnosis, a.prescription, a.notes,
        u.first_name as patient_first_name, u.last_name as patient_last_name,
        u.email as patient_email, u.phone as patient_phone
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE d.user_id = ? AND a.appointment_date >= date('now') AND a.status != 'cancelled'
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT 20
    `, [req.user.id]);

    res.json({ appointments });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ error: 'Failed to get upcoming appointments' });
  }
});

// Get doctor's patient list
router.get('/patients', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const patients = await getAll(`
      SELECT DISTINCT
        p.id, p.date_of_birth, p.gender, p.blood_group, p.emergency_contact,
        p.medical_history, p.allergies,
        u.first_name, u.last_name, u.email, u.phone,
        COUNT(a.id) as appointment_count,
        MAX(a.appointment_date) as last_appointment
      FROM patients p
      JOIN users u ON p.user_id = u.id
      JOIN appointments a ON p.id = a.patient_id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = ?
      GROUP BY p.id
      ORDER BY u.first_name, u.last_name
    `, [req.user.id]);

    res.json({ patients });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ error: 'Failed to get patients' });
  }
});

// Get doctor's statistics
router.get('/stats', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');

    // Today's appointments
    const todayAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = ? AND a.appointment_date = ?
    `, [req.user.id, today]);

    // This month's appointments
    const monthAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = ? AND a.appointment_date LIKE ?
    `, [req.user.id, `${thisMonth}%`]);

    // Total patients
    const totalPatients = await getRow(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM patients p
      JOIN appointments a ON p.id = a.patient_id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = ?
    `, [req.user.id]);

    // Pending appointments
    const pendingAppointments = await getRow(`
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = ? AND a.status = 'scheduled' AND a.appointment_date >= date('now')
    `, [req.user.id]);

    res.json({
      stats: {
        todayAppointments: todayAppointments.count,
        monthAppointments: monthAppointments.count,
        totalPatients: totalPatients.count,
        pendingAppointments: pendingAppointments.count
      }
    });
  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Search doctors by specialization
router.get('/search/specialization', async (req, res) => {
  try {
    const { specialization } = req.query;
    
    if (!specialization) {
      return res.status(400).json({ error: 'Specialization parameter is required' });
    }

    const doctors = await getAll(`
      SELECT 
        d.id, d.specialization, d.experience_years, d.bio, d.consultation_fee,
        u.first_name, u.last_name, u.email, u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.specialization LIKE ?
      ORDER BY u.first_name, u.last_name
    `, [`%${specialization}%`]);

    res.json({ doctors });
  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({ error: 'Failed to search doctors' });
  }
});

module.exports = router;