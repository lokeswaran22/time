const EmployeeModel = require('../models/employee.model');
const UserModel = require('../models/user.model');

class EmployeeController {
    /**
     * Get all employees
     */
    static async getAll(req, res) {
        try {
            const { status, department } = req.query;
            const filters = {};

            if (status) filters.status = status;
            if (department) filters.department = department;

            const employees = await EmployeeModel.getAllWithUsers();

            res.json({
                success: true,
                employees
            });

        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to fetch employees'
            });
        }
    }

    /**
     * Get employee by ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;

            const employee = await EmployeeModel.getWithUser(id);

            if (!employee) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Employee not found'
                });
            }

            res.json({
                success: true,
                employee
            });

        } catch (error) {
            console.error('Get employee error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to fetch employee'
            });
        }
    }

    /**
     * Create new employee
     */
    static async create(req, res) {
        try {
            const {
                id,
                name,
                email,
                phone,
                department,
                position,
                username,
                password
            } = req.body;

            if (!name) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Employee name is required'
                });
            }

            // Check if name already exists
            const nameExists = await EmployeeModel.nameExists(name);
            if (nameExists) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: `Employee "${name}" already exists`
                });
            }

            // Generate ID if not provided
            const employeeId = id || (name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now());

            let userId = null;

            // Create user account if credentials provided
            if (username && password) {
                const usernameExists = await UserModel.usernameExists(username);
                if (usernameExists) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Username already exists'
                    });
                }

                const role = username.toLowerCase().includes('admin') ? 'admin' : 'employee';
                const user = await UserModel.create({ username, password, role });
                userId = user.id;
            }

            // Create employee
            const employee = await EmployeeModel.create({
                id: employeeId,
                name,
                email,
                phone,
                department,
                position,
                userId
            });

            res.json({
                success: true,
                employee,
                message: 'Employee created successfully'
            });

        } catch (error) {
            console.error('Create employee error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to create employee'
            });
        }
    }

    /**
     * Update employee
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                email,
                phone,
                department,
                position,
                status,
                username,
                password
            } = req.body;

            const employee = await EmployeeModel.findById(id);

            if (!employee) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Employee not found'
                });
            }

            // Check if new name already exists
            if (name && name !== employee.name) {
                const nameExists = await EmployeeModel.nameExists(name, id);
                if (nameExists) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: `Employee "${name}" already exists`
                    });
                }
            }

            // Update user credentials if provided
            if (employee.userId && (username || password)) {
                const userUpdates = {};
                if (username) userUpdates.username = username;
                if (password) userUpdates.password = password;
                await UserModel.update(employee.userId, userUpdates);
            }

            // Update employee
            const updates = {};
            if (name) updates.name = name;
            if (email !== undefined) updates.email = email;
            if (phone !== undefined) updates.phone = phone;
            if (department !== undefined) updates.department = department;
            if (position !== undefined) updates.position = position;
            if (status) updates.status = status;

            const updatedEmployee = await EmployeeModel.update(id, updates);

            res.json({
                success: true,
                employee: updatedEmployee,
                message: 'Employee updated successfully'
            });

        } catch (error) {
            console.error('Update employee error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to update employee'
            });
        }
    }

    /**
     * Delete employee
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;

            const employee = await EmployeeModel.findById(id);

            if (!employee) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Employee not found'
                });
            }

            // Delete associated user if exists
            if (employee.userId) {
                await UserModel.delete(employee.userId);
            }

            // Delete employee
            await EmployeeModel.delete(id);

            res.json({
                success: true,
                message: 'Employee deleted successfully'
            });

        } catch (error) {
            console.error('Delete employee error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to delete employee'
            });
        }
    }
}

module.exports = EmployeeController;
