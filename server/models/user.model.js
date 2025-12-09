const database = require('../config/database');

class UserModel {
    /**
     * Create a new user
     */
    static async create(userData) {
        const { username, password, role = 'employee' } = userData;
        const createdAt = new Date().toISOString();

        const result = await database.run(
            `INSERT INTO users (username, password, role, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, password, role, createdAt, createdAt]
        );

        return {
            id: result.lastID,
            username,
            role,
            createdAt
        };
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        return await database.get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        return await database.get(
            'SELECT id, username, role, createdAt, updatedAt FROM users WHERE id = ?',
            [id]
        );
    }

    /**
     * Authenticate user
     */
    static async authenticate(username, password) {
        const user = await database.get(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (!user) {
            return null;
        }

        // Don't return password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Update user
     */
    static async update(id, updates) {
        const { username, password, role } = updates;
        const updatedAt = new Date().toISOString();

        const fields = [];
        const values = [];

        if (username) {
            fields.push('username = ?');
            values.push(username);
        }
        if (password) {
            fields.push('password = ?');
            values.push(password);
        }
        if (role) {
            fields.push('role = ?');
            values.push(role);
        }

        fields.push('updatedAt = ?');
        values.push(updatedAt);
        values.push(id);

        await database.run(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return await this.findById(id);
    }

    /**
     * Delete user
     */
    static async delete(id) {
        const result = await database.run(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        return result.changes > 0;
    }

    /**
     * Get all users
     */
    static async getAll() {
        return await database.all(
            'SELECT id, username, role, createdAt, updatedAt FROM users ORDER BY username'
        );
    }

    /**
     * Check if username exists
     */
    static async usernameExists(username, excludeId = null) {
        let query = 'SELECT id FROM users WHERE username = ?';
        const params = [username];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const user = await database.get(query, params);
        return !!user;
    }
}

module.exports = UserModel;
