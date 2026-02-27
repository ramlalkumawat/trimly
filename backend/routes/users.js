const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyAdmin } = require('../middlewares/roleMiddleware');

// Legacy admin user-management routes retained for compatibility.
router.use(protect);
router.get('/', onlyAdmin, getUsers);
router.patch('/:id', onlyAdmin, require('../controllers/userController').updateUser);

module.exports = router;
