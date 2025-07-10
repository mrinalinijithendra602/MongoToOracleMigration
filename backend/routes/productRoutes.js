import express from 'express';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
}

const formatProduct = (p) => ({
  _id: p._id,
  sku: p.sku,
  item_name: p.item_name,
  brand: p.brand,
  price: p.price,
  main_image_id: p.main_image_id,
  product_type: p.product_type,
  country: p.country,
  marketplace: p.marketplace,
});

// Products list with pagination and optional search
router.get('/', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

if (q) {
  const regex = new RegExp(q, 'i');

  // Basic text search using wildcard index (no score)
  const fullTextResults = await Product.find({ $text: { $search: q } }).lean();

  // Regex fallback
  const partialResults = await Product.find({
    $or: [
      { 'item_name.value': { $regex: regex } },
      { 'brand.value': { $regex: regex } },
    ],
  }).lean();

  // Merge deduplicated results
  const map = new Map();
  fullTextResults.forEach(p => map.set(p._id.toString(), p));
  partialResults.forEach(p => map.set(p._id.toString(), p));

  const combined = Array.from(map.values());

  // Apply pagination
  const paged = combined.slice(skip, skip + limitNum);

  return res.json({
    products: paged.map(formatProduct),
    page: pageNum,
    totalPages: Math.ceil(combined.length / limitNum),
    totalCount: combined.length,
  });
}
 else {
      const totalCount = await Product.countDocuments();
      const products = await Product.find().skip(skip).limit(limitNum).lean();

      return res.json({
        products: products.map(formatProduct),
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
      });
    }
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product details by SKU list (for cart)
router.get('/cart', async (req, res) => {
  try {
    const skus = (req.query.skus || '').split(',').filter(Boolean);
    if (!skus.length) return res.status(400).json({ error: 'No SKUs provided' });

    const products = await Product.find({ sku: { $in: skus } }).lean();
    const productMap = new Map(products.map(p => [p.sku, p]));

    const result = skus.map(sku => {
      const prod = productMap.get(sku);
      if (!prod) return { sku, missing: true };
      return formatProduct(prod);
    });

    res.json({ products: result });
  } catch (err) {
    console.error('Error fetching cart products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get current user's basket
router.get('/cart/current', requireLogin, async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.session.user.id }).lean();
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const currentBasket = (customer.baskets || []).find(b => b.type === 'CURRENT') || { products: [] };
    res.json(currentBasket);
  } catch (err) {
    console.error('Fetch current cart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to cart (continued)
router.post('/cart/add', requireLogin, async (req, res) => {
  const { sku, quantity = 1 } = req.body;
  if (!sku || quantity <= 0) return res.status(400).json({ error: 'Missing or invalid sku/quantity' });

  try {
    const customer = await Customer.findOne({ id: req.session.user.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const product = await Product.findOne({ sku });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let basket = customer.baskets.find(b => b.type === 'CURRENT');
    if (!basket) {
      basket = {
        id: `basket-${Date.now()}`,
        type: 'CURRENT',
        products: [],
        total_price: 0,
        final_price: 0,
      };
      customer.baskets.push(basket);
    }

    // Check if product already in basket
    const existingProd = basket.products.find(p => p.sku === sku);
    if (existingProd) {
      existingProd.quantity = (existingProd.quantity || 1) + quantity;
    } else {
      basket.products.push({
        sku,
        quantity,
        price: product.price || 0,
        full_product: {
          item_name: product.item_name,
          brand: product.brand,
          main_image_id: product.main_image_id,
          product_type: product.product_type,
        },
      });
    }

    // Recalculate basket prices
    basket.total_price = basket.products.reduce((sum, p) => {
      const price = typeof p.price === 'number' ? p.price : 0;
      return sum + price * (p.quantity || 1);
    }, 0);
    basket.final_price = basket.total_price;

    customer.markModified('baskets');
    await customer.save();

    res.json(basket);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove from cart
router.post('/cart/remove', requireLogin, async (req, res) => {
  const { sku } = req.body;
  if (!sku) return res.status(400).json({ error: 'Missing sku' });

  try {
    const customer = await Customer.findOne({ id: req.session.user.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const basket = customer.baskets.find(b => b.type === 'CURRENT');
    if (!basket) return res.status(404).json({ error: 'Current basket not found' });

    basket.products = basket.products.filter(p => p.sku !== sku);

    basket.total_price = basket.products.reduce((sum, p) => {
      const price = typeof p.price === 'number' ? p.price : 0;
      return sum + price * (p.quantity || 1);
    }, 0);
    basket.final_price = basket.total_price;

    customer.markModified('baskets');
    await customer.save();

    res.json(basket);
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
