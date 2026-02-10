const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getSellerRevenue,
  getTopProducts,
  getMonthlyRevenue,
  getAdminDashboard,
  getLowStockReport
} = require('../controllers/reportController');

const router = express.Router();

router.get('/seller-revenue', auth, authorize('admin'), getSellerRevenue);
router.get('/top-products', auth, authorize('admin'), getTopProducts);
router.get('/monthly-revenue', auth, authorize('admin'), getMonthlyRevenue);
router.get('/admin-dashboard', auth, authorize('admin'), getAdminDashboard);
router.get('/low-stock', auth, getLowStockReport);

module.exports = router;
