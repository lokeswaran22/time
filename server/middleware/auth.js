/**
 * Authentication Middleware
 * Validates user session and role-based access
 */

const authMiddleware = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated: (req, res, next) => {
        const sessionUser = req.headers['x-user-session'];

        if (!sessionUser) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please login to continue'
            });
        }

        try {
            const user = JSON.parse(sessionUser);
            if (!user.id || !user.username || !user.role) {
                throw new Error('Invalid session data');
            }
            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({
                error: 'Invalid session',
                message: 'Please login again'
            });
        }
    },

    /**
     * Check if user is admin
     */
    isAdmin: (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please login to continue'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        next();
    },

    /**
     * Check if user is employee
     */
    isEmployee: (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please login to continue'
            });
        }

        if (req.user.role !== 'employee') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Employee access required'
            });
        }

        next();
    },

    /**
     * Check if user can access employee data
     * Admin can access all, employee can only access their own
     */
    canAccessEmployee: (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please login to continue'
            });
        }

        const requestedEmployeeId = req.params.employeeId || req.body.employeeId;

        // Admin can access all employees
        if (req.user.role === 'admin') {
            return next();
        }

        // Employee can only access their own data
        if (req.user.employeeId === requestedEmployeeId) {
            return next();
        }

        return res.status(403).json({
            error: 'Forbidden',
            message: 'You can only access your own data'
        });
    },

    /**
     * Optional authentication - continues even if not authenticated
     */
    optionalAuth: (req, res, next) => {
        const sessionUser = req.headers['x-user-session'];

        if (sessionUser) {
            try {
                req.user = JSON.parse(sessionUser);
            } catch (err) {
                req.user = null;
            }
        }

        next();
    }
};

module.exports = authMiddleware;
