const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get system overview statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });
    
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });

    const monthlyRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        activeUsers,
        verifiedDoctors,
        todayAppointments
      },
      monthlyRegistrations
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
});

// Get all users with pagination and filters
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get all doctors with verification status
router.get('/doctors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { verified, active, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (verified === 'true') query.isVerified = true;
    if (verified === 'false') query.isVerified = false;
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    const doctors = await Doctor.find(query)
      .populate('user', 'firstName lastName email phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: skip + doctors.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
});

// Verify doctor
router.put('/doctors/:doctorId/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isVerified } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isVerified = isVerified;
    await doctor.save();

    res.json({
      message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
      doctor
    });
  } catch (error) {
    console.error('Error updating doctor verification:', error);
    res.status(500).json({ message: 'Server error updating doctor verification' });
  }
});

// Activate/Deactivate user
router.put('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// Create doctor profile for existing user
router.post('/doctors/create', authenticateToken, requireAdmin, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('specialization').isIn([
    'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology',
    'Gynecology', 'Ophthalmology', 'ENT', 'Emergency Medicine',
    'Family Medicine', 'Internal Medicine', 'Anesthesiology'
  ]).withMessage('Invalid specialization'),
  body('licenseNumber').trim().isLength({ min: 5 }).withMessage('License number must be at least 5 characters'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      userId,
      specialization,
      licenseNumber,
      experience,
      consultationFee,
      education,
      certifications,
      languages,
      bio,
      clinicAddress
    } = req.body;

    // Check if user exists and is not already a doctor
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'doctor') {
      return res.status(400).json({ message: 'User is already a doctor' });
    }

    // Check if license number is unique
    const existingDoctor = await Doctor.findOne({ licenseNumber });
    if (existingDoctor) {
      return res.status(400).json({ message: 'License number already exists' });
    }

    // Update user role
    user.role = 'doctor';
    await user.save();

    // Create doctor profile
    const doctor = new Doctor({
      user: userId,
      specialization,
      licenseNumber,
      experience,
      consultationFee,
      education: education || [],
      certifications: certifications || [],
      languages: languages || ['English'],
      bio,
      clinicAddress,
      isVerified: true // Auto-verify admin-created doctors
    });

    await doctor.save();

    res.status(201).json({
      message: 'Doctor profile created successfully',
      doctor
    });
  } catch (error) {
    console.error('Error creating doctor profile:', error);
    res.status(500).json({ message: 'Server error creating doctor profile' });
  }
});

// Get all appointments with filters
router.get('/appointments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: skip + appointments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// System settings
router.get('/settings', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    emailNotifications: {
      enabled: true,
      templates: {
        welcome: 'enabled',
        appointment_confirmation: 'enabled',
        appointment_reminder: 'enabled',
        appointment_cancellation: 'enabled'
      }
    },
    appointmentSettings: {
      maxAdvanceBooking: 60, // days
      minCancellationTime: 24, // hours
      defaultSlotDuration: 30, // minutes
      reminderTime: 24 // hours before appointment
    },
    systemMaintenance: {
      lastBackup: new Date(),
      nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
});

// Update system settings
router.put('/settings', authenticateToken, requireAdmin, (req, res) => {
  // In a real application, you would save these to a database
  res.json({
    message: 'Settings updated successfully',
    settings: req.body
  });
});

// Delete user (soft delete)
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    // If doctor, also deactivate doctor profile
    if (user.role === 'doctor') {
      await Doctor.findOneAndUpdate(
        { user: userId },
        { isActive: false }
      );
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;