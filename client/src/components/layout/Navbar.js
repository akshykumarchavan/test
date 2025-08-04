import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaStethoscope, FaCalendarAlt, FaUserMd, FaUsers } from 'react-icons/fa';
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #f0f0f0;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    color: #333;
    padding: 0.75rem 0;
    border-bottom: 1px solid #eee;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
`;

const UserButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  min-width: 200px;
  display: ${props => props.isOpen ? 'block' : 'none'};
  z-index: 1000;
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #eee;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #e74c3c;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const Navbar = () => {
  const { user, logout, isAuthenticated, isDoctor, isPatient, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (isDoctor) return '/doctor-dashboard';
    if (isPatient) return '/patient-dashboard';
    if (isAdmin) return '/admin-dashboard';
    return '/dashboard';
  };

  return (
    <NavbarContainer>
      <NavContent>
        <Logo to="/">
          <FaStethoscope />
          HealthCare
        </Logo>

        <NavLinks>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/doctors">Find Doctors</NavLink>
          
          {isAuthenticated ? (
            <>
              <NavLink to={getDashboardLink()}>Dashboard</NavLink>
              <NavLink to="/appointments">Appointments</NavLink>
              {isPatient && <NavLink to="/book-appointment">Book Appointment</NavLink>}
              {isDoctor && <NavLink to="/doctor-profile">My Profile</NavLink>}
              {isPatient && <NavLink to="/patient-profile">My Profile</NavLink>}
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </NavLinks>

        {isAuthenticated && (
          <UserMenu>
            <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <FaUser />
              {user?.firstName}
            </UserButton>
            
            <DropdownMenu isOpen={userMenuOpen}>
              <DropdownItem to={getDashboardLink()}>
                <FaCalendarAlt />
                Dashboard
              </DropdownItem>
              
              {isDoctor && (
                <DropdownItem to="/doctor-profile">
                  <FaUserMd />
                  Doctor Profile
                </DropdownItem>
              )}
              
              {isPatient && (
                <DropdownItem to="/patient-profile">
                  <FaUser />
                  Patient Profile
                </DropdownItem>
              )}
              
              <DropdownItem to="/appointments">
                <FaCalendarAlt />
                Appointments
              </DropdownItem>
              
              <LogoutButton onClick={handleLogout}>
                <FaSignOutAlt />
                Logout
              </LogoutButton>
            </DropdownMenu>
          </UserMenu>
        )}

        <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
      </NavContent>

      <MobileMenu isOpen={mobileMenuOpen}>
        <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
        <NavLink to="/doctors" onClick={() => setMobileMenuOpen(false)}>Find Doctors</NavLink>
        
        {isAuthenticated ? (
          <>
            <NavLink to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/appointments" onClick={() => setMobileMenuOpen(false)}>
              Appointments
            </NavLink>
            {isPatient && (
              <NavLink to="/book-appointment" onClick={() => setMobileMenuOpen(false)}>
                Book Appointment
              </NavLink>
            )}
            {isDoctor && (
              <NavLink to="/doctor-profile" onClick={() => setMobileMenuOpen(false)}>
                My Profile
              </NavLink>
            )}
            {isPatient && (
              <NavLink to="/patient-profile" onClick={() => setMobileMenuOpen(false)}>
                My Profile
              </NavLink>
            )}
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={() => setMobileMenuOpen(false)}>Login</NavLink>
            <NavLink to="/register" onClick={() => setMobileMenuOpen(false)}>Register</NavLink>
          </>
        )}
      </MobileMenu>
    </NavbarContainer>
  );
};

export default Navbar;