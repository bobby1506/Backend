const express = require('express');
const contactController = require('../controllers/contactController');

const router = express.Router();

// Route for handling the contact form submission
router.post('/contact', contactController.createContact);

module.exports = router;
