const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Validation middleware
const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('last_name').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('role').isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
    body('phone').optional().isMobilePhone()
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role, first_name, last_name, phone } = req.body;

        // Check if user already exists
        const existingUser = await db.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Begin transaction
        await db.beginTransaction();

        try {
            // Insert user
            const userResult = await db.run(
                `INSERT INTO users (email, password, role, first_name, last_name, phone)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, role, first_name, last_name, phone]
            );

            const userId = userResult.id;

            // Create role-specific record
            if (role === 'patient') {
                await db.run(
                    'INSERT INTO patients (user_id) VALUES (?)',
                    [userId]
                );
            } else if (role === 'doctor') {
                // For doctor registration, require additional info
                const { license_number, specialization, qualification, experience_years, consultation_fee, bio } = req.body;
                
                if (!license_number || !specialization) {
                    await db.rollback();
                    return res.status(400).json({ 
                        error: 'License number and specialization are required for doctors' 
                    });
                }

                await db.run(
                    `INSERT INTO doctors (user_id, license_number, specialization, qualification, experience_years, consultation_fee, bio)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, license_number, specialization, qualification, experience_years, consultation_fee, bio]
                );
            }

            await db.commit();

            // Get complete user data
            const user = await db.get(
                'SELECT id, email, role, first_name, last_name, phone FROM users WHERE id = ?',
                [userId]
            );

            // Send welcome email
            await emailService.sendWelcomeEmail(user);

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone
                },
                token
            });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await db.get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get role-specific data
        let roleData = {};
        if (user.role === 'doctor') {
            roleData = await db.get(
                'SELECT * FROM doctors WHERE user_id = ?',
                [user.id]
            );
        } else if (user.role === 'patient') {
            roleData = await db.get(
                'SELECT * FROM patients WHERE user_id = ?',
                [user.id]
            );
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                ...roleData
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = req.user;

        // Get role-specific data
        let roleData = {};
        if (user.role === 'doctor') {
            roleData = await db.get(
                'SELECT * FROM doctors WHERE user_id = ?',
                [user.id]
            );
        } else if (user.role === 'patient') {
            roleData = await db.get(
                'SELECT * FROM patients WHERE user_id = ?',
                [user.id]
            );
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                ...roleData
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone, ...roleSpecificData } = req.body;

        await db.beginTransaction();

        try {
            // Update basic user info
            await db.run(
                `UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [first_name, last_name, phone, userId]
            );

            // Update role-specific data
            if (req.user.role === 'patient') {
                const { date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies, current_medications } = roleSpecificData;
                
                await db.run(
                    `UPDATE patients SET 
                     date_of_birth = ?, gender = ?, blood_group = ?, address = ?,
                     emergency_contact_name = ?, emergency_contact_phone = ?,
                     medical_history = ?, allergies = ?, current_medications = ?
                     WHERE user_id = ?`,
                    [date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies, current_medications, userId]
                );
            } else if (req.user.role === 'doctor') {
                const { specialization, qualification, experience_years, consultation_fee, bio, working_hours_start, working_hours_end, working_days } = roleSpecificData;
                
                await db.run(
                    `UPDATE doctors SET 
                     specialization = ?, qualification = ?, experience_years = ?, consultation_fee = ?,
                     bio = ?, working_hours_start = ?, working_hours_end = ?, working_days = ?
                     WHERE user_id = ?`,
                    [specialization, qualification, experience_years, consultation_fee, bio, working_hours_start, working_hours_end, working_days, userId]
                );
            }

            await db.commit();

            res.json({ message: 'Profile updated successfully' });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.put('/change-password', requireAuth, [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        // Get current user with password
        const user = await db.get(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        // Verify current password
        const isValidPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        // Update password
        await db.run(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedNewPassword, userId]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;