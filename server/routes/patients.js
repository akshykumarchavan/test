const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get patient profile
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await User.findById(req.user.userId).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
router.put('/profile', auth, [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other'])
], async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, dateOfBirth, gender, address } = req.body;

    const patient = await User.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update fields
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (phone) patient.phone = phone;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (address) patient.address = address;

    await patient.save();

    res.json({
      message: 'Patient profile updated successfully',
      patient: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address
      }
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient medical history
router.get('/medical-history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find({ patientId: req.user.userId })
      .populate('doctorId', 'specialization')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments({ patientId: req.user.userId });

    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient statistics
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Appointment.aggregate([
      { $match: { patientId: req.user.userId } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalSpent: { $sum: '$amount' },
          upcomingAppointments: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$appointmentDate', new Date()] },
                    { $eq: ['$status', 'scheduled'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalSpent: 0,
        upcomingAppointments: 0
      }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming appointments
router.get('/upcoming', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const upcomingAppointments = await Appointment.find({
      patientId: req.user.userId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('doctorId', 'specialization')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(5);

    res.json(upcomingAppointments);
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient by ID (for doctors)
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await User.findById(req.params.id).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get patient's appointments with the requesting doctor
    const appointments = await Appointment.find({
      patientId: req.params.id,
      doctorId: req.user.userId
    })
      .sort({ appointmentDate: -1 })
      .limit(10);

    res.json({
      patient,
      recentAppointments: appointments
    });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;