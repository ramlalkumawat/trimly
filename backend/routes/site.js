const express = require('express');
const router = express.Router();
const { createInquiry } = require('../controllers/siteController');

// Public marketing/site endpoints.
router.post('/inquiries', createInquiry);

module.exports = router;
