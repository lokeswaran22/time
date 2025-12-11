const TimesheetModel = require('../models/timesheet.model');
const database = require('../config/database');

class TimesheetController {
    /**
     * Get timesheet entries
     */
    static async getEntries(req, res) {
        try {
            const { dateKey, employeeId, status } = req.query;

            const filters = {};
            if (dateKey) filters.dateKey = dateKey;
            if (employeeId) filters.employeeId = employeeId;
            if (status) filters.status = status;

            const entries = await TimesheetModel.getAll(filters);

            // Group by date and employee
            const grouped = {};
            entries.forEach(entry => {
                if (!grouped[entry.dateKey]) grouped[entry.dateKey] = {};
                if (!grouped[entry.dateKey][entry.employeeId]) grouped[entry.dateKey][entry.employeeId] = {};

                grouped[entry.dateKey][entry.employeeId][entry.timeSlot] = {
                    type: entry.activityType,
                    description: entry.description,
                    startPage: entry.startPage,
                    endPage: entry.endPage,
                    totalPages: entry.totalPages,
                    pagesDone: entry.pagesDone,
                    status: entry.status,
                    timestamp: entry.updatedAt
                };
            });

            res.json({
                success: true,
                activities: grouped,
                entries
            });

        } catch (error) {
            console.error('Get timesheet entries error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to fetch timesheet entries'
            });
        }
    }

    /**
     * Create or update timesheet entry
     */
    static async saveEntry(req, res) {
        try {
            const {
                employeeId,
                dateKey,
                timeSlot,
                type,
                description,
                totalPages,
                pagesDone,
                startPage,
                endPage,
                timestamp
            } = req.body;

            if (!employeeId || !dateKey || !timeSlot || !type) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Missing required fields'
                });
            }

            // Calculate pages if start and end provided
            let calculatedPages = pagesDone;
            if (startPage && endPage) {
                calculatedPages = Math.max(0, endPage - startPage + 1);
            }

            const entry = await TimesheetModel.createOrUpdate({
                employeeId,
                dateKey,
                timeSlot,
                activityType: type,
                description,
                startPage,
                endPage,
                totalPages,
                pagesDone: calculatedPages,
                status: 'draft'
            });

            res.json({
                success: true,
                entry,
                message: 'Timesheet entry saved'
            });

        } catch (error) {
            console.error('Save timesheet entry error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to save timesheet entry'
            });
        }
    }

    /**
     * Delete timesheet entry
     */
    static async deleteEntry(req, res) {
        try {
            const { dateKey, employeeId, timeSlot } = req.body;

            if (!dateKey || !employeeId || !timeSlot) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Missing required fields'
                });
            }

            const deleted = await TimesheetModel.delete(dateKey, employeeId, timeSlot);

            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Timesheet entry not found'
                });
            }

            res.json({
                success: true,
                message: 'Timesheet entry deleted'
            });

        } catch (error) {
            console.error('Delete timesheet entry error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to delete timesheet entry'
            });
        }
    }

    /**
     * Submit timesheet for approval
     */
    static async submitTimesheet(req, res) {
        try {
            const { employeeId, dateKey } = req.body;

            if (!employeeId || !dateKey) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Missing required fields'
                });
            }

            const entries = await TimesheetModel.submit(employeeId, dateKey);

            res.json({
                success: true,
                entries,
                message: 'Timesheet submitted for approval'
            });

        } catch (error) {
            console.error('Submit timesheet error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to submit timesheet'
            });
        }
    }

    /**
     * Approve timesheet
     */
    static async approveTimesheet(req, res) {
        try {
            const { employeeId, dateKey } = req.body;
            const approvedBy = req.user.id;

            if (!employeeId || !dateKey) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Missing required fields'
                });
            }

            const entries = await TimesheetModel.approve(employeeId, dateKey, approvedBy);

            res.json({
                success: true,
                entries,
                message: 'Timesheet approved'
            });

        } catch (error) {
            console.error('Approve timesheet error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to approve timesheet'
            });
        }
    }

    /**
     * Get timesheet summary
     */
    static async getSummary(req, res) {
        try {
            const { dateKey } = req.query;

            if (!dateKey) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Date is required'
                });
            }

            const summary = await TimesheetModel.getSummary(dateKey);

            res.json({
                success: true,
                summary
            });

        } catch (error) {
            console.error('Get timesheet summary error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to fetch timesheet summary'
            });
        }
    }

    /**
     * Log activity
     */
    static async logActivity(req, res) {
        try {
            const {
                dateKey,
                employeeName,
                activityType,
                description,
                timeSlot,
                action,
                editedBy
            } = req.body;

            const createdAt = new Date().toISOString();

            const result = await database.run(
                `INSERT INTO activity_log 
                 (dateKey, employeeName, activityType, description, timeSlot, action, editedBy, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [dateKey, employeeName, activityType, description, timeSlot, action, editedBy || 'System', createdAt]
            );

            res.json({
                success: true,
                id: result.lastID,
                message: 'Activity logged'
            });

        } catch (error) {
            console.error('Log activity error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to log activity'
            });
        }
    }

    /**
     * Get activity log
     */
    static async getActivityLog(req, res) {
        try {
            const { limit = 50 } = req.query;

            const logs = await database.all(
                'SELECT * FROM activity_log ORDER BY id DESC LIMIT ?',
                [parseInt(limit)]
            );

            res.json({
                success: true,
                logs
            });

        } catch (error) {
            console.error('Get activity log error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to fetch activity log'
            });
        }
    }

    /**
     * Clear activity log
     */
    static async clearActivityLog(req, res) {
        try {
            await database.run('DELETE FROM activity_log');

            res.json({
                success: true,
                message: 'Activity log cleared'
            });

        } catch (error) {
            console.error('Clear activity log error:', error);
            res.status(500).json({
                error: 'Server Error',
                message: 'Failed to clear activity log'
            });
        }
    }
}

module.exports = TimesheetController;
