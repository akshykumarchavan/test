const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-appointment-system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@healthcare.com',
      password: 'admin123',
      phone: '+1234567890',
      role: 'admin',
      isActive: true,
      emailVerified: true
    });
    await adminUser.save();
    console.log('Admin user created');

    // Create sample doctors
    const doctorsData = [
      {
        user: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'dr.smith@healthcare.com',
          password: 'doctor123',
          phone: '+1234567891',
          role: 'doctor',
          isActive: true,
          emailVerified: true
        },
        doctor: {
          specialization: 'Cardiology',
          licenseNumber: 'MD001',
          experience: 15,
          consultationFee: 200,
          bio: 'Experienced cardiologist with expertise in heart disease prevention and treatment.',
          languages: ['English', 'Spanish'],
          education: [
            {
              degree: 'MD',
              institution: 'Harvard Medical School',
              year: 2008
            }
          ],
          certifications: ['Board Certified Cardiologist', 'American Heart Association'],
          clinicAddress: {
            name: 'Heart Care Clinic',
            street: '123 Medical St',
            city: 'Boston',
            state: 'MA',
            zipCode: '02101',
            country: 'USA'
          },
          availability: [
            {
              day: 'Monday',
              slots: [
                { startTime: '09:00', endTime: '09:30', isAvailable: true },
                { startTime: '09:30', endTime: '10:00', isAvailable: true },
                { startTime: '10:00', endTime: '10:30', isAvailable: true },
                { startTime: '10:30', endTime: '11:00', isAvailable: true },
                { startTime: '14:00', endTime: '14:30', isAvailable: true },
                { startTime: '14:30', endTime: '15:00', isAvailable: true },
                { startTime: '15:00', endTime: '15:30', isAvailable: true }
              ]
            },
            {
              day: 'Tuesday',
              slots: [
                { startTime: '09:00', endTime: '09:30', isAvailable: true },
                { startTime: '09:30', endTime: '10:00', isAvailable: true },
                { startTime: '10:00', endTime: '10:30', isAvailable: true },
                { startTime: '14:00', endTime: '14:30', isAvailable: true },
                { startTime: '14:30', endTime: '15:00', isAvailable: true }
              ]
            },
            {
              day: 'Wednesday',
              slots: [
                { startTime: '09:00', endTime: '09:30', isAvailable: true },
                { startTime: '09:30', endTime: '10:00', isAvailable: true },
                { startTime: '10:00', endTime: '10:30', isAvailable: true },
                { startTime: '10:30', endTime: '11:00', isAvailable: true }
              ]
            }
          ],
          isVerified: true,
          isActive: true
        }
      },
      {
        user: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'dr.johnson@healthcare.com',
          password: 'doctor123',
          phone: '+1234567892',
          role: 'doctor',
          isActive: true,
          emailVerified: true
        },
        doctor: {
          specialization: 'Pediatrics',
          licenseNumber: 'MD002',
          experience: 10,
          consultationFee: 150,
          bio: 'Dedicated pediatrician focused on child health and development.',
          languages: ['English'],
          education: [
            {
              degree: 'MD',
              institution: 'Johns Hopkins University',
              year: 2013
            }
          ],
          certifications: ['Board Certified Pediatrician'],
          clinicAddress: {
            name: 'Children\'s Health Center',
            street: '456 Kids Ave',
            city: 'Baltimore',
            state: 'MD',
            zipCode: '21201',
            country: 'USA'
          },
          availability: [
            {
              day: 'Monday',
              slots: [
                { startTime: '08:00', endTime: '08:30', isAvailable: true },
                { startTime: '08:30', endTime: '09:00', isAvailable: true },
                { startTime: '09:00', endTime: '09:30', isAvailable: true },
                { startTime: '13:00', endTime: '13:30', isAvailable: true },
                { startTime: '13:30', endTime: '14:00', isAvailable: true }
              ]
            },
            {
              day: 'Thursday',
              slots: [
                { startTime: '08:00', endTime: '08:30', isAvailable: true },
                { startTime: '08:30', endTime: '09:00', isAvailable: true },
                { startTime: '13:00', endTime: '13:30', isAvailable: true }
              ]
            },
            {
              day: 'Friday',
              slots: [
                { startTime: '08:00', endTime: '08:30', isAvailable: true },
                { startTime: '08:30', endTime: '09:00', isAvailable: true },
                { startTime: '09:00', endTime: '09:30', isAvailable: true }
              ]
            }
          ],
          isVerified: true,
          isActive: true
        }
      },
      {
        user: {
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'dr.brown@healthcare.com',
          password: 'doctor123',
          phone: '+1234567893',
          role: 'doctor',
          isActive: true,
          emailVerified: true
        },
        doctor: {
          specialization: 'General Practice',
          licenseNumber: 'MD003',
          experience: 8,
          consultationFee: 120,
          bio: 'General practitioner providing comprehensive primary care services.',
          languages: ['English', 'French'],
          education: [
            {
              degree: 'MD',
              institution: 'University of California, San Francisco',
              year: 2015
            }
          ],
          certifications: ['Board Certified Family Medicine'],
          clinicAddress: {
            name: 'Family Care Medical Center',
            street: '789 Health Blvd',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA'
          },
          availability: [
            {
              day: 'Monday',
              slots: [
                { startTime: '09:00', endTime: '09:30', isAvailable: true },
                { startTime: '09:30', endTime: '10:00', isAvailable: true },
                { startTime: '15:00', endTime: '15:30', isAvailable: true },
                { startTime: '15:30', endTime: '16:00', isAvailable: true }
              ]
            },
            {
              day: 'Tuesday',
              slots: [
                { startTime: '10:00', endTime: '10:30', isAvailable: true },
                { startTime: '10:30', endTime: '11:00', isAvailable: true },
                { startTime: '16:00', endTime: '16:30', isAvailable: true }
              ]
            }
          ],
          isVerified: true,
          isActive: true
        }
      }
    ];

    const createdDoctors = [];
    for (const doctorData of doctorsData) {
      // Create user
      const user = new User(doctorData.user);
      await user.save();

      // Create doctor profile
      const doctor = new Doctor({
        ...doctorData.doctor,
        user: user._id
      });
      await doctor.save();

      createdDoctors.push({ user, doctor });
    }
    console.log('Sample doctors created');

    // Create sample patients
    const patientsData = [
      {
        firstName: 'Alice',
        lastName: 'Wilson',
        email: 'alice@example.com',
        password: 'patient123',
        phone: '+1234567894',
        role: 'patient',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'female',
        isActive: true,
        emailVerified: true
      },
      {
        firstName: 'Bob',
        lastName: 'Davis',
        email: 'bob@example.com',
        password: 'patient123',
        phone: '+1234567895',
        role: 'patient',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'male',
        isActive: true,
        emailVerified: true
      }
    ];

    for (const patientData of patientsData) {
      // Create user
      const user = new User(patientData);
      await user.save();

      // Create patient profile
      const patient = new Patient({
        user: user._id,
        medicalHistory: {
          allergies: ['Penicillin'],
          chronicConditions: [],
          medications: []
        },
        vitals: {
          bloodType: 'O+'
        },
        preferences: {
          communicationMethod: 'email',
          reminderTime: 24,
          language: 'en'
        }
      });
      await patient.save();
    }
    console.log('Sample patients created');

    console.log('Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@healthcare.com / admin123');
    console.log('Doctor 1: dr.smith@healthcare.com / doctor123');
    console.log('Doctor 2: dr.johnson@healthcare.com / doctor123');
    console.log('Doctor 3: dr.brown@healthcare.com / doctor123');
    console.log('Patient 1: alice@example.com / patient123');
    console.log('Patient 2: bob@example.com / patient123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeding script
seedDatabase();