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
app.use(express.json());

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