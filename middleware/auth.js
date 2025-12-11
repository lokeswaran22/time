const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

/**
 * Middleware to check if user can edit specific employee's timesheet
 * Allows if: user is admin OR user is the employee
 */
function canEditEmployee(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const targetEmployeeId = req.params.employeeId || req.body.employeeId;

    // Admin can edit anyone
    if (req.user.role === 'admin') {
        return next();
    }

    // Employee can only edit their own timesheet
    if (req.user.employeeId === targetEmployeeId) {
        return next();
    }

    return res.status(403).json({
        error: 'You can only edit your own timesheet',
        userId: req.user.id,
        targetEmployeeId
    });
}

/**
 * Generate JWT token for user
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        azureId: user.azure_id,
        email: user.email,
        displayName: user.display_name,
        teamsName: user.teams_name,
        role: user.role,
        employeeId: user.employee_id // Link to employees table
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify and decode JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

module.exports = {
    authenticateToken,
    requireAdmin,
    canEditEmployee,
    generateToken,
    verifyToken
};
