import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStethoscope, FaCalendarAlt, FaUserMd, FaBell, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';
import styled from 'styled-components';

const HomeContainer = styled.div`
  min-height: 100vh;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 0;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CTAButton = styled(Link)`
  display: inline-block;
  background: #fff;
  color: #667eea;
  padding: 1rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const FeaturesSection = styled.section`
  padding: 4rem 0;
  background: #f8f9fa;
`;

const FeaturesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
`;

const StatsSection = styled.section`
  padding: 4rem 0;
  background: white;
`;

const StatsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 2rem;
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  color: #666;
`;

const CTASection = styled.section`
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
`;

const CTAContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CTADescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const SecondaryButton = styled(Link)`
  display: inline-block;
  background: transparent;
  color: white;
  padding: 1rem 2rem;
  border: 2px solid white;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
  transition: background-color 0.3s;
  
  &:hover {
    background: white;
    color: #667eea;
  }
`;

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <HomeContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Your Health, Our Priority</HeroTitle>
          <HeroSubtitle>
            Book appointments with top healthcare professionals. 
            Get the care you deserve with our comprehensive healthcare platform.
          </HeroSubtitle>
          {isAuthenticated ? (
            <CTAButton to="/book-appointment">Book Appointment</CTAButton>
          ) : (
            <CTAButton to="/register">Get Started</CTAButton>
          )}
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <FeaturesContainer>
          <SectionTitle>Why Choose Our Platform?</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <FeatureIcon>
                <FaCalendarAlt />
              </FeatureIcon>
              <FeatureTitle>Easy Appointment Booking</FeatureTitle>
              <FeatureDescription>
                Book appointments with just a few clicks. Choose your preferred doctor, 
                time, and date with our intuitive scheduling system.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <FaUserMd />
              </FeatureIcon>
              <FeatureTitle>Qualified Healthcare Professionals</FeatureTitle>
              <FeatureDescription>
                Connect with experienced doctors, specialists, and healthcare providers 
                who are verified and licensed in their respective fields.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <FaBell />
              </FeatureIcon>
              <FeatureTitle>Smart Notifications</FeatureTitle>
              <FeatureDescription>
                Receive timely reminders for your appointments via email and SMS. 
                Never miss an important healthcare appointment again.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <FaShieldAlt />
              </FeatureIcon>
              <FeatureTitle>Secure & Private</FeatureTitle>
              <FeatureDescription>
                Your health information is protected with industry-standard security. 
                We prioritize your privacy and data protection.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <FaMobileAlt />
              </FeatureIcon>
              <FeatureTitle>Mobile Friendly</FeatureTitle>
              <FeatureDescription>
                Access our platform from any device. Book appointments, view medical 
                history, and manage your healthcare on the go.
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <FaStethoscope />
              </FeatureIcon>
              <FeatureTitle>Comprehensive Care</FeatureTitle>
              <FeatureDescription>
                From general checkups to specialized treatments, find healthcare 
                services that meet your specific needs and requirements.
              </FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </FeaturesContainer>
      </FeaturesSection>

      <StatsSection>
        <StatsContainer>
          <SectionTitle>Our Impact</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatNumber>10,000+</StatNumber>
              <StatLabel>Happy Patients</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>500+</StatNumber>
              <StatLabel>Qualified Doctors</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>50,000+</StatNumber>
              <StatLabel>Appointments Booked</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>99%</StatNumber>
              <StatLabel>Satisfaction Rate</StatLabel>
            </StatCard>
          </StatsGrid>
        </StatsContainer>
      </StatsSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Get Started?</CTATitle>
          <CTADescription>
            Join thousands of patients who trust our platform for their healthcare needs.
          </CTADescription>
          <ButtonGroup>
            {isAuthenticated ? (
              <CTAButton to="/book-appointment">Book Your Appointment</CTAButton>
            ) : (
              <>
                <CTAButton to="/register">Sign Up Now</CTAButton>
                <SecondaryButton to="/login">Login</SecondaryButton>
              </>
            )}
          </ButtonGroup>
        </CTAContainer>
      </CTASection>
    </HomeContainer>
  );
};

export default Home;