const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', auth, authorize('customer'), createOrder);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrderById);
router.put('/:id/status', auth, authorize('admin', 'seller'), updateOrderStatus);
router.put('/:id/cancel', auth, authorize('customer', 'admin'), cancelOrder);

module.exports = router;
