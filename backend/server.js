import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

connectDB(process.env.MONGO_URI);

app.use(session({
  secret: process.env.SESSION_SECRET || 'some-very-secret-string', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true, // use this in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/basket', cartRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
