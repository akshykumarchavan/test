const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, available, rating, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    if (available === 'true') {
      query.isAvailable = true;
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ rating: -1, experience: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone dateOfBirth gender address');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update doctor profile
router.put('/profile', auth, [
  body('specialization').optional().trim(),
  body('experience').optional().isNumeric(),
  body('consultationFee').optional().isNumeric(),
  body('bio').optional().trim(),
  body('isAvailable').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      specialization,
      experience,
      consultationFee,
      bio,
      isAvailable,
      availability,
      consultationDuration,
      languages
    } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Update fields
    if (specialization) doctor.specialization = specialization;
    if (experience !== undefined) doctor.experience = experience;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (bio !== undefined) doctor.bio = bio;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;
    if (availability) doctor.availability = availability;
    if (consultationDuration) doctor.consultationDuration = consultationDuration;
    if (languages) doctor.languages = languages;

    await doctor.save();

    res.json({
      message: 'Doctor profile updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add education
router.post('/education', auth, [
  body('degree').notEmpty().trim(),
  body('institution').notEmpty().trim(),
  body('year').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { degree, institution, year } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    doctor.education.push({ degree, institution, year });
    await doctor.save();

    res.json({
      message: 'Education added successfully',
      education: doctor.education
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add certification
router.post('/certifications', auth, [
  body('name').notEmpty().trim(),
  body('issuingOrganization').notEmpty().trim(),
  body('year').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, issuingOrganization, year, expiryDate } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    doctor.certifications.push({
      name,
      issuingOrganization,
      year,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });
    await doctor.save();

    res.json({
      message: 'Certification added successfully',
      certifications: doctor.certifications
    });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor statistics
router.get('/stats/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get appointment statistics
    const Appointment = require('../models/Appointment');
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const stats = await Appointment.aggregate([
      { $match: { doctorId: doctor._id } },
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
          totalEarnings: { $sum: '$amount' },
          monthlyAppointments: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$appointmentDate', startOfMonth] },
                    { $lte: ['$appointmentDate', endOfMonth] }
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
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        experience: doctor.experience,
        rating: doctor.rating,
        totalReviews: doctor.totalReviews
      },
      stats: stats[0] || {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalEarnings: 0,
        monthlyAppointments: 0
      }
    });
  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search doctors
router.get('/search', async (req, res) => {
  try {
    const { q, specialization, location } = req.query;

    const query = {};

    if (q) {
      query.$or = [
        { specialization: { $regex: q, $options: 'i' } },
        { 'userId.firstName': { $regex: q, $options: 'i' } },
        { 'userId.lastName': { $regex: q, $options: 'i' } }
      ];
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ rating: -1 });

    res.json(doctors);
  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;