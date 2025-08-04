import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import AppointmentBooking from './pages/AppointmentBooking';
import AppointmentList from './pages/AppointmentList';
import DoctorProfile from './pages/DoctorProfile';
import PatientProfile from './pages/PatientProfile';
import DoctorSearch from './pages/DoctorSearch';
import MedicalHistory from './pages/MedicalHistory';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = React.useContext(AuthProvider);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doctors" element={<DoctorSearch />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/doctor-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/patient-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/book-appointment" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <AppointmentBooking />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/appointments" 
                element={
                  <ProtectedRoute>
                    <AppointmentList />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/doctor-profile" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/patient-profile" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/medical-history" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <MedicalHistory />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;