const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employee.controller');
const { isAuthenticated, isAdmin, canAccessEmployee } = require('../middleware/auth');

// All employee routes require authentication
router.use(isAuthenticated);

// Get all employees (admin or employee can view list)
router.get('/', EmployeeController.getAll);

// Get employee by ID
router.get('/:id', canAccessEmployee, EmployeeController.getById);

// Admin-only routes
router.post('/', isAdmin, EmployeeController.create);
router.put('/:id', isAdmin, EmployeeController.update);
router.delete('/:id', isAdmin, EmployeeController.delete);

module.exports = router;
