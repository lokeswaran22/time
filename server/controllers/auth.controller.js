const UserModel = require('../models/user.model');
const EmployeeModel = require('../models/employee.model');

class AuthController {
    /**
     * Login user
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Username and password are required'
                });
            }

            // Authenticate user
            const user = await UserModel.authenticate(username, password);

            if (!user) {
                return res.status(401).json({
                    error: 'Authentication Failed',
                    message: 'Invalid username or password'
                });
            }

            // Determine role
            const role = username.toLowerCase().includes('admin') ? 'admin' : 'employee';

            // Update role if different
            if (user.role !== role) {
                await UserModel.update(user.id, { role });
                user.role = role;
            }

            // Find or create linked employee for non-admin users
            let employeeId = null;
            let employeeName = null;

            if (role === 'employee') {
                let employee = await EmployeeModel.findByUserId(user.id);

                if (!employee) {
                    // Try to find by username
                    employee = await EmployeeModel.findByName(username);

                    if (!employee) {
                        // Auto-create employee
                        const empId = username.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
                        employee = await EmployeeModel.create({
                            id: empId,
                            name: username,
                            userId: user.id,
                            status: 'active'
                        });
                    } else {
                        // Link existing employee to user
                        await EmployeeModel.update(employee.id, { userId: user.id });
                    }
                }

                employeeId = employee.id;
                employeeName = employee.name;
            }

            // Return user session data
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    employeeId,
                    employeeName
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'An error occurred during login'
            });
        }
    }

    /**
     * Register new user
     */
    static async register(req, res) {
        try {
            const { username, password, role = 'employee' } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Username and password are required'
                });
            }

            // Check if username exists
            const exists = await UserModel.usernameExists(username);
            if (exists) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Username already exists'
                });
            }

            // Create user
            const user = await UserModel.create({ username, password, role });

            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'An error occurred during registration'
            });
        }
    }

    /**
     * Logout user (client-side handles session clearing)
     */
    static async logout(req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }

    /**
     * Get current user info
     */
    static async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Not logged in'
                });
            }

            const user = await UserModel.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'User not found'
                });
            }

            // Get employee data if employee role
            let employeeData = null;
            if (user.role === 'employee') {
                employeeData = await EmployeeModel.findByUserId(user.id);
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    employee: employeeData
                }
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'An error occurred'
            });
        }
    }
}

module.exports = AuthController;
