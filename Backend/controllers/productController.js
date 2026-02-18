import { v2 as cloudinary} from 'cloudinary';
import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';

const toOneDecimal = (value) => Number((value || 0).toFixed(1))

const buildReviewStats = (reviews = []) => {
    const totalReviews = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0)
    const averageRating = totalReviews ? toOneDecimal(totalRating / totalReviews) : 0

    return { totalReviews, averageRating }
}

//function  for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

        // Validate input fields
        if (!name || !description || !price || !category || !sizes) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        // Check for file uploads
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0];
        
        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)
        
        
        const imagesUrl = await Promise.all( // iterater of arrary
            images.map( async (item)=>{
                let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
                return result.secure_url;
            })
        )
        
        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === 'true' || bestseller === true,
            sizes:JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now()

        }

        const product = new productModel(productData)

        await product.save();

        // Example response
        res.status(200).json({ success: true, message: 'Product added successfully.' });

    } catch (error) {
        console.error('Error in addProduct:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


//function  for list product
const listProduct = async (req, res) => {
    try {
        const products = await productModel.find({})
        res.json({success: true,products})
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
        
    }

}

//function  for removing product
const removeProduct = async (req, res) => {

    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true, message: "product removed"})
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }

}



//function  for single product info
const singleProduct = async (req, res) => {
    try {
        const {productId} = req.body;
        const product = await productModel.findById(productId);
        res.json({success: true, product})
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: "product not found" });
    }

}

// function for listing reviews of a single product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.body

        if (!productId) {
            return res.json({ success: false, message: "Product id is required" })
        }

        const product = await productModel.findById(productId).select('reviews averageRating totalReviews')
        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        const sortedReviews = [...(product.reviews || [])].sort((a, b) => Number(b.date) - Number(a.date))
        return res.json({
            success: true,
            reviews: sortedReviews,
            averageRating: product.averageRating || 0,
            totalReviews: product.totalReviews || 0
        })
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// function for adding/updating a user review
const addProductReview = async (req, res) => {
    try {
        const { productId, rating, comment = '', userId } = req.body
        const normalizedComment = String(comment || '').trim()
        const normalizedRating = Number(rating)

        if (!productId) {
            return res.json({ success: false, message: "Product id is required" })
        }

        if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
            return res.json({ success: false, message: "Rating must be between 1 and 5" })
        }

        if (normalizedComment.length > 400) {
            return res.json({ success: false, message: "Review comment is too long" })
        }

        const [product, user] = await Promise.all([
            productModel.findById(productId),
            userModel.findById(userId).select('name avatar')
        ])

        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        const reviewPayload = {
            userId: String(userId),
            userName: user.name || 'User',
            userAvatar: user.avatar || '',
            rating: normalizedRating,
            comment: normalizedComment,
            date: Date.now()
        }

        const existingReviewIndex = (product.reviews || []).findIndex((review) => String(review.userId) === String(userId))

        if (existingReviewIndex >= 0) {
            product.reviews[existingReviewIndex] = reviewPayload
        } else {
            product.reviews.push(reviewPayload)
        }

        const { totalReviews, averageRating } = buildReviewStats(product.reviews)
        product.totalReviews = totalReviews
        product.averageRating = averageRating
        await product.save()

        const sortedReviews = [...(product.reviews || [])].sort((a, b) => Number(b.date) - Number(a.date))

        return res.json({
            success: true,
            message: existingReviewIndex >= 0 ? 'Review updated successfully' : 'Review added successfully',
            reviews: sortedReviews,
            totalReviews,
            averageRating
        })
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// NEW: Function for updating a product
const updateProduct = async (req, res) => {
    try {
        const { productId, name, description, price, category, subCategory, sizes, bestseller } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Product id is required." });
        }

        // Build update data (parse sizes if sent as JSON string)
        const updateData = {

            name,
            description,
            price: Number(price),
            category,
            subCategory,
            sizes: typeof sizes === 'string' ? JSON.parse(sizes) : sizes,
        };

        if (typeof bestseller !== 'undefined') {
            updateData.bestseller = bestseller === 'true' || bestseller === true;
        }

        // If new images are provided, upload them and update the product images
        if (req.files) {
            const images = [];
            if (req.files.image1 && req.files.image1[0]) images.push(req.files.image1[0]);
            if (req.files.image2 && req.files.image2[0]) images.push(req.files.image2[0]);
            if (req.files.image3 && req.files.image3[0]) images.push(req.files.image3[0]);
            if (req.files.image4 && req.files.image4[0]) images.push(req.files.image4[0]);

            if (images.length > 0) {
                const imagesUrl = await Promise.all(
                    images.map(async (item) => {
                        let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                        return result.secure_url;
                    })
                );
                updateData.image = imagesUrl;
            }
        }

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        return res.status(200).json({ success: true, message: "Product updated successfully.", product: updatedProduct });
    } catch (error) {
        console.error("Error in updateProduct:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { addProduct, singleProduct, removeProduct, listProduct, getProductReviews, addProductReview, updateProduct };
