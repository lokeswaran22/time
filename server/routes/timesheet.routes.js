const express = require('express');
const router = express.Router();
const TimesheetController = require('../controllers/timesheet.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All timesheet routes require authentication
router.use(isAuthenticated);

// Get timesheet entries
router.get('/', TimesheetController.getEntries);

// Get timesheet summary
router.get('/summary', TimesheetController.getSummary);

// Save timesheet entry
router.post('/', TimesheetController.saveEntry);

// Delete timesheet entry
router.delete('/', TimesheetController.deleteEntry);

// Submit timesheet for approval
router.post('/submit', TimesheetController.submitTimesheet);

// Approve timesheet (admin only)
router.post('/approve', isAdmin, TimesheetController.approveTimesheet);

// Activity log routes
router.get('/activity-log', TimesheetController.getActivityLog);
router.post('/activity-log', TimesheetController.logActivity);
router.delete('/activity-log', isAdmin, TimesheetController.clearActivityLog);

module.exports = router;
