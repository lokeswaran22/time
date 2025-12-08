/**
 * Compatibility Controller
 * Provides backward compatibility with existing frontend API calls
 * Maps old API format to new modular architecture
 */

const AuthController = require('./auth.controller');
const EmployeeController = require('./employee.controller');
const TimesheetController = require('./timesheet.controller');
const ExportController = require('./export.controller');

class CompatibilityController {
    // Auth endpoints
    static async login(req, res) {
        return AuthController.login(req, res);
    }

    static async register(req, res) {
        return AuthController.register(req, res);
    }

    // Employee endpoints
    static async getEmployees(req, res) {
        // Inject fake auth for backward compatibility
        req.user = { role: 'admin' };
        return EmployeeController.getAll(req, res);
    }

    static async saveEmployee(req, res) {
        req.user = { role: 'admin' };

        // Check if it's an update or create
        if (req.body.id) {
            const existingCheck = await require('../models/employee.model').findById(req.body.id);
            if (existingCheck) {
                req.params.id = req.body.id;
                return EmployeeController.update(req, res);
            }
        }

        return EmployeeController.create(req, res);
    }

    static async deleteEmployee(req, res) {
        req.user = { role: 'admin' };
        return EmployeeController.delete(req, res);
    }

    // Timesheet endpoints
    static async getActivities(req, res) {
        req.user = { role: 'admin' };
        return TimesheetController.getEntries(req, res);
    }

    static async saveActivity(req, res) {
        req.user = { role: 'admin' };
        return TimesheetController.saveEntry(req, res);
    }

    static async deleteActivity(req, res) {
        req.user = { role: 'admin' };
        return TimesheetController.deleteEntry(req, res);
    }

    // Activity log endpoints
    static async getActivityLog(req, res) {
        req.user = { role: 'admin' };
        return TimesheetController.getActivityLog(req, res);
    }

    static async logActivity(req, res) {
        req.user = { role: 'admin' };
        return TimesheetController.logActivity(req, res);
    }

    static async clearActivityLog(req, res) {
        req.user = { role: 'admin' };
        return TimesheetController.clearActivityLog(req, res);
    }

    // Export endpoint
    static async exportExcel(req, res) {
        req.user = { role: 'admin' };
        return ExportController.exportToExcel(req, res);
    }
}

module.exports = CompatibilityController;
