import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  background: #f8f9fa;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  font-size: 1.2rem;
`;

const Dashboard = () => {
  const { user, isDoctor, isPatient, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect users to their appropriate dashboard based on role
    if (isDoctor) {
      navigate('/doctor-dashboard');
    } else if (isPatient) {
      navigate('/patient-dashboard');
    } else if (isAdmin) {
      navigate('/admin-dashboard');
    }
  }, [isDoctor, isPatient, isAdmin, navigate]);

  return (
    <DashboardContainer>
      <LoadingMessage>
        Redirecting to your dashboard...
      </LoadingMessage>
    </DashboardContainer>
  );
};

export default Dashboard;