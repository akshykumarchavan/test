# Healthcare Appointment Scheduling System

A comprehensive healthcare appointment scheduling system with email notifications and separate interfaces for patients, doctors, and administrators. Perfect for clinics, hospitals, and telemedicine platforms.

## 🏥 Features

### For Patients
- **User Registration & Authentication** - Secure account creation and login
- **Doctor Discovery** - Browse available doctors by specialization
- **Appointment Booking** - Schedule appointments with preferred doctors
- **Real-time Availability** - Check doctor availability and time slots
- **Appointment Management** - View, reschedule, and cancel appointments
- **Email Notifications** - Receive confirmation and reminder emails
- **Medical History** - Access to personal medical records

### For Doctors
- **Professional Dashboard** - Overview of daily schedule and statistics
- **Appointment Management** - View and manage patient appointments
- **Patient Records** - Access patient information and medical history
- **Availability Settings** - Configure working hours and availability
- **Medical Records** - Create and update patient medical records
- **Prescription Management** - Issue digital prescriptions

### For Administrators
- **System Dashboard** - Complete overview of system statistics
- **User Management** - Manage doctors, patients, and staff
- **Appointment Oversight** - Monitor all appointments across the system
- **Reports & Analytics** - Generate system usage reports
- **Email Management** - Monitor email notifications

### System Features
- **Email Notifications** - Automated appointment confirmations, reminders, and cancellations
- **Role-based Access Control** - Secure authentication with different user roles
- **Responsive Design** - Mobile-friendly interface for all devices
- **RESTful API** - Clean API architecture for easy integration
- **Data Security** - Encrypted passwords and secure data handling
- **Audit Trail** - Complete logging of system activities

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn
- Email account for SMTP (Gmail recommended for testing)

### Installation

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd healthcare-appointment-system
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize the database:**
```bash
npm run init-db
```

4. **Start the application:**
```bash
npm start
# or for development
npm run dev
```

5. **Access the application:**
Open http://localhost:3000 in your browser

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (Change in production!)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# System Configuration
SYSTEM_NAME=Healthcare Appointment System
SYSTEM_EMAIL=noreply@healthcare-system.com
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_PATH=./database/healthcare.db
```

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" for the application
3. Use your Gmail address and the app password in the environment variables

## 👥 Default Accounts

The system comes with pre-configured demo accounts:

### Admin Account
- **Email:** admin@healthcare.com
- **Password:** admin123
- **Role:** Administrator

### Doctor Accounts
- **Email:** dr.sarah@healthcare.com
- **Password:** doctor123
- **Specialization:** Cardiology

- **Email:** dr.michael@healthcare.com
- **Password:** doctor123
- **Specialization:** Pediatrics

- **Email:** dr.emily@healthcare.com
- **Password:** doctor123
- **Specialization:** Dermatology

### Patient Account
- **Email:** patient@demo.com
- **Password:** patient123
- **Role:** Patient

## 📱 Usage Guide

### For Patients

1. **Registration:**
   - Click "Register" on the homepage
   - Fill in personal details and select "Patient" role
   - Verify email and login

2. **Booking Appointments:**
   - Browse available doctors or search by specialization
   - Select a doctor and click "Book Appointment"
   - Choose date, time, and appointment type
   - Receive email confirmation

3. **Managing Appointments:**
   - View upcoming appointments on dashboard
   - Cancel or reschedule if needed
   - Access appointment history

### For Doctors

1. **Dashboard Overview:**
   - View today's appointments at a glance
   - Check upcoming schedule
   - Monitor patient statistics

2. **Managing Appointments:**
   - Update appointment status
   - Add diagnosis and prescription notes
   - Mark appointments as completed

3. **Setting Availability:**
   - Configure working hours and days
   - Block specific dates if unavailable
   - Update consultation fees

### For Administrators

1. **System Monitoring:**
   - View overall system statistics
   - Monitor user registrations
   - Track appointment trends

2. **User Management:**
   - Approve doctor registrations
   - Manage user accounts
   - Handle system settings

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "patient|doctor",
  "phone": "+1234567890"
}
```

