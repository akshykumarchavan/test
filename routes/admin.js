const express = require('express');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get system statistics
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Get user counts
        const userStats = await db.get(
            `SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN role = 'patient' THEN 1 END) as total_patients,
                COUNT(CASE WHEN role = 'doctor' THEN 1 END) as total_doctors,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users
             FROM users`
        );

        // Get appointment stats
        const appointmentStats = await db.get(
            `SELECT 
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_appointments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
                COUNT(CASE WHEN appointment_date = date('now') THEN 1 END) as today_appointments
             FROM appointments`
        );

        res.json({
            users: userStats,
            appointments: appointmentStats
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;