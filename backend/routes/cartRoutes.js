// routes/cartRoutes.js
import express from 'express';
import Customer from '../models/Customer.js';

const router = express.Router();

router.get('/cart', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const customerId = req.session.user.id;
    const customer = await Customer.findOne({ id: customerId }).lean();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find basket with type CURRENT
    const currentBasket = (customer.baskets || []).find(b => b.type === 'CURRENT');

    if (!currentBasket) {
      return res.json({ products: [] }); // no current basket yet
    }

    // currentBasket.products contains an array of product SKUs or product objects
    res.json({ basket: currentBasket });

  } catch (err) {
    console.error('Error fetching current basket:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




export default router;
