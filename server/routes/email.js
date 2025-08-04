const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { sendCustomEmail } = require('../utils/emailService');

const router = express.Router();

// Send custom email
router.post('/send', auth, [
  body('to').isEmail().normalizeEmail(),
  body('subject').notEmpty().trim(),
  body('message').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, subject, message } = req.body;

    // Only admins can send custom emails
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">${subject}</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await sendCustomEmail(to, subject, html);

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send bulk email
router.post('/bulk', auth, [
  body('recipients').isArray({ min: 1 }),
  body('subject').notEmpty().trim(),
  body('message').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipients, subject, message } = req.body;

    // Only admins can send bulk emails
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">${subject}</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    const emailPromises = recipients.map(email => sendCustomEmail(email, subject, html));
    await Promise.all(emailPromises);

    res.json({ 
      message: `Bulk email sent successfully to ${recipients.length} recipients` 
    });
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;