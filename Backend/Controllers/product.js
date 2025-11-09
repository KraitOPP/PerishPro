const mongoose = require('mongoose');
const { z } = require('zod');
const Product = require('../Models/Product');
const cloudinary = require('../lib/cloudinary');
const streamifier = require('streamifier');

const pricingSchema = z.object({
  costPrice: z.number().min(0),
  mrp: z.number().min(0),
  currentPrice: z.number().min(0),
  profitMargin: z.number().optional()
});

const stockSchema = z.object({
  quantity: z.number().min(0),
  unit: z.string().optional(),
  reorderLevel: z.number().min(0).optional()
});

const perishableSchema = z.object({
  manufactureDate: z.preprocess((d) => (d ? new Date(d) : d), z.date()),
  expiryDate: z.preprocess((d) => (d ? new Date(d) : d), z.date()),
  shelfLife: z.number().optional(),
  daysToExpiry: z.number().optional()
});

const createProductSchema = z.object({
  storeId: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().min(1).max(200),
  category: z.enum(['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Beverages']),
  description: z.string().max(1000).optional(),
  image: z.string().optional(),
  pricing: pricingSchema,
  stock: stockSchema,
  perishable: perishableSchema,
  aiMetrics: z
    .object({
      demandScore: z.number().min(0).max(100).optional(),
      spoilageRisk: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      recommendedPrice: z.number().min(0).optional(),
      lastPredictionDate: z.preprocess((d) => (d ? new Date(d) : d), z.date()).optional()
    })
    .optional(),
  sales: z
    .object({
      totalSold: z.number().min(0).optional(),
      totalRevenue: z.number().min(0).optional(),
      averageDailySales: z.number().min(0).optional(),
      lastSaleDate: z.preprocess((d) => (d ? new Date(d) : d), z.date()).optional()
    })
    .optional(),
  status: z.enum(['active', 'low-stock', 'expiring-soon', 'expired', 'discontinued']).optional(),
  updatedBy: z.string().optional()
});

const updateProductSchema = createProductSchema.partial();

const toObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

const uploadBufferToCloudinary = async (buffer, folder = 'perishpro_products') => {
  try {
    if (cloudinary && cloudinary.uploader && typeof cloudinary.uploader.upload_stream === 'function') {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    }

    if (cloudinary && cloudinary.uploader && typeof cloudinary.uploader.upload === 'function') {
      let mime = 'image/jpeg';
      if (buffer && buffer.length >= 8) {
        const header = buffer.slice(0, 8).toString('hex');
        if (header.startsWith('89504e47')) mime = 'image/png';
        if (header.startsWith('47494638')) mime = 'image/gif';
      }
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' });
      return result;
    }

    throw new Error('Cloudinary uploader not available');
  } catch (err) {
    throw err;
  }
};

// listProducts
const listProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { search, category, status, storeId, sortBy, sortOrder } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (storeId) {
      const oid = toObjectId(storeId);
      if (oid) filter.storeId = oid;
    }
    if (search) filter.$text = { $search: String(search) };

    const sort = {};
    if (sortBy) {
      sort[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      Product.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, page, limit, total, products: items });
  } catch (err) {
    console.error('listProducts error', err);
    return res.status(500).json({ success: false, message: 'Failed to list products' });
  }
};

// getProduct
const getProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const oid = toObjectId(id);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const product = await Product.findById(oid).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    return res.status(200).json({ success: true, product });
  } catch (err) {
    console.error('getProduct error', err);
    return res.status(500).json({ success: false, message: 'Failed to get product' });
  }
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const addProduct = async (req, res) => {
  try {
    // 1) Handle image upload (if any)
    if (req.file) {
      try {
        if (req.file.buffer) {
          const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
          req.body.image = uploadResult.secure_url || uploadResult.url;
        } else if (req.file.path) {
          const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: 'perishpro_products' });
          req.body.image = uploadResult.secure_url || uploadResult.url;
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload failed', uploadErr);
        return res.status(500).json({ success: false, message: 'Image upload failed', error: uploadErr.message });
      }
    }

    // 2) If client used form-data and sent JSON under 'data', parse it
    let bodyToValidate = req.body;
    if (req.body && typeof req.body.data === 'string') {
      try {
        bodyToValidate = JSON.parse(req.body.data);
        // merge image if upload happened
        if (req.body.image) bodyToValidate.image = req.body.image;
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON in data field' });
      }
    }

    // 3) Compute perishable.shelfLife and daysToExpiry if manufactureDate & expiryDate present
    if (bodyToValidate.perishable) {
      try {
        const mfg = bodyToValidate.perishable.manufactureDate ? new Date(bodyToValidate.perishable.manufactureDate) : null;
        const exp = bodyToValidate.perishable.expiryDate ? new Date(bodyToValidate.perishable.expiryDate) : null;

        if (mfg instanceof Date && !isNaN(mfg) && exp instanceof Date && !isNaN(exp)) {
          const diffDays = Math.max(0, Math.ceil((exp.getTime() - mfg.getTime()) / MS_PER_DAY));
          bodyToValidate.perishable.shelfLife = diffDays;

          const daysToExpiry = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / MS_PER_DAY));
          bodyToValidate.perishable.daysToExpiry = daysToExpiry;
        }
      } catch (computeErr) {
        // don't block creation for compute errors, just log
        console.warn('Failed to compute perishable derived fields', computeErr);
      }
    }

    // 4) Validate with zod
    const parsed = createProductSchema.safeParse(bodyToValidate);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
        .join(', ');
      return res.status(400).json({ success: false, message });
    }

    // 5) Attach updatedBy if authenticated
    const payload = parsed.data;
    if (req.user && req.user._id) payload.updatedBy = req.user._id;

    // 6) Save
    const product = new Product(payload);
    await product.save();

    return res.status(201).json({ success: true, message: 'Product created', product });
  } catch (err) {
    console.error('addProduct error', err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: msgs });
    }
    return res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

