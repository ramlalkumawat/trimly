const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyAdmin } = require('../middlewares/roleMiddleware');

// Service catalog routes: public read access and admin-protected mutations.
// public list
router.get('/', getServices);
router.get('/:id', getServiceById);

// protected admin operations
router.post('/', protect, onlyAdmin, createService);
router.patch('/:id', protect, onlyAdmin, updateService);
router.delete('/:id', protect, onlyAdmin, deleteService);

module.exports = router;
