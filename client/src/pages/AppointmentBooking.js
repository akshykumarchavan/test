import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  MapPin, 
  Phone,
  Mail,
  Star,
  Search
} from 'lucide-react';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const selectedDoctorId = watch('doctorId');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchAvailableSlots(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors');
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const response = await axios.get(`/api/appointments/available-slots/${doctorId}?date=${date}`);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available time slots');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const appointmentData = {
        doctorId: parseInt(data.doctorId),
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        symptoms: data.symptoms,
        duration: 30 // Default 30 minutes
      };

      const response = await axios.post('/api/appointments', appointmentData);
      
      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to book appointment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Book an Appointment
          </h1>
          <p className="mt-2 text-gray-600">
            Select a doctor and choose an available time slot for your appointment.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Doctor Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Select a Doctor
            </h2>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search doctors by name or specialization..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Doctor List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDoctorId === doctor.id.toString()
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <input
                    type="radio"
                    value={doctor.id}
                    {...register('doctorId', { required: 'Please select a doctor' })}
                    className="sr-only"
                  />
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doctor.specialization}
                      </p>
                      {doctor.experience_years && (
                        <p className="text-xs text-gray-400">
                          {doctor.experience_years} years experience
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {errors.doctorId && (
              <p className="mt-2 text-sm text-red-600">{errors.doctorId.message}</p>
            )}
          </div>

          {/* Appointment Details */}
          {selectedDoctorId && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Appointment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    {...register('appointmentDate', { 
                      required: 'Please select a date',
                      min: {
                        value: getMinDate(),
                        message: 'Date must be today or later'
                      },
                      max: {
                        value: getMaxDate(),
                        message: 'Date cannot be more than 3 months from now'
                      }
                    })}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  {errors.appointmentDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.appointmentDate.message}</p>
                  )}
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Time
                  </label>
                  <select
                    {...register('appointmentTime', { required: 'Please select a time' })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!selectedDate || availableSlots.length === 0}
                  >
                    <option value="">Select a time</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </option>
                    ))}
                  </select>
                  {errors.appointmentTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.appointmentTime.message}</p>
                  )}
                  {selectedDate && availableSlots.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No available slots for this date. Please select another date.
                    </p>
                  )}
                </div>
              </div>

              {/* Symptoms */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms (Optional)
                </label>
                <textarea
                  {...register('symptoms')}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe your symptoms or reason for the appointment..."
                />
              </div>
            </div>
          )}

          {/* Selected Doctor Info */}
          {selectedDoctor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selected Doctor
              </h3>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedDoctor.specialization}
                  </p>
                  {selectedDoctor.experience_years && (
                    <p className="text-sm text-gray-500">
                      {selectedDoctor.experience_years} years of experience
                    </p>
                  )}
                  {selectedDoctor.bio && (
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedDoctor.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDoctorId}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </div>
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentBooking;