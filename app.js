// app.js and backend entry point, backend will be using ES modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/book.routes.js';
import cronJob from './scripts/cron.js';

dotenv.config();

const app = express();

app.use(cors());

// Increase payload limit to handle base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define your routes here
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// Start the cron job
cronJob.start();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Cron job is active - pinging Render every 14 minutes to keep app awake');
});