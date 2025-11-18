// book controller
import { PrismaClient } from '@prisma/client'; 
import cloudinary from '../scripts/cloudinary.js';

const prisma = new PrismaClient()

export const createBook = async (req, res) => {
    try {
        const { title, caption, rating, image } = req.body;

        console.log('Create book request:', { title, caption, rating, hasImage: !!image });
        console.log('User from req.user:', req.user);

        // DEBUG CLOUDINARY CONFIG
        console.log('=== CLOUDINARY DEBUG ===');
        console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('Cloud Name length:', process.env.CLOUDINARY_CLOUD_NAME?.length);
        console.log('Cloud Name type:', typeof process.env.CLOUDINARY_CLOUD_NAME);
        console.log('API Key:', process.env.CLOUDINARY_API_KEY);
        console.log('API Key length:', process.env.CLOUDINARY_API_KEY?.length);
        console.log('API Key type:', typeof process.env.CLOUDINARY_API_KEY);
        console.log('API Secret length:', process.env.CLOUDINARY_API_SECRET?.length);
        console.log('API Secret first 5 chars:', process.env.CLOUDINARY_API_SECRET?.substring(0, 5));
        console.log('API Secret last 3 chars:', process.env.CLOUDINARY_API_SECRET?.substring(process.env.CLOUDINARY_API_SECRET?.length - 3));
        console.log('======================');

        if (!title || !caption || !rating || !image) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (title.length < 1 || title.length > 100) {
            return res.status(400).json({ error: 'Title must be between 1 and 100 characters long' });
        }

        if (caption.length < 1 || caption.length > 500) {
            return res.status(400).json({ error: 'Caption must be between 1 and 500 characters long' });
        }

        // Convert rating to integer
        const ratingInt = parseInt(rating);
        if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
            return res.status(400).json({error: 'Rating must be between 1 and 5'});
        }

        // Check if user exists
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log('Uploading image to cloudinary...');
        console.log('Image data preview:', image.substring(0, 50) + '...');
        
        // Upload image to cloudinary with explicit options
        const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: 'books',
            resource_type: 'auto',
            timeout: 60000
        });
        
        console.log('Cloudinary upload response:', {
            url: uploadedImage.secure_url,
            public_id: uploadedImage.public_id,
            format: uploadedImage.format
        });
        
        const imageUrl = uploadedImage.secure_url;

        console.log('Creating book in database...');
        // save book to database
        const newBook = await prisma.book.create({
            data: {
                title,
                caption,
                rating: ratingInt,
                imageUrl,
                userId: req.user.id,
            },
        });
        console.log('Book created successfully:', newBook);
        
        res.status(201).json(newBook);
    } catch (error) {
        console.error('Create book error:', error);
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        res.status(500).json({ 
            error: 'Failed to create book', 
            details: error.message,
            code: error.code,
            http_code: error.http_code 
        });
    }
};

export const getBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalBooks = await prisma.book.count();

        const books = await prisma.book.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            skip: skip,
            take: limit,
            include: {
                user: {
                    select: {
                        username: true,
                        profileImage: true
                    }
                }
            }
        });
        
        res.status(200).json({ 
            books,
            currentPage: page,
            totalBooks: totalBooks,
            totalPages: Math.ceil(totalBooks / limit)
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch books',
            details: error.message 
        });
    }
};

// Get recommended books by the logged in user
export const getRecommendedBooks = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const books = await prisma.book.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
        });
        res.status(200).json(books);
    } catch (error) {
        console.error('Get recommended books error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch recommended books',
            details: error.message 
        });
    }
};

// Get books for the authenticated user (for profile page)
export const getUserBooks = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const books = await prisma.book.findMany({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        const totalBooks = await prisma.book.count({
            where: { userId: req.user.id },
        });

        const totalPages = Math.ceil(totalBooks / limit);

        res.status(200).json({
            books,
            currentPage: page,
            totalPages,
            totalBooks,
        });
    } catch (error) {
        console.error('Error fetching user books:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user books',
            message: error.message 
        });
    }
};

// Delete book
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Check if user is owner of the book
        if (book.userId !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this book' });
        }

        console.log('Deleting image from cloudinary:', book.imageUrl);
        
        // Extract public_id from cloudinary URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/public_id.jpg
        const urlParts = book.imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        
        // Get everything after 'upload/vXXXXXX/' 
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        // Remove file extension
        const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
        
        console.log('Extracted public_id:', publicId);
        
        // Delete image from cloudinary
        try {
            const deleteResult = await cloudinary.uploader.destroy(publicId);
            console.log('Cloudinary deletion result:', deleteResult);
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
            // Continue with book deletion even if cloudinary fails
        }
        
        // Delete book from database
        await prisma.book.delete({ where: { id: parseInt(id) } });
        console.log('Book deleted from database');
        
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ 
            error: 'Failed to delete book',
            details: error.message 
        });
    }
};