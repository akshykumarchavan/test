const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { authenticateToken, requirePatient, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get patient profile
router.get('/profile/me', authenticateToken, requirePatient, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email phone dateOfBirth gender address profileImage')
      .populate('preferredDoctor', 'specialization user');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: 'Server error fetching patient profile' });
  }
});

// Update patient medical history
router.put('/medical-history', authenticateToken, requirePatient, [
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('chronicConditions').optional().isArray().withMessage('Chronic conditions must be an array'),
  body('medications').optional().isArray().withMessage('Medications must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { allergies, chronicConditions, medications, surgeries, familyHistory } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Update medical history
    if (allergies) patient.medicalHistory.allergies = allergies;
    if (chronicConditions) patient.medicalHistory.chronicConditions = chronicConditions;
    if (medications) patient.medicalHistory.medications = medications;
    if (surgeries) patient.medicalHistory.surgeries = surgeries;
    if (familyHistory) patient.medicalHistory.familyHistory = familyHistory;

    await patient.save();

    res.json({
      message: 'Medical history updated successfully',
      medicalHistory: patient.medicalHistory
    });
  } catch (error) {
    console.error('Error updating medical history:', error);
    res.status(500).json({ message: 'Server error updating medical history' });
  }
});

// Update patient vitals
router.put('/vitals', authenticateToken, requirePatient, [
  body('height.value').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('weight.value').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { height, weight, bloodType } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Update vitals
    if (height) patient.vitals.height = height;
    if (weight) patient.vitals.weight = weight;
    if (bloodType) patient.vitals.bloodType = bloodType;

    await patient.save();

    res.json({
      message: 'Vitals updated successfully',
      vitals: patient.vitals,
      bmi: patient.bmi,
      bmiCategory: patient.getBMICategory()
    });
  } catch (error) {
    console.error('Error updating vitals:', error);
    res.status(500).json({ message: 'Server error updating vitals' });
  }
});

// Update insurance information
router.put('/insurance', authenticateToken, requirePatient, async (req, res) => {
  try {
    const { provider, policyNumber, groupNumber, expiryDate, copay } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Update insurance
    patient.insurance = {
      provider: provider || patient.insurance.provider,
      policyNumber: policyNumber || patient.insurance.policyNumber,
      groupNumber: groupNumber || patient.insurance.groupNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : patient.insurance.expiryDate,
      copay: copay !== undefined ? copay : patient.insurance.copay
    };

    await patient.save();

    res.json({
      message: 'Insurance information updated successfully',
      insurance: patient.insurance
    });
  } catch (error) {
    console.error('Error updating insurance:', error);
    res.status(500).json({ message: 'Server error updating insurance' });
  }
});

// Update emergency contact
router.put('/emergency-contact', authenticateToken, requirePatient, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, relationship, phone, email } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Update emergency contact
    patient.emergencyContact = {
      name,
      relationship,
      phone,
      email
    };

    await patient.save();

    res.json({
      message: 'Emergency contact updated successfully',
      emergencyContact: patient.emergencyContact
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ message: 'Server error updating emergency contact' });
  }
});

// Update preferences
router.put('/preferences', authenticateToken, requirePatient, [
  body('communicationMethod').optional().isIn(['email', 'sms', 'phone', 'app']).withMessage('Invalid communication method'),
  body('reminderTime').optional().isInt({ min: 1, max: 168 }).withMessage('Reminder time must be between 1 and 168 hours')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { communicationMethod, reminderTime, language } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Update preferences
    if (communicationMethod) patient.preferences.communicationMethod = communicationMethod;
    if (reminderTime) patient.preferences.reminderTime = reminderTime;
    if (language) patient.preferences.language = language;

    await patient.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: patient.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

// Add medical report
router.post('/medical-reports', authenticateToken, requirePatient, [
  body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('type').isIn(['lab', 'imaging', 'prescription', 'diagnosis', 'other']).withMessage('Invalid report type'),
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { title, type, date, doctor, fileUrl, notes } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Add medical report
    patient.medicalReports.push({
      title,
      type,
      date: new Date(date),
      doctor,
      fileUrl,
      notes
    });

    await patient.save();

    res.status(201).json({
      message: 'Medical report added successfully',
      report: patient.medicalReports[patient.medicalReports.length - 1]
    });
  } catch (error) {
    console.error('Error adding medical report:', error);
    res.status(500).json({ message: 'Server error adding medical report' });
  }
});

// Get patient statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    
    const ageGroups = await Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $addFields: {
          age: {
            $divide: [
              { $subtract: [new Date(), '$userInfo.dateOfBirth'] },
              365.25 * 24 * 60 * 60 * 1000
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: 'Under 18' },
                { case: { $lt: ['$age', 30] }, then: '18-29' },
                { case: { $lt: ['$age', 50] }, then: '30-49' },
                { case: { $lt: ['$age', 65] }, then: '50-64' }
              ],
              default: '65+'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const bloodTypeStats = await Patient.aggregate([
      { $group: { _id: '$vitals.bloodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalPatients,
      ageGroups,
      bloodTypeStats
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({ message: 'Server error fetching patient stats' });
  }
});

module.exports = router;