# Healthcare Appointment Scheduling System

A comprehensive healthcare appointment scheduling system with email notifications and role-based dashboards for patients, doctors, and administrators. Built with Node.js/Express backend, React frontend, and MongoDB database.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Email Notifications** - Automated emails for appointment confirmations, reminders, and cancellations
- **Multi-role System** - Separate interfaces for Patients, Doctors, and Administrators
- **Appointment Management** - Book, view, update, and cancel appointments
- **Doctor Profiles** - Detailed doctor information with specializations, ratings, and availability
- **Medical Records** - Patient medical history, prescriptions, and reports
- **Telemedicine Support** - Virtual appointment options

### Patient Features
- Browse and search doctors by specialization, location, and ratings
- Book appointments with real-time availability checking
- Manage personal medical history and health records
- View appointment history and upcoming appointments
- Rate and review doctors
- Receive email notifications for appointments

### Doctor Features
- Comprehensive dashboard with appointment statistics
- Manage appointment schedules and availability
- Update patient appointments and add prescriptions
- View patient information and medical history
- Manage profile, bio, and clinic information

### Admin Features
- System overview with comprehensive statistics
- User management (patients, doctors, admins)
- Doctor verification and activation
- Appointment monitoring and management
- System settings and configuration

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **Bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React** - Frontend framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React DatePicker** - Date selection
- **React Toastify** - Notifications
- **Heroicons** - Icon library

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/healthcare-appointment-system.git
cd healthcare-appointment-system
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare-appointment-system
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Healthcare System <your-email@gmail.com>

# Application Settings
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup

Start MongoDB service and seed the database:

```bash
# Start MongoDB (if not running as service)
mongod

# Seed the database with sample data
cd server
npm run seed
```

### 5. Start the Application

```bash
# From the root directory, start both server and client
npm run dev

# Or start them separately:
# Terminal 1 - Start the server
cd server
npm run dev

# Terminal 2 - Start the client
cd client
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Default User Accounts

After seeding the database, you can log in with these accounts:

### Admin Account
- **Email**: admin@healthcare.com
- **Password**: admin123

### Doctor Accounts
- **Dr. John Smith (Cardiology)**: dr.smith@healthcare.com / doctor123
- **Dr. Sarah Johnson (Pediatrics)**: dr.johnson@healthcare.com / doctor123
- **Dr. Michael Brown (General Practice)**: dr.brown@healthcare.com / doctor123

### Patient Accounts
- **Alice Wilson**: alice@example.com / patient123
- **Bob Davis**: bob@example.com / patient123

## 📁 Project Structure

```
healthcare-appointment-system/
├── server/                 # Backend application
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic services
│   ├── scripts/           # Database scripts
│   └── index.js           # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static files
└── README.md              # Project documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Doctors
- `GET /api/doctors` - Get all doctors (with filters)
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/search/:query` - Search doctors
- `PUT /api/doctors/profile/me` - Update doctor profile (Doctor only)
- `PUT /api/doctors/availability` - Update availability (Doctor only)

### Appointments
- `GET /api/appointments/available-slots/:doctorId/:date` - Get available slots
- `POST /api/appointments/book` - Book appointment (Patient only)
- `GET /api/appointments/my-appointments` - Get user's appointments
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/status` - Update appointment status (Doctor only)

### Patients
- `GET /api/patients/profile/me` - Get patient profile
- `PUT /api/patients/medical-history` - Update medical history
- `PUT /api/patients/vitals` - Update vitals
- `PUT /api/patients/insurance` - Update insurance info

### Admin
- `GET /api/admin/stats/overview` - System statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/doctors` - Get all doctors
- `PUT /api/admin/doctors/:id/verify` - Verify doctor
- `PUT /api/admin/users/:id/status` - Activate/deactivate user

## 🔧 Configuration

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password for the application
3. Update the `.env` file with your Gmail credentials

### MongoDB Configuration
- Default connection: `mongodb://localhost:27017/healthcare-appointment-system`
- For production, use MongoDB Atlas or your preferred cloud database

### Environment Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `EMAIL_USER` - Email account for notifications
- `EMAIL_PASS` - Email account password/app password

## 🧪 Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables
3. Deploy using Git

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `build` folder
3. Configure environment variables

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Update the `MONGODB_URI` in environment variables
3. Whitelist deployment IP addresses

## 🔒 Security Features

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Express Validator for request validation
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Cross-origin request protection
- **Helmet.js** - Security headers

## 📧 Email Templates

The system includes professional email templates for:
- Welcome emails for new users
- Appointment confirmation notifications
- Appointment reminder emails
- Appointment cancellation notifications
- Doctor notifications for new appointments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@healthcare-system.com

## 📈 Future Enhancements

- **Mobile App** - React Native mobile application
- **Video Calling** - Integrated telemedicine video calls
- **Payment Integration** - Online payment processing
- **Insurance Integration** - Insurance verification and claims
- **AI Chatbot** - Patient support chatbot
- **Multi-language Support** - Internationalization
- **Advanced Analytics** - Detailed reporting and analytics
- **API Documentation** - Swagger/OpenAPI documentation

---

Built with ❤️ for better healthcare accessibility