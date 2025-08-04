import React from 'react';
import { Link } from 'react-router-dom';
import { FaStethoscope, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: #2c3e50;
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const FooterSection = styled.div`
  h3 {
    margin-bottom: 1rem;
    color: #ecf0f1;
  }
  
  p {
    color: #bdc3c7;
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }
  
  a {
    color: #bdc3c7;
    text-decoration: none;
    transition: color 0.3s;
    
    &:hover {
      color: #3498db;
    }
  }
`;

const ContactInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #bdc3c7;
`;

const FooterBottom = styled.div`
  border-top: 1px solid #34495e;
  padding-top: 1rem;
  text-align: center;
  color: #bdc3c7;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #ecf0f1;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <FooterSection>
            <Logo>
              <FaStethoscope />
              HealthCare
            </Logo>
            <p>
              Providing comprehensive healthcare appointment scheduling solutions 
              for clinics, hospitals, and telemedicine platforms.
            </p>
          </FooterSection>

          <FooterSection>
            <h3>Quick Links</h3>
            <p><Link to="/">Home</Link></p>
            <p><Link to="/doctors">Find Doctors</Link></p>
            <p><Link to="/register">Register</Link></p>
            <p><Link to="/login">Login</Link></p>
          </FooterSection>

          <FooterSection>
            <h3>Services</h3>
            <p>Appointment Booking</p>
            <p>Doctor Consultations</p>
            <p>Medical Records</p>
            <p>Telemedicine</p>
          </FooterSection>

          <FooterSection>
            <h3>Contact Us</h3>
            <ContactInfo>
              <FaPhone />
              <span>+1 (555) 123-4567</span>
            </ContactInfo>
            <ContactInfo>
              <FaEnvelope />
              <span>info@healthcare.com</span>
            </ContactInfo>
            <ContactInfo>
              <FaMapMarkerAlt />
              <span>123 Healthcare Ave, Medical City, MC 12345</span>
            </ContactInfo>
          </FooterSection>
        </FooterGrid>

        <FooterBottom>
          <p>&copy; 2024 Healthcare Appointment System. All rights reserved.</p>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;