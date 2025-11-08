import mongoose, { Schema } from 'mongoose';


const SaleItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be positive']
    },
    unit: {
      type: String,
      required: true
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: [0, 'Price must be positive']
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: [0, 'Cost must be positive']
    },
    subtotal: {
      type: Number,
      required: true
    },
    profit: {
      type: Number,
      required: true
    },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      value: { type: Number, min: 0 },
      reason: { type: String }
    }
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: function(items) {
          return items.length > 0;
        },
        message: 'Sale must have at least one item'
      }
    },
    totals: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      discount: {
        type: Number,
        default: 0,
        min: 0
      },
      tax: {
        type: Number,
        default: 0,
        min: 0
      },
      total: {
        type: Number,
        required: true,
        min: 0
      },
      profit: {
        type: Number,
        default: 0
      }
    },
    payment: {
      method: {
        type: String,
        required: true,
        enum: ['cash', 'credit-card', 'debit-card', 'mobile-payment', 'other']
      },
      status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'refunded', 'failed'],
        default: 'pending'
      },
      transactionId: {
        type: String
      },
      paidAmount: {
        type: Number,
        required: true,
        min: 0
      },
      changeAmount: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    customer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      loyaltyId: { type: String }
    },
    cashier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    metadata: {
      wasExpiringSoon: { type: Boolean, default: false },
      aiPricingUsed: { type: Boolean, default: false },
      wastePreventionSale: { type: Boolean, default: false }
    },
    refund: {
      refunded: { type: Boolean, default: false },
      refundDate: { type: Date },
      refundAmount: { type: Number, min: 0 },
      refundReason: { type: String },
      refundedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
SaleSchema.index({ storeId: 1, createdAt: -1 });
SaleSchema.index({ saleNumber: 1 });
SaleSchema.index({ cashier: 1 });
SaleSchema.index({ 'payment.status': 1 });
SaleSchema.index({ createdAt: -1 });

// Pre-save middleware to generate sale number
SaleSchema.pre('save', async function(next) {
  if (!this.saleNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Sale').countDocuments({
      createdAt: { $gte: new Date(date.setHours(0, 0, 0, 0)) }
    });
    this.saleNumber = `SL-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Sale = mongoose.model('Sale', SaleSchema);

export default Sale;
