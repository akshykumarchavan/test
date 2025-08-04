const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user details from database
        const user = await db.get(
            'SELECT * FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid token or user not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Required role: ${roles.join(' or ')}` 
            });
        }

        next();
    };
};

// Doctor specific middleware
const requireDoctor = requireRole(['doctor']);

// Patient specific middleware
const requirePatient = requireRole(['patient']);

// Admin specific middleware
const requireAdmin = requireRole(['admin']);

// Doctor or Admin access
const requireDoctorOrAdmin = requireRole(['doctor', 'admin']);

// Patient or Doctor access (for medical records)
const requirePatientOrDoctor = requireRole(['patient', 'doctor']);

// Any authenticated user
const requireAuth = authenticateToken;

module.exports = {
    authenticateToken,
    requireRole,
    requireDoctor,
    requirePatient,
    requireAdmin,
    requireDoctorOrAdmin,
    requirePatientOrDoctor,
    requireAuth
};