const nodemailer = require('nodemailer');
const moment = require('moment');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send appointment confirmation email
  async sendAppointmentConfirmation(appointment, patient, doctor) {
    const appointmentDate = moment(appointment.appointmentDate).format('MMMM Do YYYY');
    const appointmentTime = `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: patient.email,
      subject: 'Appointment Confirmation - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center;">
            <h1>Appointment Confirmed</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Dear ${patient.firstName} ${patient.lastName},</h2>
            
            <p>Your appointment has been successfully confirmed. Here are the details:</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <h3>Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
              <p><strong>Specialization:</strong> ${doctor.specialization}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Type:</strong> ${appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}</p>
              <p><strong>Reason:</strong> ${appointment.reason}</p>
              ${appointment.type === 'telemedicine' && appointment.meetingLink ? 
                `<p><strong>Meeting Link:</strong> <a href="${appointment.meetingLink}">${appointment.meetingLink}</a></p>` : ''}
              ${appointment.type === 'in-person' && doctor.clinicAddress ? 
                `<p><strong>Clinic Address:</strong> ${doctor.clinicAddress.name}, ${doctor.clinicAddress.street}, ${doctor.clinicAddress.city}</p>` : ''}
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <h4>Important Information:</h4>
              <ul>
                <li>Please arrive 15 minutes early for in-person appointments</li>
                <li>Bring a valid ID and insurance card</li>
                <li>You can cancel or reschedule up to 24 hours before your appointment</li>
                <li>For telemedicine appointments, ensure you have a stable internet connection</li>
              </ul>
            </div>
            
            <p>If you need to cancel or reschedule your appointment, please log in to your account or contact us.</p>
            
            <p>Best regards,<br>Healthcare System Team</p>
          </div>
          
          <div style="background-color: #6c757d; color: white; padding: 10px; text-align: center; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Appointment confirmation email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
      return false;
    }
  }

  // Send appointment reminder email
  async sendAppointmentReminder(appointment, patient, doctor) {
    const appointmentDate = moment(appointment.appointmentDate).format('MMMM Do YYYY');
    const appointmentTime = `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: patient.email,
      subject: 'Appointment Reminder - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
            <h1>Appointment Reminder</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Dear ${patient.firstName} ${patient.lastName},</h2>
            
            <p>This is a friendly reminder about your upcoming appointment:</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3>Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Type:</strong> ${appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}</p>
              ${appointment.type === 'telemedicine' && appointment.meetingLink ? 
                `<p><strong>Meeting Link:</strong> <a href="${appointment.meetingLink}">${appointment.meetingLink}</a></p>` : ''}
            </div>
            
            <p>Please make sure to be on time for your appointment.</p>
            
            <p>Best regards,<br>Healthcare System Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Appointment reminder email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending appointment reminder email:', error);
      return false;
    }
  }

  // Send appointment cancellation email
  async sendAppointmentCancellation(appointment, patient, doctor, reason) {
    const appointmentDate = moment(appointment.appointmentDate).format('MMMM Do YYYY');
    const appointmentTime = `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: patient.email,
      subject: 'Appointment Cancelled - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>Appointment Cancelled</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Dear ${patient.firstName} ${patient.lastName},</h2>
            
            <p>Your appointment has been cancelled. Here are the details:</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
              <h3>Cancelled Appointment</h3>
              <p><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <p>You can book a new appointment by logging into your account or contacting us directly.</p>
            
            <p>We apologize for any inconvenience caused.</p>
            
            <p>Best regards,<br>Healthcare System Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Appointment cancellation email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending appointment cancellation email:', error);
      return false;
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to Healthcare System</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Dear ${user.firstName} ${user.lastName},</h2>
            
            <p>Welcome to our healthcare appointment system! We're excited to have you on board.</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <h3>What you can do:</h3>
              <ul>
                <li>Book appointments with qualified doctors</li>
                <li>Manage your medical history</li>
                <li>Receive appointment reminders</li>
                <li>Access telemedicine consultations</li>
                <li>View and download medical reports</li>
              </ul>
            </div>
            
            <p>To get started, please log in to your account and complete your profile.</p>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>Healthcare System Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Send doctor notification for new appointment
  async sendDoctorAppointmentNotification(appointment, patient, doctor) {
    const appointmentDate = moment(appointment.appointmentDate).format('MMMM Do YYYY');
    const appointmentTime = `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: doctor.user.email,
      subject: 'New Appointment Scheduled - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center;">
            <h1>New Appointment Scheduled</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Dear Dr. ${doctor.user.firstName} ${doctor.user.lastName},</h2>
            
            <p>A new appointment has been scheduled with you:</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <h3>Appointment Details</h3>
              <p><strong>Patient:</strong> ${patient.firstName} ${patient.lastName}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Type:</strong> ${appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}</p>
              <p><strong>Reason:</strong> ${appointment.reason}</p>
              <p><strong>Patient Phone:</strong> ${patient.phone}</p>
            </div>
            
            <p>Please log in to your dashboard to view more details and manage your appointments.</p>
            
            <p>Best regards,<br>Healthcare System Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Doctor appointment notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending doctor appointment notification email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();