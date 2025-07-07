import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  id: Number, // or String, depending on your actual data
  customer_name: String,
  email: String,
  encrypted_password: String,
  // Add more fields if needed
}, { strict: false }); // Keeps it flexible in case there are extra fields

const Customer = mongoose.model('Customer', customerSchema, 'Customers');

export default Customer;
