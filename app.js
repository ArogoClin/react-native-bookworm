// app.js and backend entry point, backend will be using ES modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/book.routes.js';
import job from './scripts/cron.js';

dotenv.config();

const app = express();
// const prisma = new PrismaClient();

job.start();

app.use(cors());
app.use(express.json());

// Define your routes here
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});