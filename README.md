# 🏥 Healthcare Appointment Scheduling System

A comprehensive healthcare appointment scheduling system with email notifications and a dedicated Doctor UI. This system is designed for clinics, hospitals, and telemedicine platforms.

## ✨ Features

### 🔐 Authentication & User Management
- **Multi-role authentication** (Doctor, Patient, Admin)
- **Secure JWT token-based authentication**
- **Password hashing with bcrypt**
- **Role-based access control**

### 📅 Appointment Management
- **Book appointments** with available doctors
- **Real-time availability checking**
- **Appointment status tracking** (Scheduled, Confirmed, Completed, Cancelled)
- **Conflict detection** for overlapping appointments
- **Duration-based scheduling**

### 👨‍⚕️ Doctor Features
- **Doctor Dashboard** with statistics and patient overview
- **Patient management** and medical history
- **Appointment scheduling** and status updates
- **Profile management** with specialization and experience
- **Working hours** and availability settings

### 👤 Patient Features
- **Patient Dashboard** with appointment history
- **Medical history tracking**
- **Doctor search** and selection
- **Appointment booking** with symptoms description
- **Profile management** with medical information

### 📧 Email Notifications
- **Appointment confirmations**
- **Status update notifications**
- **Cancellation notifications**
- **Reminder emails** for upcoming appointments
- **Customizable email templates**

### 🎨 Modern UI/UX
- **Responsive design** for all devices
- **Modern React frontend** with TypeScript
- **Tailwind CSS** for styling
- **Intuitive navigation** and user experience
- **Real-time updates** and notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- SQLite (included)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-appointment-system
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Email Configuration (Optional)
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Start the development servers**
   ```bash
   # Start both server and client
   npm run dev
   
   # Or start them separately:
   # Server only
   npm run server
   
   # Client only
   cd client && npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Book new appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `PUT /api/appointments/:id` - Update appointment details
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/available-slots/:doctorId` - Get available slots

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/profile/me` - Get doctor profile
- `PUT /api/doctors/profile/me` - Update doctor profile
- `GET /api/doctors/schedule/me` - Get doctor schedule
- `GET /api/doctors/stats` - Get doctor statistics

### Patients
- `GET /api/patients/profile/me` - Get patient profile
- `PUT /api/patients/profile/me` - Update patient profile
- `GET /api/patients/medical-history` - Get medical history
- `GET /api/patients/stats` - Get patient statistics

### Email Management
- `POST /api/email/test` - Test email configuration
- `POST /api/email/send-reminders` - Send reminder emails
- `GET /api/email/notifications` - Get email history
- `GET /api/email/stats` - Get email statistics

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (doctor, patient, admin)
- `first_name`, `last_name` - User names
- `phone` - Contact number
- `created_at`, `updated_at` - Timestamps

### Doctors Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `specialization` - Medical specialization
- `license_number` - Medical license
- `experience_years` - Years of experience
- `bio` - Doctor biography
- `consultation_fee` - Appointment fee
- `available_days`, `working_hours` - Schedule

### Patients Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `date_of_birth` - Patient birth date
- `gender` - Patient gender
- `blood_group` - Blood type
- `emergency_contact` - Emergency contact
- `medical_history` - Medical history
- `allergies` - Known allergies

### Appointments Table
- `id` - Primary key
- `patient_id`, `doctor_id` - Foreign keys
- `appointment_date`, `appointment_time` - Schedule
- `duration` - Appointment duration
- `status` - Appointment status
- `symptoms`, `diagnosis`, `prescription` - Medical info
- `notes` - Additional notes

## 🎯 Usage Examples

### For Patients

1. **Register as a Patient**
   - Visit http://localhost:3000/register
   - Select "Patient" role
   - Fill in your details

2. **Book an Appointment**
   - Login to your account
   - Navigate to "Book Appointment"
   - Select a doctor and available time slot
   - Add symptoms and book

3. **View Appointments**
   - Check upcoming appointments on dashboard
   - View medical history
   - Cancel appointments if needed

### For Doctors

1. **Register as a Doctor**
   - Visit http://localhost:3000/register
   - Select "Doctor" role
   - Fill in professional details

2. **Manage Appointments**
   - View today's appointments
   - Update appointment status
   - Add diagnosis and prescriptions

3. **Patient Management**
   - View patient list
   - Access medical history
   - Update patient information

## 🔧 Configuration

### Email Setup (Optional)

To enable email notifications:

1. **Gmail Setup**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

2. **Generate App Password**
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate app password for this application

3. **Test Email Configuration**
   ```bash
   curl -X POST http://localhost:5000/api/email/test
   ```

### Production Deployment

1. **Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   CLIENT_URL=https://your-domain.com
   ```

2. **Build the Application**
   ```bash
   # Build React app
   cd client
   npm run build
   cd ..
   
   # Start production server
   npm start
   ```

3. **Database Backup**
   ```bash
   # Backup SQLite database
   cp server/data/healthcare.db backup/
   ```

## 🛠️ Development

### Project Structure
```
healthcare-appointment-system/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── data/            # SQLite database
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── styles/      # CSS styles
│   └── public/          # Static assets
└── docs/                # Documentation
```

### Adding New Features

1. **Backend API**
   - Add routes in `server/routes/`
   - Create services in `server/services/`
   - Update database schema if needed

2. **Frontend Components**
   - Create components in `client/src/components/`
   - Add pages in `client/src/pages/`
   - Update routing in `App.js`

3. **Database Changes**
   - Modify schema in `server/config/database.js`
   - Run database migrations if needed

## 🧪 Testing

### API Testing
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Frontend Testing
```bash
cd client
npm test
```

## 📊 Monitoring

### Health Checks
- API Health: `GET /api/health`
- Database Status: Check server logs
- Email Status: Check email service logs

### Logs
- Server logs: Check console output
- Database logs: SQLite logs in server/data/
- Email logs: Check email service responses

## 🔒 Security Features

- **JWT Authentication** with secure tokens
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **CORS Protection** for cross-origin requests
- **Helmet Security** headers
- **SQL Injection Protection** with parameterized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Heroku Deployment
```bash
# Add Heroku remote
heroku create your-app-name

# Deploy
git push heroku main

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

---

**Built with ❤️ for the healthcare community**