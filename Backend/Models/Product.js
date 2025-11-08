import mongoose, { Schema } from 'mongoose';


const ProductSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Beverages']
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    image: {
      type: String
    },
    pricing: {
      costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: [0, 'Cost price must be positive']
      },
      mrp: {
        type: Number,
        required: [true, 'MRP is required'],
        min: [0, 'MRP must be positive']
      },
      currentPrice: {
        type: Number,
        required: [true, 'Current price is required'],
        min: [0, 'Current price must be positive']
      },
      profitMargin: {
        type: Number,
        default: 0
      }
    },
    stock: {
      quantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock quantity cannot be negative'],
        default: 0
      },
      unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'units', 'dozen'],
        default: 'units'
      },
      reorderLevel: {
        type: Number,
        default: 10
      },
      reorderQuantity: {
        type: Number,
        default: 50
      }
    },
    perishable: {
      manufactureDate: {
        type: Date,
        required: [true, 'Manufacture date is required']
      },
      expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
      },
      shelfLife: {
        type: Number,
        required: true
      },
      daysToExpiry: {
        type: Number,
        default: 0
      }
    },
    aiMetrics: {
      demandScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      spoilageRisk: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      recommendedPrice: {
        type: Number,
        default: 0
      },
      priceElasticity: {
        type: Number,
        default: 1.0,
        min: 0,
        max: 5
      },
      lastPredictionDate: {
        type: Date
      }
    },
    sales: {
      totalSold: {
        type: Number,
        default: 0,
        min: 0
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0
      },
      averageDailySales: {
        type: Number,
        default: 0,
        min: 0
      },
      lastSaleDate: {
        type: Date
      }
    },
    status: {
      type: String,
      enum: ['active', 'low-stock', 'expiring-soon', 'expired', 'discontinued'],
      default: 'active'
    },
    supplier: {
      name: { type: String },
      contactPerson: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    tags: [{
      type: String,
      trim: true
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
ProductSchema.index({ storeId: 1, category: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ 'perishable.expiryDate': 1 });
ProductSchema.index({ 'stock.quantity': 1 });
ProductSchema.index({ name: 'text', description: 'text' }); // Text search

// Pre-save middleware to calculate derived fields
ProductSchema.pre('save', function(next) {
  // Calculate profit margin
  if (this.pricing.currentPrice && this.pricing.costPrice) {
    this.pricing.profitMargin = ((this.pricing.currentPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
  }
  
  // Calculate shelf life
  if (this.perishable.manufactureDate && this.perishable.expiryDate) {
    const diffTime = this.perishable.expiryDate.getTime() - this.perishable.manufactureDate.getTime();
    this.perishable.shelfLife = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Calculate days to expiry
  if (this.perishable.expiryDate) {
    const diffTime = this.perishable.expiryDate.getTime() - Date.now();
    this.perishable.daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Auto-update status based on stock and expiry
  if (this.perishable.daysToExpiry <= 0) {
    this.status = 'expired';
  } else if (this.perishable.daysToExpiry <= 3) {
    this.status = 'expiring-soon';
  } else if (this.stock.quantity <= this.stock.reorderLevel) {
    this.status = 'low-stock';
  } else if (this.status !== 'discontinued') {
    this.status = 'active';
  }
  
  next();
});

// Virtual for formatted price
ProductSchema.virtual('formattedPrice').get(function() {
  return `$${this.pricing.currentPrice.toFixed(2)}`;
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function() {
  if (this.stock.quantity === 0) return 'Out of Stock';
  if (this.stock.quantity <= this.stock.reorderLevel) return 'Low Stock';
  return 'In Stock';
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;
