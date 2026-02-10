const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.productId': 1 });

orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Product = mongoose.model('Product');
    
    for (const item of this.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return next(new Error(`Product ${item.productId} is not available`));
      }
      
      if (!product.checkStock(item.quantity)) {
        return next(new Error(`Insufficient stock for product ${product.name}`));
      }
      
      item.price = product.price;
    }
    
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  next();
});

orderSchema.post('save', async function(doc) {
  if (doc.isNew) {
    const Product = mongoose.model('Product');
    
    for (const item of doc.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }
  }
});

orderSchema.methods.updateStatus = function(newStatus) {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped'],
    'shipped': ['delivered'],
    'delivered': [],
    'cancelled': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  return this.save();
};

orderSchema.methods.toJSON = function() {
  const orderObject = this.toObject();
  delete orderObject.__v;
  return orderObject;
};

module.exports = mongoose.model('Order', orderSchema);