#### POST /api/auth/login
User login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication)

### Appointment Endpoints

#### POST /api/appointments
Book a new appointment (patients only)
```json
{
  "doctor_id": 1,
  "appointment_date": "2024-01-15",
  "appointment_time": "10:00",
  "type": "consultation",
  "reason": "Regular checkup"
}
```

#### GET /api/appointments
Get user's appointments (filtered by role)

#### GET /api/appointments/:id
Get specific appointment details

#### PUT /api/appointments/:id
Update appointment (doctors only)

#### DELETE /api/appointments/:id
Cancel appointment

### Doctor Endpoints

#### GET /api/doctors
Get list of available doctors

#### GET /api/doctors/:id
Get doctor profile and statistics

#### GET /api/doctors/dashboard
Get doctor dashboard data (doctors only)

#### GET /api/appointments/availability/:doctorId/:date
Get available time slots for a doctor on a specific date

### Patient Endpoints

#### GET /api/patients/dashboard
Get patient dashboard data (patients only)

### Admin Endpoints

#### GET /api/admin/stats
Get system statistics (admins only)

## 🗄️ Database Schema

### Core Tables

- **users** - Basic user information and authentication
- **doctors** - Doctor-specific information (specialization, fees, etc.)
- **patients** - Patient-specific information (medical history, etc.)
- **appointments** - Appointment records with scheduling details
- **medical_records** - Patient medical history and doctor notes
- **email_notifications** - Email notification log
- **doctor_availability** - Custom availability settings

### Key Relationships

- Users have roles (patient, doctor, admin)
- Doctors can have multiple appointments
- Patients can have multiple appointments with different doctors
- Appointments link patients and doctors
- Medical records are created from appointments

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Different permissions for each user type
- **Input Validation** - Express-validator for all inputs
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Secure cross-origin requests
- **SQL Injection Prevention** - Parameterized queries

## 📧 Email Notifications

The system automatically sends emails for:

- **Welcome emails** - New user registration
- **Appointment confirmations** - Booking confirmations
- **Appointment reminders** - 24-hour advance reminders
- **Appointment cancellations** - Cancellation notifications
- **Password resets** - Security notifications

All emails are logged in the database for audit purposes.

## 🛠️ Development

### Project Structure
```
healthcare-appointment-system/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── appointments.js      # Appointment management
│   ├── doctors.js           # Doctor-related routes
│   ├── patients.js          # Patient-related routes
│   ├── admin.js             # Admin panel routes
│   └── medicalRecords.js    # Medical records
├── services/
│   └── emailService.js      # Email notification service
├── scripts/
│   └── init-db.js           # Database initialization
├── public/
│   └── index.html           # Frontend application
├── database/
│   └── healthcare.db        # SQLite database
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Initialize/reset database
npm run init-db

# Run tests (if implemented)
npm test
```

### Adding New Features

1. **Database Changes:** Update `scripts/init-db.js`
2. **API Routes:** Add routes in appropriate `routes/` file
3. **Frontend:** Update `public/index.html`
4. **Email Templates:** Modify `services/emailService.js`

## 🚀 Deployment

### Production Considerations

1. **Environment Variables:**
   - Use strong JWT secrets
   - Configure production email credentials
   - Set NODE_ENV=production

2. **Database:**
   - Consider PostgreSQL or MySQL for production
   - Implement database backups
   - Set up connection pooling

3. **Security:**
   - Enable HTTPS
   - Configure firewall rules
   - Set up monitoring and logging

4. **Performance:**
   - Enable gzip compression
   - Implement caching strategies
   - Use a reverse proxy (nginx)

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the documentation above
2. Review the demo accounts and test functionality
3. Check the API endpoints for integration
4. Review the database schema for data structure

## 🎯 Roadmap

Future enhancements planned:

- [ ] Mobile app (React Native)
- [ ] Video consultation integration
- [ ] Payment processing
- [ ] Insurance management
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] AI-powered health recommendations

---

**Built with ❤️ for better healthcare management**