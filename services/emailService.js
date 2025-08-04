const nodemailer = require('nodemailer');
const db = require('../config/database');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Send email and log to database
    async sendEmail(to, subject, html, type = 'general', appointmentId = null) {
        try {
            // Log email attempt to database
            const logResult = await db.run(
                `INSERT INTO email_notifications (recipient_email, subject, message, type, appointment_id, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [to, subject, html, type, appointmentId]
            );

            const info = await this.transporter.sendMail({
                from: `"${process.env.SYSTEM_NAME}" <${process.env.SYSTEM_EMAIL}>`,
                to: to,
                subject: subject,
                html: html
            });

            // Update log as sent
            await db.run(
                'UPDATE email_notifications SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['sent', logResult.id]
            );

            console.log('✅ Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            // Update log as failed
            if (logResult && logResult.id) {
                await db.run(
                    'UPDATE email_notifications SET status = ? WHERE id = ?',
                    ['failed', logResult.id]
                );
            }

            console.error('❌ Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Appointment confirmation email
    async sendAppointmentConfirmation(appointment, patient, doctor) {
        const subject = `Appointment Confirmed - ${process.env.SYSTEM_NAME}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h1>Appointment Confirmed</h1>
                </div>
                
                <div style="padding: 20px; background-color: #f8fafc;">
                    <h2>Hello ${patient.first_name} ${patient.last_name},</h2>
                    
                    <p>Your appointment has been successfully scheduled. Here are the details:</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #2563eb; margin-top: 0;">Appointment Details</h3>
                        <p><strong>Doctor:</strong> Dr. ${doctor.first_name} ${doctor.last_name}</p>
                        <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                        <p><strong>Date:</strong> ${appointment.appointment_date}</p>
                        <p><strong>Time:</strong> ${appointment.appointment_time}</p>
                        <p><strong>Type:</strong> ${appointment.type}</p>
                        <p><strong>Fee:</strong> $${appointment.fee_amount}</p>
                        ${appointment.reason ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
                    </div>
                    
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h4 style="color: #d97706; margin-top: 0;">Important Reminders:</h4>
                        <ul>
                            <li>Please arrive 15 minutes before your appointment time</li>
                            <li>Bring a valid ID and insurance card</li>
                            <li>Bring any relevant medical records or test results</li>
                            <li>If you need to cancel or reschedule, please contact us at least 24 hours in advance</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Best regards,<br>
                    ${process.env.SYSTEM_NAME} Team</p>
                </div>
                
                <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        `;

        return await this.sendEmail(
            patient.email, 
            subject, 
            html, 
            'appointment_confirmation', 
            appointment.id
        );
    }

    // Appointment reminder email
    async sendAppointmentReminder(appointment, patient, doctor) {
        const subject = `Appointment Reminder - Tomorrow at ${appointment.appointment_time}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
                    <h1>Appointment Reminder</h1>
                </div>
                
                <div style="padding: 20px; background-color: #f8fafc;">
                    <h2>Hello ${patient.first_name},</h2>
                    
                    <p>This is a friendly reminder about your upcoming appointment:</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #059669;">
                        <h3 style="color: #059669; margin-top: 0;">Tomorrow's Appointment</h3>
                        <p><strong>Doctor:</strong> Dr. ${doctor.first_name} ${doctor.last_name}</p>
                        <p><strong>Date:</strong> ${appointment.appointment_date}</p>
                        <p><strong>Time:</strong> ${appointment.appointment_time}</p>
                        <p><strong>Type:</strong> ${appointment.type}</p>
                    </div>
                    
                    <p>Please remember to arrive 15 minutes early and bring all necessary documents.</p>
                    
                    <p>See you tomorrow!</p>
                </div>
            </div>
        `;

        return await this.sendEmail(
            patient.email, 
            subject, 
            html, 
            'appointment_reminder', 
            appointment.id
        );
    }

    // Appointment cancellation email
    async sendAppointmentCancellation(appointment, patient, doctor, reason = '') {
        const subject = `Appointment Cancelled - ${process.env.SYSTEM_NAME}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
                    <h1>Appointment Cancelled</h1>
                </div>
                
                <div style="padding: 20px; background-color: #f8fafc;">
                    <h2>Hello ${patient.first_name},</h2>
                    
                    <p>We regret to inform you that your appointment has been cancelled.</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #dc2626; margin-top: 0;">Cancelled Appointment Details</h3>
                        <p><strong>Doctor:</strong> Dr. ${doctor.first_name} ${doctor.last_name}</p>
                        <p><strong>Date:</strong> ${appointment.appointment_date}</p>
                        <p><strong>Time:</strong> ${appointment.appointment_time}</p>
                        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                    </div>
                    
                    <p>Please contact us to reschedule your appointment at your earliest convenience.</p>
                    
                    <p>We apologize for any inconvenience caused.</p>
                </div>
            </div>
        `;

        return await this.sendEmail(
            patient.email, 
            subject, 
            html, 
            'appointment_cancellation', 
            appointment.id
        );
    }

    // Welcome email for new users
    async sendWelcomeEmail(user) {
        const subject = `Welcome to ${process.env.SYSTEM_NAME}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h1>Welcome to ${process.env.SYSTEM_NAME}</h1>
                </div>
                
                <div style="padding: 20px; background-color: #f8fafc;">
                    <h2>Hello ${user.first_name} ${user.last_name},</h2>
                    
                    <p>Welcome to our healthcare platform! Your account has been successfully created.</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #2563eb; margin-top: 0;">Your Account Details</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL}/login" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Login to Your Account
                        </a>
                    </div>
                    
                    <p>If you have any questions, please don't hesitate to contact our support team.</p>
                    
                    <p>Best regards,<br>
                    ${process.env.SYSTEM_NAME} Team</p>
                </div>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html, 'welcome');
    }
}

module.exports = new EmailService();