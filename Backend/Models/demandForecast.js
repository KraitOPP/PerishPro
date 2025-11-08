import mongoose, { Schema } from 'mongoose';

const DemandForecastSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    forecastPeriod: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      periodType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      }
    },
    historicalData: {
      averageDailySales: {
        type: Number,
        required: true,
        min: 0
      },
      salesTrend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable'
      },
      seasonalityFactor: {
        type: Number,
        default: 1.0,
        min: 0
      },
      weekdayPattern: {
        type: [Number],
        default: [1, 1, 1, 1, 1, 1, 1]
      }
    },
    forecast: [{
      date: {
        type: Date,
        required: true
      },
      predictedDemand: {
        type: Number,
        required: true,
        min: 0
      },
      confidenceInterval: {
        lower: { type: Number, required: true, min: 0 },
        upper: { type: Number, required: true, min: 0 }
      },
      factors: {
        dayOfWeek: { type: Number, default: 1 },
        seasonality: { type: Number, default: 1 },
        trend: { type: Number, default: 1 },
        events: [{ type: String }]
      }
    }],
    accuracy: {
      mape: {
        type: Number,
        min: 0,
        max: 100
      },
      rmse: {
        type: Number,
        min: 0
      },
      lastValidation: {
        type: Date
      }
    },
    externalFactors: {
      weather: { type: String },
      holidays: [{ type: String }],
      events: [{ type: String }],
      competitorActivity: { type: String }
    },
    recommendations: {
      suggestedOrderQuantity: {
        type: Number,
        required: true,
        min: 0
      },
      reorderDate: {
        type: Date,
        required: true
      },
      maxStockLevel: {
        type: Number,
        required: true,
        min: 0
      },
      minStockLevel: {
        type: Number,
        required: true,
        min: 0
      }
    },
    modelVersion: {
      type: String,
      required: true,
      default: '1.0.0'
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
DemandForecastSchema.index({ storeId: 1, productId: 1, generatedAt: -1 });
DemandForecastSchema.index({ category: 1, generatedAt: -1 });
DemandForecastSchema.index({ expiresAt: 1 });

// TTL Index
DemandForecastSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save to set expiration
DemandForecastSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Forecast expires 30 days after end date
    const expiry = new Date(this.forecastPeriod.endDate);
    expiry.setDate(expiry.getDate() + 30);
    this.expiresAt = expiry;
  }
  next();
});

const DemandForecast = mongoose.model('DemandForecast', DemandForecastSchema);

export default DemandForecast;
