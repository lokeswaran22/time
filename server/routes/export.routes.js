const express = require('express');
const router = express.Router();
const ExportController = require('../controllers/export.controller');
const { isAuthenticated } = require('../middleware/auth');

// Export to Excel (requires authentication)
router.get('/excel', isAuthenticated, ExportController.exportToExcel);

module.exports = router;
