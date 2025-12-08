const database = require('../config/database');

class EmployeeModel {
    /**
     * Create a new employee
     */
    static async create(employeeData) {
        const {
            id,
            name,
            email = '',
            phone = '',
            department = '',
            position = '',
            status = 'active',
            userId = null
        } = employeeData;

        const createdAt = new Date().toISOString();

        await database.run(
            `INSERT INTO employees (id, name, email, phone, department, position, status, userId, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, email, phone, department, position, status, userId, createdAt, createdAt]
        );

        return await this.findById(id);
    }

    /**
     * Find employee by ID
     */
    static async findById(id) {
        return await database.get(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );
    }

    /**
     * Find employee by name
     */
    static async findByName(name) {
        return await database.get(
            'SELECT * FROM employees WHERE name = ?',
            [name]
        );
    }

    /**
     * Find employee by user ID
     */
    static async findByUserId(userId) {
        return await database.get(
            'SELECT * FROM employees WHERE userId = ?',
            [userId]
        );
    }

    /**
     * Get all employees
     */
    static async getAll(filters = {}) {
        let query = 'SELECT * FROM employees WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.department) {
            query += ' AND department = ?';
            params.push(filters.department);
        }

        query += ' ORDER BY name';

        return await database.all(query, params);
    }

    /**
     * Update employee
     */
    static async update(id, updates) {
        const { name, email, phone, department, position, status, userId } = updates;
        const updatedAt = new Date().toISOString();

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email);
        }
        if (phone !== undefined) {
            fields.push('phone = ?');
            values.push(phone);
        }
        if (department !== undefined) {
            fields.push('department = ?');
            values.push(department);
        }
        if (position !== undefined) {
            fields.push('position = ?');
            values.push(position);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            values.push(status);
        }
        if (userId !== undefined) {
            fields.push('userId = ?');
            values.push(userId);
        }

        fields.push('updatedAt = ?');
        values.push(updatedAt);
        values.push(id);

        await database.run(
            `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return await this.findById(id);
    }

    /**
     * Delete employee
     */
    static async delete(id) {
        // Backup to deleted_records
        const employee = await this.findById(id);
        if (employee) {
            await database.run(
                `INSERT INTO deleted_records (recordType, recordId, recordData, deletedAt) 
                 VALUES (?, ?, ?, ?)`,
                ['employee', id, JSON.stringify(employee), new Date().toISOString()]
            );
        }

        const result = await database.run(
            'DELETE FROM employees WHERE id = ?',
            [id]
        );

        return result.changes > 0;
    }

    /**
     * Check if employee name exists
     */
    static async nameExists(name, excludeId = null) {
        let query = 'SELECT id FROM employees WHERE name = ?';
        const params = [name];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const employee = await database.get(query, params);
        return !!employee;
    }

    /**
     * Get employee with user details
     */
    static async getWithUser(id) {
        return await database.get(
            `SELECT e.*, u.username, u.role 
             FROM employees e 
             LEFT JOIN users u ON e.userId = u.id 
             WHERE e.id = ?`,
            [id]
        );
    }

    /**
     * Get all employees with user details
     */
    static async getAllWithUsers() {
        return await database.all(
            `SELECT e.*, u.username, u.role 
             FROM employees e 
             LEFT JOIN users u ON e.userId = u.id 
             ORDER BY e.name`
        );
    }
}

module.exports = EmployeeModel;