/**
 * updateProduct (updated)
 * - supports multipart/form-data with optional 'image'
 * - computes perishable.shelfLife & daysToExpiry if manufactureDate & expiryDate are present in body
 */
const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const oid = toObjectId(id);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid product id' });

    // 1) Handle image upload if present
    if (req.file) {
      try {
        if (req.file.buffer) {
          const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
          req.body.image = uploadResult.secure_url || uploadResult.url;
        } else if (req.file.path) {
          const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: 'perishpro_products' });
          req.body.image = uploadResult.secure_url || uploadResult.url;
        }
      } catch (uploadErr) {
        console.error('Cloudinary upload failed', uploadErr);
        return res.status(500).json({ success: false, message: 'Image upload failed', error: uploadErr.message });
      }
    }

    // 2) If client used form-data and sent JSON under 'data', parse it
    let bodyToValidate = req.body;
    if (req.body && typeof req.body.data === 'string') {
      try {
        bodyToValidate = JSON.parse(req.body.data);
        if (req.body.image) bodyToValidate.image = req.body.image;
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON in data field' });
      }
    }

    // 3) Compute perishable shelfLife/daysToExpiry if perishable provided
    if (bodyToValidate.perishable) {
      try {
        const mfg = bodyToValidate.perishable.manufactureDate ? new Date(bodyToValidate.perishable.manufactureDate) : null;
        const exp = bodyToValidate.perishable.expiryDate ? new Date(bodyToValidate.perishable.expiryDate) : null;

        if (mfg instanceof Date && !isNaN(mfg) && exp instanceof Date && !isNaN(exp)) {
          bodyToValidate.perishable.shelfLife = Math.max(0, Math.ceil((exp.getTime() - mfg.getTime()) / MS_PER_DAY));
          bodyToValidate.perishable.daysToExpiry = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / MS_PER_DAY));
        }
      } catch (computeErr) {
        console.warn('Failed to compute perishable derived fields during update', computeErr);
      }
    }

    // 4) Validate update payload (partial)
    const parsed = updateProductSchema.safeParse(bodyToValidate);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
        .join(', ');
      return res.status(400).json({ success: false, message });
    }

    const updates = parsed.data;
    if (req.user && req.user._id) updates.updatedBy = req.user._id;

    // 5) Apply update
    const updated = await Product.findByIdAndUpdate(oid, { $set: updates }, { new: true, runValidators: true, context: 'query' });
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });

    return res.status(200).json({ success: true, message: 'Product updated', product: updated });
  } catch (err) {
    console.error('updateProduct error', err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: msgs });
    }
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// deleteProduct
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const force = req.query.force === 'true';
    const oid = toObjectId(id);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid product id' });

    if (force) {
      const removed = await Product.findByIdAndDelete(oid);
      if (!removed) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.status(200).json({ success: true, message: 'Product permanently deleted' });
    }

    const updated = await Product.findByIdAndUpdate(oid, { status: 'discontinued' }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.status(200).json({ success: true, message: 'Product discontinued (soft deleted)', product: updated });
  } catch (err) {
    console.error('deleteProduct error', err);
    return res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

// updateStock
const updateStock = async (req, res) => {
  try {
    const id = req.params.id;
    const { op, amount } = req.body;
    const oid = toObjectId(id);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid product id' });
    const amt = Number(amount);
    if (isNaN(amt) || amt < 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const product = await Product.findById(oid);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (op === 'set') product.stock.quantity = amt;
    else if (op === 'inc') product.stock.quantity = (product.stock.quantity || 0) + amt;
    else if (op === 'dec') product.stock.quantity = Math.max(0, (product.stock.quantity || 0) - amt);
    else return res.status(400).json({ success: false, message: 'Invalid op. Use inc|dec|set' });

    if (req.user && req.user._id) product.updatedBy = req.user._id;
    await product.save();

    return res.status(200).json({ success: true, message: 'Stock updated', product });
  } catch (err) {
    console.error('updateStock error', err);
    return res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
};

module.exports = {
  listProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock
};
