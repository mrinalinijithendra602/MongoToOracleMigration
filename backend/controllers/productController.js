import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;       // default page 1
    const limit = parseInt(req.query.limit) || 20;    // default 20 per page
    const skip = (page - 1) * limit;

    const totalCount = await Product.countDocuments();
    const products = await Product.find().skip(skip).limit(limit).lean();

    res.json({
      products,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

