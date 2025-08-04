# Healthcare Appointment Scheduling System

A comprehensive healthcare appointment scheduling system with email notifications and a Doctor UI, designed for clinics, hospitals, and telemedicine platforms.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - Secure login/register system
  - Role-based access (Patient, Doctor, Admin)
  - JWT token authentication

- **Appointment Management**
  - Book appointments with available doctors
  - Real-time availability checking
  - Appointment status tracking (Scheduled, Confirmed, Completed, Cancelled)
  - Conflict detection and prevention

- **Doctor Dashboard**
  - View and manage appointments
  - Update appointment status
  - View patient information
  - Track earnings and statistics
  - Manage availability schedule

- **Patient Dashboard**
  - Book new appointments
  - View appointment history
  - Track medical records
  - Manage profile information

- **Email Notifications**
  - Appointment confirmation emails
  - Reminder notifications
  - Cancellation notifications
  - Custom email templates

- **Advanced Features**
  - Real-time availability slots
  - Doctor search and filtering
  - Medical history tracking
  - Prescription management
  - Payment status tracking

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Styled Components** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Toastify** - Notifications
- **React Icons** - Icon library

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd healthcare-appointment-system
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Windows)
net start MongoDB
```

### 5. Email Configuration
For email notifications to work, configure your email service:

#### Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Update `.env` file:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Alternative Email Services
- **Outlook/Hotmail**: Use `outlook` as service
- **SendGrid**: Use `sendgrid` as service with API key
- **AWS SES**: Use `ses` as service with AWS credentials

### 6. Start the Application

#### Development Mode
```bash
# Start the server (from root directory)
npm run dev

# Start the client (in a new terminal, from root directory)
npm run client
```

#### Production Mode
```bash
# Build the client
npm run build

# Start the server
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📱 Usage Guide

### For Patients

1. **Registration/Login**
   - Create an account or login with existing credentials
   - Complete your profile with personal information

2. **Book Appointment**
   - Browse available doctors
   - Select a doctor and view their availability
   - Choose a convenient time slot
   - Provide appointment reason and symptoms
   - Confirm booking

3. **Manage Appointments**
   - View upcoming appointments
   - Cancel or reschedule appointments
   - Access medical history
   - Update profile information

### For Doctors

1. **Profile Setup**
   - Complete doctor profile with specialization
   - Set consultation fees
   - Configure availability schedule
   - Add education and certifications

2. **Appointment Management**
   - View daily appointments
   - Confirm or cancel appointments
   - Mark appointments as completed
   - Add prescription and notes

3. **Dashboard Analytics**
   - Track appointment statistics
   - Monitor earnings
   - View patient information
   - Manage availability

### For Administrators

1. **System Management**
   - Monitor all appointments
   - Manage user accounts
   - Send bulk notifications
   - View system statistics

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get single appointment
- `PATCH /api/appointments/:id/status` - Update status
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/appointments/available-slots/:doctorId` - Get available slots

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/stats/:id` - Get doctor statistics

### Patients
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/medical-history` - Get medical history
- `GET /api/patients/stats` - Get patient statistics

### Email
- `POST /api/email/send` - Send custom email
- `POST /api/email/bulk` - Send bulk emails

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  role: String, // 'patient', 'doctor', 'admin'
  firstName: String,
  lastName: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: Object,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Doctors Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  specialization: String,
  licenseNumber: String,
  experience: Number,
  education: Array,
  certifications: Array,
  consultationFee: Number,
  availability: Object,
  isAvailable: Boolean,
  rating: Number,
  bio: String
}
```

### Appointments Collection
```javascript
{
  _id: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  appointmentDate: Date,
  startTime: String,
  endTime: String,
  status: String,
  reason: String,
  symptoms: String,
  doctorNotes: String,
  prescription: Object,
  amount: Number,
  paymentStatus: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Express-validator for request validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **Environment Variables**: Secure configuration management

## 📧 Email Notifications

The system sends automated emails for:
- Appointment confirmations
- Appointment reminders (24 hours before)
- Appointment cancellations
- Doctor notifications for new appointments

### Email Templates
- Professional HTML templates
- Responsive design
- Branded styling
- Clear call-to-action buttons

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Add MongoDB add-on
5. Configure environment variables
6. Deploy the application

### Docker Deployment
```bash
# Build the Docker image
docker build -t healthcare-appointment-system .

# Run the container
docker run -p 3000:3000 -p 5000:5000 healthcare-appointment-system
```

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
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Future Enhancements

- **Video Consultations**: Integrate video calling
- **Payment Integration**: Stripe/PayPal integration
- **Mobile App**: React Native mobile application
- **AI Chatbot**: Patient support chatbot
- **Analytics Dashboard**: Advanced analytics and reporting
- **Multi-language Support**: Internationalization
- **SMS Notifications**: Text message reminders
- **Calendar Integration**: Google/Outlook calendar sync

---

**Note**: This is a comprehensive healthcare appointment system designed for educational and commercial use. Please ensure compliance with local healthcare regulations and data protection laws when deploying in production.