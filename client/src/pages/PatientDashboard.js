import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User,
  Stethoscope,
  Plus,
  Phone,
  Mail
} from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient statistics
      const statsResponse = await axios.get('/api/patients/stats');
      setStats(statsResponse.data.stats);

      // Fetch upcoming appointments
      const appointmentsResponse = await axios.get('/api/patients/appointments/upcoming');
      setUpcomingAppointments(appointmentsResponse.data.appointments);

      // Fetch recent doctors
      const doctorsResponse = await axios.get('/api/patients/doctors');
      setRecentDoctors(doctorsResponse.data.doctors.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Patient Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your healthcare appointments and medical history.
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Appointments
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalAppointments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.completedAppointments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Upcoming
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.upcomingAppointments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Cancelled
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.cancelledAppointments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Upcoming Appointments
                </h3>
                <button
                  onClick={() => navigate('/appointments')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </button>
              </div>
              
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming appointments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You have no appointments scheduled.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/book-appointment')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book Appointment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Stethoscope className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.specialization}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                            </p>
                            {appointment.symptoms && (
                              <p className="text-xs text-gray-400 mt-1">
                                Symptoms: {appointment.symptoms}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          <button
                            onClick={() => navigate(`/appointments/${appointment.id}`)}
                            className="text-blue-600 hover:text-blue-500 text-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Doctors */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Doctors
                </h3>
                <button
                  onClick={() => navigate('/doctors')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Find doctors
                </button>
              </div>
              
              {recentDoctors.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't seen any doctors yet.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/book-appointment')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book First Appointment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDoctors.map((doctor) => (
                    <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {doctor.first_name} {doctor.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doctor.specialization} • {doctor.experience_years} years experience
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {doctor.appointment_count} appointment(s) • Last: {doctor.last_appointment ? formatDate(doctor.last_appointment) : 'Never'}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/doctors/${doctor.id}`)}
                          className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/book-appointment')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5 text-gray-400 mr-2" />
                Book Appointment
              </button>

              <button
                onClick={() => navigate('/appointments')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                View Appointments
              </button>

              <button
                onClick={() => navigate('/patient-profile')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <User className="h-5 w-5 text-gray-400 mr-2" />
                Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Medical History Summary */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Medical History Summary
              </h3>
              <button
                onClick={() => navigate('/medical-history')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View full history
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.completedAppointments || 0}
                </div>
                <div className="text-sm text-gray-500">Completed Visits</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {recentDoctors.length}
                </div>
                <div className="text-sm text-gray-500">Doctors Seen</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.totalAppointments || 0}
                </div>
                <div className="text-sm text-gray-500">Total Appointments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;