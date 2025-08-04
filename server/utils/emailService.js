const nodemailer = require('nodemailer');
const moment = require('moment');

// Create transporter
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  appointmentConfirmation: (appointment) => ({
    subject: 'Appointment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Appointment Confirmation</h2>
        <p>Dear ${appointment.patientId.firstName} ${appointment.patientId.lastName},</p>
        <p>Your appointment has been successfully scheduled with Dr. ${appointment.doctorId.userId.firstName} ${appointment.doctorId.userId.lastName}.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Appointment Details</h3>
          <p><strong>Date:</strong> ${moment(appointment.appointmentDate).format('MMMM Do, YYYY')}</p>
          <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
          <p><strong>Type:</strong> ${appointment.appointmentType}</p>
          <p><strong>Reason:</strong> ${appointment.reason}</p>
          <p><strong>Doctor:</strong> Dr. ${appointment.doctorId.userId.firstName} ${appointment.doctorId.userId.lastName}</p>
          <p><strong>Specialization:</strong> ${appointment.doctorId.specialization}</p>
        </div>
        
        <p>Please arrive 10 minutes before your scheduled appointment time.</p>
        <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
        
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `
  }),

  appointmentReminder: (appointment) => ({
    subject: 'Appointment Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Appointment Reminder</h2>
        <p>Dear ${appointment.patientId.firstName} ${appointment.patientId.lastName},</p>
        <p>This is a friendly reminder about your upcoming appointment.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Appointment Details</h3>
          <p><strong>Date:</strong> ${moment(appointment.appointmentDate).format('MMMM Do, YYYY')}</p>
          <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
          <p><strong>Type:</strong> ${appointment.appointmentType}</p>
          <p><strong>Doctor:</strong> Dr. ${appointment.doctorId.userId.firstName} ${appointment.doctorId.userId.lastName}</p>
        </div>
        
        <p>Please remember to:</p>
        <ul>
          <li>Arrive 10 minutes before your scheduled time</li>
          <li>Bring any relevant medical records</li>
          <li>Bring a list of current medications</li>
        </ul>
        
        <p>If you need to cancel or reschedule, please contact us immediately.</p>
        
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `
  }),

  appointmentCancellation: (appointment) => ({
    subject: 'Appointment Cancellation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Appointment Cancellation</h2>
        <p>Dear ${appointment.patientId.firstName} ${appointment.patientId.lastName},</p>
        <p>Your appointment has been cancelled.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Cancelled Appointment Details</h3>
          <p><strong>Date:</strong> ${moment(appointment.appointmentDate).format('MMMM Do, YYYY')}</p>
          <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
          <p><strong>Doctor:</strong> Dr. ${appointment.doctorId.userId.firstName} ${appointment.doctorId.userId.lastName}</p>
          ${appointment.cancellationReason ? `<p><strong>Reason:</strong> ${appointment.cancellationReason}</p>` : ''}
        </div>
        
        <p>If you would like to reschedule, please contact us to book a new appointment.</p>
        
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `
  }),

  doctorNotification: (appointment) => ({
    subject: 'New Appointment Scheduled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Appointment Scheduled</h2>
        <p>Dear Dr. ${appointment.doctorId.userId.firstName} ${appointment.doctorId.userId.lastName},</p>
        <p>A new appointment has been scheduled with you.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Appointment Details</h3>
          <p><strong>Date:</strong> ${moment(appointment.appointmentDate).format('MMMM Do, YYYY')}</p>
          <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
          <p><strong>Patient:</strong> ${appointment.patientId.firstName} ${appointment.patientId.lastName}</p>
          <p><strong>Type:</strong> ${appointment.appointmentType}</p>
          <p><strong>Reason:</strong> ${appointment.reason}</p>
          ${appointment.symptoms ? `<p><strong>Symptoms:</strong> ${appointment.symptoms}</p>` : ''}
        </div>
        
        <p>Please review the patient's information and prepare accordingly.</p>
        
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `
  })
};

// Send appointment confirmation email
const sendAppointmentConfirmation = async (appointment) => {
  try {
    const template = emailTemplates.appointmentConfirmation(appointment);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointment.patientId.email,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent');
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    throw error;
  }
};

// Send appointment reminder email
const sendAppointmentReminder = async (appointment) => {
  try {
    const template = emailTemplates.appointmentReminder(appointment);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointment.patientId.email,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment reminder email sent');
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
    throw error;
  }
};

// Send appointment cancellation email
const sendAppointmentCancellation = async (appointment) => {
  try {
    const template = emailTemplates.appointmentCancellation(appointment);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointment.patientId.email,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment cancellation email sent');
  } catch (error) {
    console.error('Error sending appointment cancellation email:', error);
    throw error;
  }
};

// Send doctor notification email
const sendDoctorNotification = async (appointment) => {
  try {
    const template = emailTemplates.doctorNotification(appointment);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointment.doctorId.userId.email,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Doctor notification email sent');
  } catch (error) {
    console.error('Error sending doctor notification email:', error);
    throw error;
  }
};

// Send custom email
const sendCustomEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Custom email sent');
  } catch (error) {
    console.error('Error sending custom email:', error);
    throw error;
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  sendDoctorNotification,
  sendCustomEmail
};