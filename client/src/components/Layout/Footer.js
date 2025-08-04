import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HeartIcon className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">HealthCare</span>
            </div>
            <p className="text-gray-300 text-sm">
              Comprehensive healthcare appointment scheduling system connecting patients with qualified healthcare providers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/doctors" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Find Doctors
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Specializations</h3>
            <ul className="space-y-2">
              <li className="text-gray-300 text-sm">Cardiology</li>
              <li className="text-gray-300 text-sm">Pediatrics</li>
              <li className="text-gray-300 text-sm">General Practice</li>
              <li className="text-gray-300 text-sm">Dermatology</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>📧 support@healthcare.com</p>
              <p>📞 +1 (555) 123-4567</p>
              <p>📍 123 Healthcare St, Medical City, MC 12345</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300 text-sm">
            © 2024 Healthcare Appointment System. All rights reserved.
            Built for better healthcare accessibility.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;