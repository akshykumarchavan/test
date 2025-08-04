const nodemailer = require('nodemailer');
const moment = require('moment');

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const emailTemplates = {
  confirmation: {
    subject: 'Appointment Confirmation - Healthcare System',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1>🏥 Healthcare Appointment System</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Appointment Confirmation</h2>
          <p>Dear ${data.patient_first_name} ${data.patient_last_name},</p>
          
          <p>Your appointment has been successfully booked with <strong>Dr. ${data.doctor_first_name} ${data.doctor_last_name}</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Date:</strong> ${moment(data.appointment_date).format('MMMM Do, YYYY')}</li>
              <li><strong>Time:</strong> ${data.appointment_time}</li>
              <li><strong>Doctor:</strong> Dr. ${data.doctor_first_name} ${data.doctor_last_name}</li>
              ${data.symptoms ? `<li><strong>Symptoms:</strong> ${data.symptoms}</li>` : ''}
            </ul>
          </div>
          
          <p>Please arrive 10 minutes before your scheduled appointment time.</p>
          
          <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
          
          <p>Best regards,<br>Healthcare Appointment System</p>
        </div>
        
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    `
  },
  
  status_update: {
    subject: 'Appointment Status Update - Healthcare System',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2196F3; color: white; padding: 20px; text-align: center;">
          <h1>🏥 Healthcare Appointment System</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Appointment Status Update</h2>
          <p>Dear ${data.patient_first_name} ${data.patient_last_name},</p>
          
          <p>Your appointment status has been updated to: <strong style="color: #2196F3;">${data.status.toUpperCase()}</strong></p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Date:</strong> ${moment(data.appointment_date).format('MMMM Do, YYYY')}</li>
              <li><strong>Time:</strong> ${data.appointment_time}</li>
              <li><strong>Status:</strong> ${data.status.toUpperCase()}</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact your healthcare provider.</p>
          
          <p>Best regards,<br>Healthcare Appointment System</p>
        </div>
        
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    `
  },
  
  cancellation: {
    subject: 'Appointment Cancellation - Healthcare System',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
          <h1>🏥 Healthcare Appointment System</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Appointment Cancellation</h2>
          <p>Dear ${data.patient_first_name} ${data.patient_last_name},</p>
          
          <p>Your appointment has been cancelled.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Cancelled Appointment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Date:</strong> ${moment(data.appointment_date).format('MMMM Do, YYYY')}</li>
              <li><strong>Time:</strong> ${data.appointment_time}</li>
              <li><strong>Doctor:</strong> Dr. ${data.doctor_first_name} ${data.doctor_last_name}</li>
            </ul>
          </div>
          
          <p>To reschedule your appointment, please log in to your account or contact us.</p>
          
          <p>Best regards,<br>Healthcare Appointment System</p>
        </div>
        
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    `
  },
  
  reminder: {
    subject: 'Appointment Reminder - Healthcare System',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF9800; color: white; padding: 20px; text-align: center;">
          <h1>🏥 Healthcare Appointment System</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Appointment Reminder</h2>
          <p>Dear ${data.patient_first_name} ${data.patient_last_name},</p>
          
          <p>This is a friendly reminder about your upcoming appointment.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Date:</strong> ${moment(data.appointment_date).format('MMMM Do, YYYY')}</li>
              <li><strong>Time:</strong> ${data.appointment_time}</li>
              <li><strong>Doctor:</strong> Dr. ${data.doctor_first_name} ${data.doctor_last_name}</li>
            </ul>
          </div>
          
          <p>Please arrive 10 minutes before your scheduled appointment time.</p>
          
          <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>Healthcare Appointment System</p>
        </div>
        
        <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    `
  }
};

// Send appointment email
async function sendAppointmentEmail(appointmentData, type) {
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    console.log('Email notifications are disabled');
    return;
  }

  if (!emailTemplates[type]) {
    throw new Error(`Unknown email type: ${type}`);
  }

  const template = emailTemplates[type];
  const html = template.template(appointmentData);

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: appointmentData.patient_email,
    subject: template.subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    
    // Log email notification in database
    await logEmailNotification(appointmentData.id, appointmentData.patient_email, template.subject, html, 'sent');
    
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Log failed email notification
    await logEmailNotification(appointmentData.id, appointmentData.patient_email, template.subject, html, 'failed');
    
    throw error;
  }
}

// Log email notification in database
async function logEmailNotification(appointmentId, recipientEmail, subject, message, status) {
  try {
    const { runQuery } = require('../config/database');
    await runQuery(
      'INSERT INTO email_notifications (appointment_id, recipient_email, subject, message, status) VALUES (?, ?, ?, ?, ?)',
      [appointmentId, recipientEmail, subject, message, status]
    );
  } catch (error) {
    console.error('Failed to log email notification:', error);
  }
}

// Send reminder emails for upcoming appointments
async function sendReminderEmails() {
  try {
    const { getAll } = require('../config/database');
    
    // Get appointments scheduled for tomorrow
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
    const appointments = await getAll(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time,
        u.first_name as patient_first_name, u.last_name as patient_last_name, u.email as patient_email,
        doc.first_name as doctor_first_name, doc.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc ON d.user_id = doc.id
      WHERE a.appointment_date = ? AND a.status = 'scheduled'
    `, [tomorrow]);

    for (const appointment of appointments) {
      try {
        await sendAppointmentEmail(appointment, 'reminder');
      } catch (error) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
      }
    }

    console.log(`✅ Sent ${appointments.length} reminder emails`);
  } catch (error) {
    console.error('Failed to send reminder emails:', error);
  }
}

// Test email configuration
async function testEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration is invalid:', error);
    return false;
  }
}

module.exports = {
  sendAppointmentEmail,
  sendReminderEmails,
  testEmailConfig
};