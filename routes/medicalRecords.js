const express = require('express');
const db = require('../config/database');
const { requireAuth, requireDoctor, requirePatientOrDoctor } = require('../middleware/auth');

const router = express.Router();

// Create medical record (doctors only)
router.post('/', requireDoctor, async (req, res) => {
    try {
        const { patient_id, appointment_id, symptoms, diagnosis, treatment, prescription, lab_results, notes } = req.body;

        const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor profile not found' });
        }

        const result = await db.run(
            `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, symptoms, diagnosis, treatment, prescription, lab_results, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patient_id, doctor.id, appointment_id, symptoms, diagnosis, treatment, prescription, lab_results, notes]
        );

        res.status(201).json({
            message: 'Medical record created successfully',
            record_id: result.id
        });

    } catch (error) {
        console.error('Create medical record error:', error);
        res.status(500).json({ error: 'Failed to create medical record' });
    }
});

module.exports = router;