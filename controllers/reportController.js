const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const getSellerRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {
      'items.productId': { $exists: true },
      status: { $ne: 'cancelled' }
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const sellerRevenue = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'users',
          localField: 'product.sellerId',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $group: {
          _id: '$product.sellerId',
          sellerName: { $first: '$seller.name' },
          sellerEmail: { $first: '$seller.email' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          totalOrders: { $sum: 1 },
          totalProductsSold: { $sum: '$items.quantity' },
          averageOrderValue: { $avg: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $project: {
          _id: 0,
          sellerId: '$_id',
          sellerName: 1,
          sellerEmail: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalOrders: 1,
          totalProductsSold: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: { sellerRevenue }
    });
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {
      'items.productId': { $exists: true },
      status: { $ne: 'cancelled' }
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$product.name' },
          productDescription: { $first: '$product.description' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 },
          averagePrice: { $avg: '$items.price' }
        }
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          productDescription: 1,
          totalQuantitySold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
          averagePrice: { $round: ['$averagePrice', 2] }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: { topProducts }
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyRevenue = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $let: {
              vars: {
                months: [
                  '', 'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ]
              },
              in: { $arrayElemAt: ['$$months', '$_id.month'] }
            }
          },
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] }
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.json({
      success: true,
      data: { monthlyRevenue }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topSellers,
      lowStockProducts
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.sellerId',
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'seller'
          }
        },
        { $unwind: '$seller' },
        {
          $project: {
            sellerName: '$seller.name',
            sellerEmail: '$seller.email',
            totalRevenue: { $round: ['$totalRevenue', 2] }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]),
      Product.find({ stock: { $lt: 10 }, isActive: true })
        .populate('sellerId', 'name email')
        .sort({ stock: 1 })
        .limit(10)
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: revenue,
          averageOrderValue: totalOrders > 0 ? (revenue / totalOrders).toFixed(2) : 0
        },
        ordersByStatus,
        recentOrders,
        topSellers,
        lowStockProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const sellerId = req.user.role === 'seller' ? req.user._id : null;
    
    let matchStage = { 
      stock: { $lt: 10 }, 
      isActive: true 
    };

    if (sellerId) {
      matchStage.sellerId = sellerId;
    }

    const lowStockProducts = await Product.find(matchStage)
      .populate('sellerId', 'name email')
      .sort({ stock: 1 });

    const report = {
      totalLowStockProducts: lowStockProducts.length,
      products: lowStockProducts,
      criticalStock: lowStockProducts.filter(p => p.stock < 5),
      outOfStock: lowStockProducts.filter(p => p.stock === 0)
    };

    res.json({
      success: true,
      data: { lowStockReport: report }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSellerRevenue,
  getTopProducts,
  getMonthlyRevenue,
  getAdminDashboard,
  getLowStockReport
};
