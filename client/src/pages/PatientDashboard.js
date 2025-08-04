import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, 
  FaUser, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaDollarSign,
  FaPlus,
  FaHistory
} from 'react-icons/fa';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const WelcomeText = styled.h1`
  color: #333;
  font-size: 2rem;
  margin: 0;
`;

const DateDisplay = styled.div`
  color: #666;
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIcon = styled.div`
  font-size: 2rem;
  color: #667eea;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MainSection = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
`;

const ActionButton = styled(Link)`
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color 0.3s;
  
  &:hover {
    background: #5a6fd8;
  }
`;

const AppointmentList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const AppointmentItem = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const AppointmentInfo = styled.div`
  flex: 1;
`;

const DoctorName = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
`;

const AppointmentDetails = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  
  &.scheduled {
    background: #fff3cd;
    color: #856404;
  }
  
  &.confirmed {
    background: #d1ecf1;
    color: #0c5460;
  }
  
  &.completed {
    background: #d4edda;
    color: #155724;
  }
  
  &.cancelled {
    background: #f8d7da;
    color: #721c24;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SidebarTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
`;

const QuickAction = styled(Link)`
  display: block;
  width: 100%;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  text-align: center;
  transition: all 0.3s;
  
  &:hover {
    background: #667eea;
    color: white;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const NoAppointments = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalSpent: 0,
    upcomingAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, statsRes] = await Promise.all([
        axios.get('/api/appointments'),
        axios.get('/api/patients/stats')
      ]);

      setAppointments(appointmentsRes.data.appointments || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
    return timeString;
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div>Loading...</div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <div>
          <WelcomeText>Welcome back, {user?.firstName}!</WelcomeText>
          <DateDisplay>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</DateDisplay>
        </div>
      </DashboardHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon>
            <FaCalendarAlt />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.totalAppointments}</StatNumber>
            <StatLabel>Total Appointments</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaCheckCircle />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.completedAppointments}</StatNumber>
            <StatLabel>Completed</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaClock />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.upcomingAppointments}</StatNumber>
            <StatLabel>Upcoming</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaDollarSign />
          </StatIcon>
          <StatContent>
            <StatNumber>${stats.totalSpent}</StatNumber>
            <StatLabel>Total Spent</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <DashboardGrid>
        <MainSection>
          <SectionHeader>
            <SectionTitle>Upcoming Appointments</SectionTitle>
            <ActionButton to="/book-appointment">
              <FaPlus style={{ marginRight: '0.5rem' }} />
              Book New
            </ActionButton>
          </SectionHeader>
          
          <AppointmentList>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <AppointmentItem key={appointment._id}>
                  <AppointmentInfo>
                    <DoctorName>
                      Dr. {appointment.doctorId?.userId?.firstName} {appointment.doctorId?.userId?.lastName}
                    </DoctorName>
                    <AppointmentDetails>
                      {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      <br />
                      Specialization: {appointment.doctorId?.specialization}
                      <br />
                      Reason: {appointment.reason}
                    </AppointmentDetails>
                  </AppointmentInfo>
                  
                  <StatusBadge className={appointment.status}>
                    {appointment.status}
                  </StatusBadge>
                </AppointmentItem>
              ))
            ) : (
              <NoAppointments>
                <FaCalendarAlt style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
                <p>No upcoming appointments</p>
                <ActionButton to="/book-appointment" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Book Your First Appointment
                </ActionButton>
              </NoAppointments>
            )}
          </AppointmentList>
        </MainSection>

        <Sidebar>
          <SidebarCard>
            <SidebarTitle>Quick Actions</SidebarTitle>
            <QuickAction to="/book-appointment">Book Appointment</QuickAction>
            <QuickAction to="/appointments">View All Appointments</QuickAction>
            <QuickAction to="/medical-history">Medical History</QuickAction>
            <QuickAction to="/patient-profile">Update Profile</QuickAction>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Recent Activity</SidebarTitle>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              <p>• Last appointment: 2 days ago</p>
              <p>• 3 appointments completed this month</p>
              <p>• Profile updated 1 week ago</p>
            </div>
          </SidebarCard>
        </Sidebar>
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default PatientDashboard;