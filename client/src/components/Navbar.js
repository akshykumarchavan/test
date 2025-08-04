import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Calendar, 
  Stethoscope, 
  UserCheck, 
  Settings,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!user) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">HealthCare</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">HealthCare</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
            >
              <Calendar className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/appointments"
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments</span>
            </Link>

            {user.role === 'patient' && (
              <Link
                to="/book-appointment"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </Link>
            )}

            {user.role === 'doctor' && (
              <Link
                to="/doctor-dashboard"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor Dashboard</span>
              </Link>
            )}

            <div className="relative group">
              <button className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{user.firstName}</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                
                {user.role === 'doctor' && (
                  <Link
                    to="/doctor-profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Doctor Profile</span>
                  </Link>
                )}
                
                {user.role === 'patient' && (
                  <Link
                    to="/patient-profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Patient Profile</span>
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/appointments"
                className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                <span>Appointments</span>
              </Link>

              {user.role === 'patient' && (
                <Link
                  to="/book-appointment"
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </Link>
              )}

              {user.role === 'doctor' && (
                <Link
                  to="/doctor-dashboard"
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor Dashboard</span>
                </Link>
              )}

              <Link
                to="/profile"
                className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserCheck className="w-4 h-4" />
                <span>Profile</span>
              </Link>

              {user.role === 'doctor' && (
                <Link
                  to="/doctor-profile"
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor Profile</span>
                </Link>
              )}

              {user.role === 'patient' && (
                <Link
                  to="/patient-profile"
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Patient Profile</span>
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="text-gray-600 hover:text-blue-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;