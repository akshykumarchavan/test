const express = require('express');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const db = require('../config/database');
const { requireAuth, requirePatient, requireDoctor, requireDoctorOrAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Book appointment (Patients only)
router.post('/', requirePatient, [
    body('doctor_id').isInt({ min: 1 }).withMessage('Valid doctor ID is required'),
    body('appointment_date').isDate().withMessage('Valid appointment date is required'),
    body('appointment_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time in HH:MM format is required'),
    body('type').optional().isIn(['consultation', 'follow-up', 'emergency', 'telemedicine']),
    body('reason').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { doctor_id, appointment_date, appointment_time, type = 'consultation', reason } = req.body;
        
        // Get patient ID
        const patient = await db.get(
            'SELECT id FROM patients WHERE user_id = ?',
            [req.user.id]
        );

        if (!patient) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }

        // Validate appointment date (not in the past)
        const appointmentDateTime = moment(`${appointment_date} ${appointment_time}`, 'YYYY-MM-DD HH:mm');
        if (appointmentDateTime.isBefore(moment())) {
            return res.status(400).json({ error: 'Appointment cannot be scheduled in the past' });
        }

        // Check if doctor exists and is available
        const doctor = await db.get(
            `SELECT d.*, u.first_name, u.last_name, u.email 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.id = ? AND d.is_available = 1 AND u.is_active = 1`,
            [doctor_id]
        );

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found or not available' });
        }

        // Check if time slot is available
        const existingAppointment = await db.get(
            `SELECT id FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
             AND status NOT IN ('cancelled')`,
            [doctor_id, appointment_date, appointment_time]
        );

        if (existingAppointment) {
            return res.status(409).json({ error: 'Time slot is already booked' });
        }

        // Check doctor's working hours and days
        const appointmentDay = appointmentDateTime.format('dddd');
        const workingDays = doctor.working_days ? doctor.working_days.split(',') : [];
        
        if (!workingDays.includes(appointmentDay)) {
            return res.status(400).json({ 
                error: `Doctor is not available on ${appointmentDay}. Working days: ${workingDays.join(', ')}` 
            });
        }

        const appointmentTimeMoment = moment(appointment_time, 'HH:mm');
        const workingStart = moment(doctor.working_hours_start, 'HH:mm');
        const workingEnd = moment(doctor.working_hours_end, 'HH:mm');

        if (!appointmentTimeMoment.isBetween(workingStart, workingEnd, null, '[]')) {
            return res.status(400).json({ 
                error: `Appointment time must be between ${doctor.working_hours_start} and ${doctor.working_hours_end}` 
            });
        }

        await db.beginTransaction();

        try {
            // Create appointment
            const appointmentResult = await db.run(
                `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, reason, fee_amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
                [patient.id, doctor_id, appointment_date, appointment_time, type, reason, doctor.consultation_fee]
            );

            await db.commit();

            // Get complete appointment details for email
            const appointmentDetails = await db.get(
                `SELECT a.*, 
                        p.*, pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.email as patient_email,
                        d.*, du.first_name as doctor_first_name, du.last_name as doctor_last_name
                 FROM appointments a
                 JOIN patients p ON a.patient_id = p.id
                 JOIN users pu ON p.user_id = pu.id
                 JOIN doctors d ON a.doctor_id = d.id
                 JOIN users du ON d.user_id = du.id
                 WHERE a.id = ?`,
                [appointmentResult.id]
            );

            // Send confirmation email
            const patientData = {
                first_name: appointmentDetails.patient_first_name,
                last_name: appointmentDetails.patient_last_name,
                email: appointmentDetails.patient_email
            };

            const doctorData = {
                first_name: appointmentDetails.doctor_first_name,
                last_name: appointmentDetails.doctor_last_name,
                specialization: appointmentDetails.specialization
            };

            await emailService.sendAppointmentConfirmation(appointmentDetails, patientData, doctorData);

            res.status(201).json({
                message: 'Appointment booked successfully',
                appointment: {
                    id: appointmentResult.id,
                    doctor_name: `Dr. ${doctorData.first_name} ${doctorData.last_name}`,
                    specialization: doctorData.specialization,
                    appointment_date,
                    appointment_time,
                    type,
                    reason,
                    fee_amount: doctor.consultation_fee,
                    status: 'scheduled'
                }
            });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// Get appointments (different views for different roles)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status, date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        // Role-based filtering
        if (req.user.role === 'patient') {
            const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
            if (!patient) {
                return res.status(404).json({ error: 'Patient profile not found' });
            }
            whereConditions.push('a.patient_id = ?');
            params.push(patient.id);
        } else if (req.user.role === 'doctor') {
            const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor profile not found' });
            }
            whereConditions.push('a.doctor_id = ?');
            params.push(doctor.id);
        }

        // Status filter
        if (status) {
            whereConditions.push('a.status = ?');
            params.push(status);
        }

        // Date filter
        if (date) {
            whereConditions.push('a.appointment_date = ?');
            params.push(date);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const appointments = await db.query(
            `SELECT a.*,
                    p.*, pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.phone as patient_phone,
                    d.*, du.first_name as doctor_first_name, du.last_name as doctor_last_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users du ON d.user_id = du.id
             ${whereClause}
             ORDER BY a.appointment_date DESC, a.appointment_time DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        // Get total count for pagination
        const totalResult = await db.get(
            `SELECT COUNT(*) as total FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN doctors d ON a.doctor_id = d.id
             ${whereClause}`,
            params
        );

        const formattedAppointments = appointments.map(apt => ({
            id: apt.id,
            patient_name: `${apt.patient_first_name} ${apt.patient_last_name}`,
            patient_phone: apt.patient_phone,
            doctor_name: `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
            specialization: apt.specialization,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            duration_minutes: apt.duration_minutes,
            type: apt.type,
            status: apt.status,
            reason: apt.reason,
            notes: apt.notes,
            diagnosis: apt.diagnosis,
            prescription: apt.prescription,
            fee_amount: apt.fee_amount,
            payment_status: apt.payment_status,
            created_at: apt.created_at
        }));

        res.json({
            appointments: formattedAppointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });

    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get specific appointment
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const appointmentId = req.params.id;

        const appointment = await db.get(
            `SELECT a.*,
                    p.*, pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.email as patient_email, pu.phone as patient_phone,
                    d.*, du.first_name as doctor_first_name, du.last_name as doctor_last_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users du ON d.user_id = du.id
             WHERE a.id = ?`,
            [appointmentId]
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check authorization
        if (req.user.role === 'patient') {
            const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
            if (appointment.patient_id !== patient.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        } else if (req.user.role === 'doctor') {
            const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
            if (appointment.doctor_id !== doctor.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json({
            appointment: {
                id: appointment.id,
                patient: {
                    name: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
                    email: appointment.patient_email,
                    phone: appointment.patient_phone,
                    date_of_birth: appointment.date_of_birth,
                    gender: appointment.gender,
                    blood_group: appointment.blood_group
                },
                doctor: {
                    name: `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
                    specialization: appointment.specialization,
                    qualification: appointment.qualification
                },
                appointment_date: appointment.appointment_date,
                appointment_time: appointment.appointment_time,
                duration_minutes: appointment.duration_minutes,
                type: appointment.type,
                status: appointment.status,
                reason: appointment.reason,
                notes: appointment.notes,
                diagnosis: appointment.diagnosis,
                prescription: appointment.prescription,
                fee_amount: appointment.fee_amount,
                payment_status: appointment.payment_status,
                created_at: appointment.created_at
            }
        });

    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({ error: 'Failed to fetch appointment' });
    }
});

