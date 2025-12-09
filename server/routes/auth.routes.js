const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { optionalAuth } = require('../middleware/auth');

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', optionalAuth, AuthController.getCurrentUser);

module.exports = router;
