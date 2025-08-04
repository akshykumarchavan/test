const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { authenticateToken, requireDoctor, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all doctors (public route with optional auth for favorites)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      specialization, 
      city, 
      minRating, 
      maxFee, 
      telemedicine, 
      page = 1, 
      limit = 12,
      sortBy = 'rating' 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true, isVerified: true };

    // Build query filters
    if (specialization) {
      query.specialization = specialization;
    }

    if (city) {
      query['clinicAddress.city'] = new RegExp(city, 'i');
    }

    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    if (maxFee) {
      query.consultationFee = { $lte: parseFloat(maxFee) };
    }

    if (telemedicine === 'true') {
      query.telemedicineEnabled = true;
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
      case 'fee':
        sort = { consultationFee: 1 };
        break;
      case 'experience':
        sort = { experience: -1 };
        break;
      default:
        sort = { 'rating.average': -1 };
    }

    const doctors = await Doctor.find(query)
      .populate('user', 'firstName lastName profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-reviews'); // Exclude reviews for list view

    const total = await Doctor.countDocuments(query);

    // Get unique specializations for filter options
    const specializations = await Doctor.distinct('specialization', { isActive: true, isVerified: true });

    res.json({
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: skip + doctors.length < total,
        hasPrev: page > 1
      },
      filters: {
        specializations: specializations.sort()
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
});

// Get doctor by ID with reviews
router.get('/:doctorId', optionalAuth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId)
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('reviews.patient', 'firstName lastName');

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error fetching doctor' });
  }
});

// Search doctors
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const searchQuery = {
      isActive: true,
      isVerified: true,
      $or: [
        { specialization: new RegExp(query, 'i') },
        { 'clinicAddress.city': new RegExp(query, 'i') },
        { 'clinicAddress.name': new RegExp(query, 'i') }
      ]
    };

    // Also search user names
    const users = await User.find({
      role: 'doctor',
      $or: [
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') }
      ]
    }).select('_id');

    if (users.length > 0) {
      searchQuery.$or.push({
        user: { $in: users.map(u => u._id) }
      });
    }

    const doctors = await Doctor.find(searchQuery)
      .populate('user', 'firstName lastName profileImage')
      .sort({ 'rating.average': -1 })
      .limit(parseInt(limit))
      .select('-reviews');

    res.json({ doctors });
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ message: 'Server error searching doctors' });
  }
});

// Get current doctor's profile (doctor only)
router.get('/profile/me', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('reviews.patient', 'firstName lastName');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ doctor });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ message: 'Server error fetching doctor profile' });
  }
});

// Update doctor profile (doctor only)
router.put('/profile/me', authenticateToken, requireDoctor, [
  body('specialization').optional().isIn([
    'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology',
    'Gynecology', 'Ophthalmology', 'ENT', 'Emergency Medicine',
    'Family Medicine', 'Internal Medicine', 'Anesthesiology'
  ]).withMessage('Invalid specialization'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters')
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
      specialization,
      experience,
      education,
      certifications,
      languages,
      bio,
      consultationFee,
      clinicAddress,
      telemedicineEnabled
    } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Update fields
    if (specialization) doctor.specialization = specialization;
    if (experience !== undefined) doctor.experience = experience;
    if (education) doctor.education = education;
    if (certifications) doctor.certifications = certifications;
    if (languages) doctor.languages = languages;
    if (bio) doctor.bio = bio;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (clinicAddress) doctor.clinicAddress = clinicAddress;
    if (telemedicineEnabled !== undefined) doctor.telemedicineEnabled = telemedicineEnabled;

    await doctor.save();

    res.json({
      message: 'Profile updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ message: 'Server error updating doctor profile' });
  }
});

// Update doctor availability (doctor only)
router.put('/availability', authenticateToken, requireDoctor, [
  body('availability').isArray().withMessage('Availability must be an array'),
  body('availability.*.day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day'),
  body('availability.*.slots').isArray().withMessage('Slots must be an array'),
  body('availability.*.slots.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),
  body('availability.*.slots.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { availability } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Validate time slots
    for (const dayAvailability of availability) {
      for (const slot of dayAvailability.slots) {
        const startTime = new Date(`2000-01-01T${slot.startTime}`);
        const endTime = new Date(`2000-01-01T${slot.endTime}`);
        
        if (startTime >= endTime) {
          return res.status(400).json({
            message: `Invalid time slot: ${slot.startTime} - ${slot.endTime}. Start time must be before end time.`
          });
        }
      }
    }

    doctor.availability = availability;
    await doctor.save();

    res.json({
      message: 'Availability updated successfully',
      availability: doctor.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error updating availability' });
  }
});

// Add review for doctor (patient only)
router.post('/:doctorId/review', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { doctorId } = req.params;
    const { rating, comment } = req.body;

    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can leave reviews' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if patient has already reviewed this doctor
    const existingReview = doctor.reviews.find(
      review => review.patient.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this doctor' });
    }

    // Add review
    doctor.reviews.push({
      patient: req.user._id,
      rating,
      comment,
      date: new Date()
    });

    // Recalculate average rating
    doctor.calculateAverageRating();
    await doctor.save();

    res.status(201).json({
      message: 'Review added successfully',
      review: doctor.reviews[doctor.reviews.length - 1]
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
});

// Get doctor statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    const activeDoctors = await Doctor.countDocuments({ isActive: true });
    const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });

    const specializationStats = await Doctor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const avgRating = await Doctor.aggregate([
      { $match: { isActive: true, 'rating.count': { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
    ]);

    res.json({
      totalDoctors,
      activeDoctors,
      verifiedDoctors,
      specializationStats,
      averageRating: avgRating[0]?.avgRating || 0
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({ message: 'Server error fetching doctor stats' });
  }
});

module.exports = router;