// Update appointment (Doctors can update notes, diagnosis, prescription)
router.put('/:id', requireDoctor, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status, notes, diagnosis, prescription, duration_minutes } = req.body;

        // Get doctor ID
        const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor profile not found' });
        }

        // Verify appointment belongs to this doctor
        const appointment = await db.get(
            'SELECT * FROM appointments WHERE id = ? AND doctor_id = ?',
            [appointmentId, doctor.id]
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Update appointment
        await db.run(
            `UPDATE appointments SET 
             status = COALESCE(?, status),
             notes = COALESCE(?, notes),
             diagnosis = COALESCE(?, diagnosis),
             prescription = COALESCE(?, prescription),
             duration_minutes = COALESCE(?, duration_minutes),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [status, notes, diagnosis, prescription, duration_minutes, appointmentId]
        );

        res.json({ message: 'Appointment updated successfully' });

    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Cancel appointment
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { reason } = req.body;

        // Get appointment details
        const appointment = await db.get(
            `SELECT a.*,
                    p.*, pu.first_name as patient_first_name, pu.last_name as patient_last_name, pu.email as patient_email,
                    d.*, du.first_name as doctor_first_name, du.last_name as doctor_last_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users du ON d.user_id = du.id
             WHERE a.id = ?`,
            [appointmentId]
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check authorization
        let canCancel = false;
        if (req.user.role === 'patient') {
            const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
            canCancel = appointment.patient_id === patient.id;
        } else if (req.user.role === 'doctor') {
            const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
            canCancel = appointment.doctor_id === doctor.id;
        } else if (req.user.role === 'admin') {
            canCancel = true;
        }

        if (!canCancel) {
            return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
        }

        // Check if appointment can be cancelled
        if (appointment.status === 'cancelled') {
            return res.status(400).json({ error: 'Appointment is already cancelled' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ error: 'Cannot cancel completed appointment' });
        }

        // Update appointment status
        await db.run(
            `UPDATE appointments SET 
             status = 'cancelled',
             notes = COALESCE(?, 'Cancelled: ' || COALESCE(notes, '')),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [reason ? `Cancellation reason: ${reason}` : null, appointmentId]
        );

        // Send cancellation email to patient
        const patientData = {
            first_name: appointment.patient_first_name,
            last_name: appointment.patient_last_name,
            email: appointment.patient_email
        };

        const doctorData = {
            first_name: appointment.doctor_first_name,
            last_name: appointment.doctor_last_name,
            specialization: appointment.specialization
        };

        await emailService.sendAppointmentCancellation(appointment, patientData, doctorData, reason);

        res.json({ message: 'Appointment cancelled successfully' });

    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
});

