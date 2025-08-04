import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserMd, FaUserInjured } from 'react-icons/fa';
import styled from 'styled-components';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const RegisterCard = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

const RegisterTitle = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    color: #667eea;
  }
`;

const RoleSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RoleOption = styled.div`
  padding: 1rem;
  border: 2px solid ${props => props.selected ? '#667eea' : '#e1e5e9'};
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
  background: ${props => props.selected ? '#f0f4ff' : 'white'};
  
  &:hover {
    border-color: #667eea;
  }
`;

const RoleIcon = styled.div`
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const RoleTitle = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
`;

const RoleDescription = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 2rem;
  color: #666;
  
  a {
    color: #667eea;
    text-decoration: none;
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: #fdf2f2;
  padding: 0.75rem;
  border-radius: 5px;
  border: 1px solid #fecaca;
  margin-bottom: 1rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experience: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.role === 'doctor' && (!formData.specialization || !formData.licenseNumber)) {
      setError('Please fill in all required doctor information');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      };

      if (formData.role === 'doctor') {
        userData.specialization = formData.specialization;
        userData.licenseNumber = formData.licenseNumber;
        userData.experience = parseInt(formData.experience) || 0;
      }

      const result = await register(userData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <RegisterTitle>Create Account</RegisterTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <InputIcon>
                <FaUser />
              </InputIcon>
              <Input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <InputIcon>
                <FaUser />
              </InputIcon>
              <Input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </div>

          <FormGroup>
            <InputIcon>
              <FaEnvelope />
            </InputIcon>
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <InputIcon>
              <FaUser />
            </InputIcon>
            <Input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </FormGroup>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>
              Select Role
            </label>
            <RoleSelector>
              <RoleOption
                selected={formData.role === 'patient'}
                onClick={() => handleRoleSelect('patient')}
              >
                <RoleIcon>
                  <FaUserInjured />
                </RoleIcon>
                <RoleTitle>Patient</RoleTitle>
                <RoleDescription>Book appointments with doctors</RoleDescription>
              </RoleOption>

              <RoleOption
                selected={formData.role === 'doctor'}
                onClick={() => handleRoleSelect('doctor')}
              >
                <RoleIcon>
                  <FaUserMd />
                </RoleIcon>
                <RoleTitle>Doctor</RoleTitle>
                <RoleDescription>Provide medical services</RoleDescription>
              </RoleOption>
            </RoleSelector>
          </div>

          {formData.role === 'doctor' && (
            <>
              <FormGroup>
                <InputIcon>
                  <FaUserMd />
                </InputIcon>
                <Input
                  type="text"
                  name="specialization"
                  placeholder="Specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup>
                  <InputIcon>
                    <FaUserMd />
                  </InputIcon>
                  <Input
                    type="text"
                    name="licenseNumber"
                    placeholder="License Number"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <InputIcon>
                    <FaUserMd />
                  </InputIcon>
                  <Input
                    type="number"
                    name="experience"
                    placeholder="Years of Experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                  />
                </FormGroup>
              </div>
            </>
          )}

          <FormGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </FormGroup>

          <FormGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Create Account'}
          </SubmitButton>
        </Form>

        <LoginLink>
          Already have an account? <Link to="/login">Sign in</Link>
        </LoginLink>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;