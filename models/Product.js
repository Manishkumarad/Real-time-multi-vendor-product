const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v.toString().split('.')[1]?.length <= 2;
      },
      message: 'Price cannot have more than 2 decimal places'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ sellerId: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });

productSchema.methods.checkStock = function(quantity) {
  return this.stock >= quantity;
};

productSchema.methods.reduceStock = async function(quantity) {
  if (!this.checkStock(quantity)) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  return this.save();
};

productSchema.methods.toJSON = function() {
  const productObject = this.toObject();
  delete productObject.__v;
  return productObject;
};

module.exports = mongoose.model('Product', productSchema);
