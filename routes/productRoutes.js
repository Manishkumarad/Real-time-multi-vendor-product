const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  removeProductImage
} = require('../controllers/productController');

const router = express.Router();

router.post('/', auth, authorize('seller', 'admin'), uploadMultiple, createProduct);
router.get('/', auth, getProducts);
router.get('/:id', auth, getProductById);
router.put('/:id', auth, authorize('seller', 'admin'), uploadMultiple, updateProduct);
router.delete('/:id', auth, authorize('seller', 'admin'), deleteProduct);
router.delete('/:id/images/:imageIndex', auth, authorize('seller', 'admin'), removeProductImage);

module.exports = router;
