const database = require('../config/database');

class TimesheetModel {
    /**
     * Create or update timesheet entry
     */
    static async createOrUpdate(timesheetData) {
        const {
            employeeId,
            dateKey,
            timeSlot,
            activityType,
            description = '',
            startPage = null,
            endPage = null,
            totalPages = null,
            pagesDone = null,
            status = 'draft'
        } = timesheetData;

        const createdAt = new Date().toISOString();

        // Check if entry exists
        const existing = await database.get(
            'SELECT id FROM timesheets WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?',
            [dateKey, employeeId, timeSlot]
        );

        if (existing) {
            // Update existing
            await database.run(
                `UPDATE timesheets 
                 SET activityType = ?, description = ?, startPage = ?, endPage = ?, 
                     totalPages = ?, pagesDone = ?, status = ?, updatedAt = ?
                 WHERE id = ?`,
                [activityType, description, startPage, endPage, totalPages, pagesDone, status, createdAt, existing.id]
            );
            return await this.findById(existing.id);
        } else {
            // Create new
            const result = await database.run(
                `INSERT INTO timesheets 
                 (employeeId, dateKey, timeSlot, activityType, description, startPage, endPage, totalPages, pagesDone, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [employeeId, dateKey, timeSlot, activityType, description, startPage, endPage, totalPages, pagesDone, status, createdAt, createdAt]
            );
            return await this.findById(result.lastID);
        }
    }

    /**
     * Find timesheet by ID
     */
    static async findById(id) {
        return await database.get(
            'SELECT * FROM timesheets WHERE id = ?',
            [id]
        );
    }

    /**
     * Get timesheet entries by date
     */
    static async getByDate(dateKey, employeeId = null) {
        let query = 'SELECT * FROM timesheets WHERE dateKey = ?';
        const params = [dateKey];

        if (employeeId) {
            query += ' AND employeeId = ?';
            params.push(employeeId);
        }

        query += ' ORDER BY timeSlot';

        return await database.all(query, params);
    }

    /**
     * Get timesheet entries by employee
     */
    static async getByEmployee(employeeId, dateKey = null) {
        let query = 'SELECT * FROM timesheets WHERE employeeId = ?';
        const params = [employeeId];

        if (dateKey) {
            query += ' AND dateKey = ?';
            params.push(dateKey);
        }

        query += ' ORDER BY dateKey DESC, timeSlot';

        return await database.all(query, params);
    }

    /**
     * Get all timesheet entries
     */
    static async getAll(filters = {}) {
        let query = 'SELECT * FROM timesheets WHERE 1=1';
        const params = [];

        if (filters.dateKey) {
            query += ' AND dateKey = ?';
            params.push(filters.dateKey);
        }

        if (filters.employeeId) {
            query += ' AND employeeId = ?';
            params.push(filters.employeeId);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY dateKey DESC, employeeId, timeSlot';

        return await database.all(query, params);
    }

    /**
     * Delete timesheet entry
     */
    static async delete(dateKey, employeeId, timeSlot) {
        // Backup to deleted_records
        const timesheet = await database.get(
            'SELECT * FROM timesheets WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?',
            [dateKey, employeeId, timeSlot]
        );

        if (timesheet) {
            await database.run(
                `INSERT INTO deleted_records (recordType, recordId, recordData, deletedAt) 
                 VALUES (?, ?, ?, ?)`,
                ['timesheet', timesheet.id.toString(), JSON.stringify(timesheet), new Date().toISOString()]
            );
        }

        const result = await database.run(
            'DELETE FROM timesheets WHERE dateKey = ? AND employeeId = ? AND timeSlot = ?',
            [dateKey, employeeId, timeSlot]
        );

        return result.changes > 0;
    }

    /**
     * Submit timesheet for approval
     */
    static async submit(employeeId, dateKey) {
        const submittedAt = new Date().toISOString();

        await database.run(
            `UPDATE timesheets 
             SET status = 'submitted', submittedAt = ?, updatedAt = ?
             WHERE employeeId = ? AND dateKey = ? AND status = 'draft'`,
            [submittedAt, submittedAt, employeeId, dateKey]
        );

        return await this.getByDate(dateKey, employeeId);
    }

    /**
     * Approve timesheet
     */
    static async approve(employeeId, dateKey, approvedBy) {
        const approvedAt = new Date().toISOString();

        await database.run(
            `UPDATE timesheets 
             SET status = 'approved', approvedAt = ?, approvedBy = ?, updatedAt = ?
             WHERE employeeId = ? AND dateKey = ? AND status = 'submitted'`,
            [approvedAt, approvedBy, approvedAt, employeeId, dateKey]
        );

        return await this.getByDate(dateKey, employeeId);
    }

    /**
     * Get timesheet summary for a date
     */
    static async getSummary(dateKey) {
        return await database.all(
            `SELECT 
                e.id as employeeId,
                e.name as employeeName,
                COUNT(t.id) as totalEntries,
                SUM(CASE WHEN t.activityType = 'proof' THEN t.pagesDone ELSE 0 END) as proofPages,
                SUM(CASE WHEN t.activityType = 'epub' THEN t.pagesDone ELSE 0 END) as epubPages,
                SUM(CASE WHEN t.activityType = 'calibr' THEN t.pagesDone ELSE 0 END) as calibrPages,
                t.status
             FROM employees e
             LEFT JOIN timesheets t ON e.id = t.employeeId AND t.dateKey = ?
             GROUP BY e.id, e.name
             ORDER BY e.name`,
            [dateKey]
        );
    }
}

module.exports = TimesheetModel;
