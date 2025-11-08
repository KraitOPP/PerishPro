import mongoose, { Schema } from 'mongoose';


const PriceHistorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    priceChange: {
      oldPrice: {
        type: Number,
        required: true,
        min: 0
      },
      newPrice: {
        type: Number,
        required: true,
        min: 0
      },
      changePercent: {
        type: Number,
        required: true
      }
    },
    reason: {
      type: String,
      required: true,
      enum: ['manual', 'ai-recommendation', 'markdown', 'promotion', 'competitor-match', 'cost-change']
    },
    aiRecommended: {
      type: Boolean,
      default: false
    },
    impact: {
      salesIncrease: { type: Number },
      revenueChange: { type: Number },
      wasteReduction: { type: Number },
      demandChange: { type: Number }
    },
    metadata: {
      daysToExpiry: { type: Number },
      stockLevel: { type: Number },
      demandScore: { type: Number },
      competitorPrice: { type: Number }
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now
    },
    effectiveTo: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
PriceHistorySchema.index({ productId: 1, createdAt: -1 });
PriceHistorySchema.index({ storeId: 1, createdAt: -1 });
PriceHistorySchema.index({ effectiveFrom: 1, effectiveTo: 1 });
PriceHistorySchema.index({ reason: 1 });

// Pre-save middleware to calculate change percent
PriceHistorySchema.pre('save', function(next) {
  if (this.priceChange.oldPrice && this.priceChange.newPrice) {
    this.priceChange.changePercent = 
      ((this.priceChange.newPrice - this.priceChange.oldPrice) / this.priceChange.oldPrice) * 100;
  }
  next();
});

const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);

export default PriceHistory;
