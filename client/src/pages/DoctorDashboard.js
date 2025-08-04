import React, { useState, useEffect } from 'react';
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
  FaChartLine,
  FaBell
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

const PatientName = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
`;

const AppointmentDetails = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const AppointmentActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
  
  &.confirm {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.complete {
    background: #17a2b8;
    color: white;
    
    &:hover {
      background: #138496;
    }
  }
  
  &.cancel {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
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

const QuickAction = styled.button`
  width: 100%;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
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

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalEarnings: 0,
    monthlyAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, statsRes] = await Promise.all([
        axios.get('/api/appointments'),
        axios.get('/api/doctors/stats')
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

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      let status;
      switch (action) {
        case 'confirm':
          status = 'confirmed';
          break;
        case 'complete':
          status = 'completed';
          break;
        case 'cancel':
          status = 'cancelled';
          break;
        default:
          return;
      }

      await axios.patch(`/api/appointments/${appointmentId}/status`, { status });
      toast.success(`Appointment ${action}ed successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
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
          <WelcomeText>Welcome back, Dr. {user?.firstName}!</WelcomeText>
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
            <FaTimesCircle />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.cancelledAppointments}</StatNumber>
            <StatLabel>Cancelled</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>
            <FaDollarSign />
          </StatIcon>
          <StatContent>
            <StatNumber>${stats.totalEarnings}</StatNumber>
            <StatLabel>Total Earnings</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <DashboardGrid>
        <MainSection>
          <SectionHeader>
            <SectionTitle>Today's Appointments</SectionTitle>
          </SectionHeader>
          
          <AppointmentList>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <AppointmentItem key={appointment._id}>
                  <AppointmentInfo>
                    <PatientName>
                      {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                    </PatientName>
                    <AppointmentDetails>
                      {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      <br />
                      Reason: {appointment.reason}
                    </AppointmentDetails>
                  </AppointmentInfo>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <StatusBadge className={appointment.status}>
                      {appointment.status}
                    </StatusBadge>
                    
                    {appointment.status === 'scheduled' && (
                      <AppointmentActions>
                        <ActionButton 
                          className="confirm"
                          onClick={() => handleAppointmentAction(appointment._id, 'confirm')}
                        >
                          Confirm
                        </ActionButton>
                        <ActionButton 
                          className="cancel"
                          onClick={() => handleAppointmentAction(appointment._id, 'cancel')}
                        >
                          Cancel
                        </ActionButton>
                      </AppointmentActions>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <AppointmentActions>
                        <ActionButton 
                          className="complete"
                          onClick={() => handleAppointmentAction(appointment._id, 'complete')}
                        >
                          Complete
                        </ActionButton>
                      </AppointmentActions>
                    )}
                  </div>
                </AppointmentItem>
              ))
            ) : (
              <NoAppointments>
                <FaCalendarAlt style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
                <p>No appointments scheduled for today</p>
              </NoAppointments>
            )}
          </AppointmentList>
        </MainSection>

        <Sidebar>
          <SidebarCard>
            <SidebarTitle>Quick Actions</SidebarTitle>
            <QuickAction>View All Appointments</QuickAction>
            <QuickAction>Update Availability</QuickAction>
            <QuickAction>View Patient Records</QuickAction>
            <QuickAction>Send Notifications</QuickAction>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Recent Activity</SidebarTitle>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              <p>• 2 appointments confirmed today</p>
              <p>• 1 patient completed consultation</p>
              <p>• 3 new appointment requests</p>
            </div>
          </SidebarCard>
        </Sidebar>
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default DoctorDashboard;