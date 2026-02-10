const Product = require('../models/Product');

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one product image is required' });
    }

    const images = req.files.map(file => `/uploads/${file.filename}`);

    const product = new Product({
      name,
      description,
      price,
      stock,
      images,
      sellerId: req.user._id
    });

    await product.save();

    await product.populate('sellerId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (req.user.role === 'seller') {
      query.sellerId = req.user._id;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('sellerId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate('sellerId', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role === 'seller' && product.sellerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    const product = await Product.findOne({ _id: id, isActive: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role === 'seller' && product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = { name, description, price, stock };

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      updateData.images = [...product.images, ...newImages];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sellerId', 'name email');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isActive: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role === 'seller' && product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const removeProductImage = async (req, res, next) => {
  try {
    const { id, imageIndex } = req.params;

    const product = await Product.findOne({ _id: id, isActive: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role === 'seller' && product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (product.images.length <= 1) {
      return res.status(400).json({ message: 'Product must have at least one image' });
    }

    product.images.splice(parseInt(imageIndex), 1);
    await product.save();

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  removeProductImage
};
