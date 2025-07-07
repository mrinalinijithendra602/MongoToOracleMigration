import mongoose from 'mongoose';

const ItemNameSchema = new mongoose.Schema({
  language_tag: String,
  value: String,
}, { _id: false });

const BrandSchema = new mongoose.Schema({
  language_tag: String,
  value: String,
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  item_name: [ItemNameSchema], // array of { language_tag, value }
  brand: [BrandSchema],        // array of { language_tag, value }
  price: Number,
  main_image_id: String,
  product_type: String,
  country: String,
  marketplace: String,
}, { collection: 'Products' });

// Create text index on nested 'value' fields for full-text search
ProductSchema.index({
  'item_name.value': 'text',
  'brand.value': 'text',
});

export default mongoose.model('Product', ProductSchema);
