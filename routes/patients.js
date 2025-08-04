const express = require('express');
const db = require('../config/database');
const { requireAuth, requirePatient, requireDoctorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get patient dashboard
router.get('/dashboard', requirePatient, async (req, res) => {
    try {
        const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (!patient) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }

        // Get upcoming appointments
        const upcomingAppointments = await db.query(
            `SELECT a.*, d.specialization, u.first_name as doctor_first_name, u.last_name as doctor_last_name
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u ON d.user_id = u.id
             WHERE a.patient_id = ? AND a.appointment_date >= date('now')
             AND a.status NOT IN ('cancelled')
             ORDER BY a.appointment_date, a.appointment_time
             LIMIT 5`,
            [patient.id]
        );

        // Get recent medical records
        const recentRecords = await db.query(
            `SELECT mr.*, d.specialization, u.first_name as doctor_first_name, u.last_name as doctor_last_name
             FROM medical_records mr
             JOIN doctors d ON mr.doctor_id = d.id
             JOIN users u ON d.user_id = u.id
             WHERE mr.patient_id = ?
             ORDER BY mr.record_date DESC
             LIMIT 5`,
            [patient.id]
        );

        res.json({
            upcoming_appointments: upcomingAppointments.map(apt => ({
                id: apt.id,
                date: apt.appointment_date,
                time: apt.appointment_time,
                doctor_name: `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
                specialization: apt.specialization,
                type: apt.type,
                status: apt.status
            })),
            recent_records: recentRecords.map(record => ({
                id: record.id,
                date: record.record_date,
                doctor_name: `Dr. ${record.doctor_first_name} ${record.doctor_last_name}`,
                diagnosis: record.diagnosis,
                symptoms: record.symptoms
            }))
        });

    } catch (error) {
        console.error('Patient dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;