// Get available time slots for a doctor on a specific date
router.get('/availability/:doctorId/:date', requireAuth, async (req, res) => {
    try {
        const { doctorId, date } = req.params;

        // Validate date
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Check if date is in the past
        if (moment(date).isBefore(moment().startOf('day'))) {
            return res.status(400).json({ error: 'Cannot check availability for past dates' });
        }

        // Get doctor's working hours and days
        const doctor = await db.get(
            'SELECT working_hours_start, working_hours_end, working_days FROM doctors WHERE id = ?',
            [doctorId]
        );

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Check if doctor works on this day
        const dayOfWeek = moment(date).format('dddd');
        const workingDays = doctor.working_days ? doctor.working_days.split(',') : [];
        
        if (!workingDays.includes(dayOfWeek)) {
            return res.json({ 
                availableSlots: [],
                message: `Doctor is not available on ${dayOfWeek}. Working days: ${workingDays.join(', ')}`
            });
        }

        // Get existing appointments for this date
        const existingAppointments = await db.query(
            `SELECT appointment_time FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled')`,
            [doctorId, date]
        );

        const bookedTimes = existingAppointments.map(apt => apt.appointment_time);

        // Generate available time slots
        const startTime = moment(doctor.working_hours_start, 'HH:mm');
        const endTime = moment(doctor.working_hours_end, 'HH:mm');
        const slotDuration = 30; // 30-minute slots
        const availableSlots = [];

        let currentTime = startTime.clone();
        while (currentTime.isBefore(endTime)) {
            const timeString = currentTime.format('HH:mm');
            if (!bookedTimes.includes(timeString)) {
                availableSlots.push(timeString);
            }
            currentTime.add(slotDuration, 'minutes');
        }

        res.json({ 
            date,
            doctorId: parseInt(doctorId),
            workingHours: {
                start: doctor.working_hours_start,
                end: doctor.working_hours_end
            },
            availableSlots
        });

    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

module.exports = router;