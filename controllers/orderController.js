const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item data' });
      }
    }

    const order = new Order({
      userId: req.user._id,
      items
    });

    await order.save();
    await order.populate('userId', 'name email');
    await order.populate('items.productId', 'name price sellerId images');

    req.io.emit('new_order', {
      order,
      message: 'New order received'
    });

    for (const item of order.items) {
      req.io.to(item.productId.sellerId.toString()).emit('seller_new_order', {
        order,
        product: item.productId,
        quantity: item.quantity,
        message: `New order for ${item.productId.name}`
      });

      if (item.productId.stock <= 10) {
        req.io.to(item.productId.sellerId.toString()).emit('low_stock_alert', {
          product: item.productId,
          currentStock: item.productId.stock,
          message: `Low stock alert for ${item.productId.name}`
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (req.user.role === 'customer') {
      query.userId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let ordersQuery = Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    if (req.user.role === 'customer') {
      ordersQuery = ordersQuery.populate('items.productId', 'name price images');
    } else {
      ordersQuery = ordersQuery.populate('userId', 'name email')
        .populate('items.productId', 'name price sellerId images');
    }

    const orders = await ordersQuery;

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price sellerId images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'seller') {
      const hasSellerProduct = order.items.some(item => 
        item.productId.sellerId.toString() === req.user._id.toString()
      );
      if (!hasSellerProduct) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name sellerId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'seller') {
      const hasSellerProduct = order.items.some(item => 
        item.productId.sellerId.toString() === req.user._id.toString()
      );
      if (!hasSellerProduct) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const oldStatus = order.status;
    await order.updateStatus(status);
    await order.populate('items.productId', 'name sellerId images');

    req.io.emit('order_status_updated', {
      orderId: order._id,
      oldStatus,
      newStatus: status,
      order,
      message: `Order status updated from ${oldStatus} to ${status}`
    });

    req.io.to(order.userId._id.toString()).emit('customer_order_update', {
      order,
      status,
      message: `Your order status has been updated to ${status}`
    });

    for (const item of order.items) {
      req.io.to(item.productId.sellerId.toString()).emit('seller_order_update', {
        order,
        status,
        message: `Order status updated to ${status}`
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('items.productId', 'name sellerId stock');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ message: 'Order cannot be cancelled in current status' });
    }

    const oldStatus = order.status;
    await order.updateStatus('cancelled');

    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: item.quantity } }
      );
    }

    req.io.emit('order_cancelled', {
      orderId: order._id,
      oldStatus,
      order,
      message: 'Order has been cancelled'
    });

    req.io.to(order.userId.toString()).emit('customer_order_cancelled', {
      order,
      message: 'Your order has been cancelled and stock has been restored'
    });

    for (const item of order.items) {
      req.io.to(item.productId.sellerId.toString()).emit('seller_order_cancelled', {
        order,
        message: 'Order has been cancelled and stock has been restored'
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};
