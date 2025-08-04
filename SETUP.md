# Quick Setup Guide

## Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- Git

## Installation Steps

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd healthcare-appointment-system
   npm run install-deps
   ```

2. **Environment Setup**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB
   mongod
   
   # Seed database
   npm run seed
   ```

4. **Start Application**
   ```bash
   # From root directory
   npm run dev
   ```

## Default Login Credentials

- **Admin**: admin@healthcare.com / admin123
- **Doctor**: dr.smith@healthcare.com / doctor123
- **Patient**: alice@example.com / patient123

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Key Features to Test

1. **Patient Flow**
   - Register/Login as patient
   - Browse doctors
   - Book appointment
   - View appointments

2. **Doctor Flow**
   - Login as doctor
   - View dashboard
   - Manage appointments
   - Update availability

3. **Admin Flow**
   - Login as admin
   - View system statistics
   - Manage users/doctors
   - System settings

## Email Testing

For testing email notifications:
1. Use a Gmail account with 2FA enabled
2. Generate an app password
3. Update EMAIL_USER and EMAIL_PASS in .env
4. Test appointment booking to receive emails

## Common Issues

- **MongoDB Connection**: Ensure MongoDB is running
- **Port Conflicts**: Change PORT in .env if 5000 is occupied
- **Email Issues**: Verify Gmail credentials and app password
- **Dependencies**: Run `npm run install-deps` if packages are missing