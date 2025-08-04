const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth, requireDoctor, requireDoctorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all doctors (public endpoint with basic info)
router.get('/', async (req, res) => {
    try {
        const { specialization, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['u.is_active = 1', 'd.is_available = 1'];
        let params = [];

        // Specialization filter
        if (specialization) {
            whereConditions.push('d.specialization LIKE ?');
            params.push(`%${specialization}%`);
        }

        // Search filter (name or specialization)
        if (search) {
            whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR d.specialization LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

        const doctors = await db.query(
            `SELECT d.id, d.specialization, d.qualification, d.experience_years, 
                    d.consultation_fee, d.bio, d.working_hours_start, d.working_hours_end, d.working_days,
                    u.first_name, u.last_name, u.phone
             FROM doctors d
             JOIN users u ON d.user_id = u.id
             ${whereClause}
             ORDER BY u.first_name, u.last_name
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        // Get total count for pagination
        const totalResult = await db.get(
            `SELECT COUNT(*) as total FROM doctors d
             JOIN users u ON d.user_id = u.id
             ${whereClause}`,
            params
        );

        const formattedDoctors = doctors.map(doctor => ({
            id: doctor.id,
            name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
            specialization: doctor.specialization,
            qualification: doctor.qualification,
            experience_years: doctor.experience_years,
            consultation_fee: doctor.consultation_fee,
            bio: doctor.bio,
            working_hours: {
                start: doctor.working_hours_start,
                end: doctor.working_hours_end,
                days: doctor.working_days ? doctor.working_days.split(',') : []
            },
            phone: doctor.phone
        }));

        res.json({
            doctors: formattedDoctors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });

    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

// Get doctor dashboard
router.get('/dashboard', requireDoctor, async (req, res) => {
    try {
        const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor profile not found' });
        }

        // Get today's appointments
        const todayAppointments = await db.query(
            `SELECT a.*, u.first_name, u.last_name, u.phone
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE a.doctor_id = ? AND a.appointment_date = date('now')
             ORDER BY a.appointment_time`,
            [doctor.id]
        );

        res.json({
            today_appointments: todayAppointments.length,
            appointments: todayAppointments.map(apt => ({
                id: apt.id,
                time: apt.appointment_time,
                patient_name: `${apt.first_name} ${apt.last_name}`,
                type: apt.type,
                status: apt.status
            }))
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;