import React from 'react';
import { Calendar } from 'lucide-react';

const AppointmentList = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Appointments
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage your appointments.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Appointment List</h3>
              <p className="mt-1 text-sm text-gray-500">
                This page will show all your appointments with filtering and management options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentList;