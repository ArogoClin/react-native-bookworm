import express from 'express';
import { createBook, getBooks, getRecommendedBooks, deleteBook } from '../controllers/book.controller.js';
import { protectRoute} from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protectRoute, createBook);
router.get('/', getBooks);
router.get('/recommended', protectRoute, getRecommendedBooks);
router.delete('/:id', protectRoute, deleteBook);

export default router;