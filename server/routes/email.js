const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { testEmailConfig, sendReminderEmails } = require('../services/emailService');
const { getAll } = require('../config/database');

const router = express.Router();

// Test email configuration (admin only)
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const isValid = await testEmailConfig();
    
    if (isValid) {
      res.json({ message: 'Email configuration is valid' });
    } else {
      res.status(400).json({ error: 'Email configuration is invalid' });
    }
  } catch (error) {
    console.error('Test email config error:', error);
    res.status(500).json({ error: 'Failed to test email configuration' });
  }
});

// Send reminder emails manually (admin only)
router.post('/send-reminders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await sendReminderEmails();
    res.json({ message: 'Reminder emails sent successfully' });
  } catch (error) {
    console.error('Send reminder emails error:', error);
    res.status(500).json({ error: 'Failed to send reminder emails' });
  }
});

// Get email notification history (admin only)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const notifications = await getAll(`
      SELECT 
        en.id, en.recipient_email, en.subject, en.sent_at, en.status,
        a.appointment_date, a.appointment_time,
        u.first_name as patient_first_name, u.last_name as patient_last_name
      FROM email_notifications en
      JOIN appointments a ON en.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      ORDER BY en.sent_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const totalCount = await getAll(`
      SELECT COUNT(*) as count
      FROM email_notifications
    `);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get email notifications error:', error);
    res.status(500).json({ error: 'Failed to get email notifications' });
  }
});

// Get email notification statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total notifications
    const totalNotifications = await getAll(`
      SELECT COUNT(*) as count
      FROM email_notifications
    `);

    // Sent notifications
    const sentNotifications = await getAll(`
      SELECT COUNT(*) as count
      FROM email_notifications
      WHERE status = 'sent'
    `);

    // Failed notifications
    const failedNotifications = await getAll(`
      SELECT COUNT(*) as count
      FROM email_notifications
      WHERE status = 'failed'
    `);

    // Pending notifications
    const pendingNotifications = await getAll(`
      SELECT COUNT(*) as count
      FROM email_notifications
      WHERE status = 'pending'
    `);

    // Notifications by type (subject)
    const notificationsByType = await getAll(`
      SELECT 
        CASE 
          WHEN subject LIKE '%Confirmation%' THEN 'Confirmation'
          WHEN subject LIKE '%Reminder%' THEN 'Reminder'
          WHEN subject LIKE '%Cancellation%' THEN 'Cancellation'
          WHEN subject LIKE '%Status Update%' THEN 'Status Update'
          ELSE 'Other'
        END as type,
        COUNT(*) as count
      FROM email_notifications
      GROUP BY type
    `);

    res.json({
      stats: {
        totalNotifications: totalNotifications[0].count,
        sentNotifications: sentNotifications[0].count,
        failedNotifications: failedNotifications[0].count,
        pendingNotifications: pendingNotifications[0].count,
        successRate: totalNotifications[0].count > 0 
          ? ((sentNotifications[0].count / totalNotifications[0].count) * 100).toFixed(2)
          : 0,
        notificationsByType
      }
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ error: 'Failed to get email statistics' });
  }
});

// Retry failed email notifications (admin only)
router.post('/retry-failed', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const failedNotifications = await getAll(`
      SELECT 
        en.id, en.recipient_email, en.subject, en.message, en.appointment_id
      FROM email_notifications en
      WHERE en.status = 'failed'
      ORDER BY en.sent_at DESC
    `);

    let retryCount = 0;
    let successCount = 0;

    for (const notification of failedNotifications) {
      try {
        // Parse the email type from subject
        let emailType = 'confirmation';
        if (notification.subject.includes('Reminder')) emailType = 'reminder';
        else if (notification.subject.includes('Cancellation')) emailType = 'cancellation';
        else if (notification.subject.includes('Status Update')) emailType = 'status_update';

        // Get appointment data for email
        const appointmentData = await getAll(`
          SELECT 
            a.id, a.appointment_date, a.appointment_time,
            u.first_name as patient_first_name, u.last_name as patient_last_name, u.email as patient_email,
            doc.first_name as doctor_first_name, doc.last_name as doctor_last_name, doc.email as doctor_email
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users u ON p.user_id = u.id
          JOIN doctors d ON a.doctor_id = d.id
          JOIN users doc ON d.user_id = doc.id
          WHERE a.id = ?
        `, [notification.appointment_id]);

        if (appointmentData.length > 0) {
          const { sendAppointmentEmail } = require('../services/emailService');
          await sendAppointmentEmail(appointmentData[0], emailType);
          successCount++;
        }

        retryCount++;
      } catch (error) {
        console.error(`Failed to retry notification ${notification.id}:`, error);
      }
    }

    res.json({
      message: `Retry completed. ${successCount} out of ${retryCount} notifications sent successfully.`
    });
  } catch (error) {
    console.error('Retry failed notifications error:', error);
    res.status(500).json({ error: 'Failed to retry failed notifications' });
  }
});

module.exports = router;