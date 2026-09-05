import { v2 as cloudinary } from 'cloudinary';
import {
  listProducts as getListProducts,
  getProductById,
  addProduct as insertProduct,
  updateProduct as modifyProduct,
  removeProduct as deleteProduct,
  getProductReviews as fetchProductReviews,
  addProductReview as submitProductReview
} from '../services/productService.js';
import { findUserById } from '../services/userService.js';
import { logUserEvent } from '../services/eventService.js';

// Function for add product
const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

    if (!name || !description || !price || !category || !sizes) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    // Handle Cloudinary upload if files provided
    let imagesUrl = [];
    if (req.files) {
      const image1 = req.files.image1 && req.files.image1[0];
      const image2 = req.files.image2 && req.files.image2[0];
      const image3 = req.files.image3 && req.files.image3[0];
      const image4 = req.files.image4 && req.files.image4[0];
      const images = [image1, image2, image3, image4].filter(Boolean);

      if (images.length > 0) {
        imagesUrl = await Promise.all(
          images.map(async (item) => {
            const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
            return result.secure_url;
          })
        );
      }
    }

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory: subCategory || 'General',
      bestseller: bestseller === 'true' || bestseller === true,
      sizes: typeof sizes === 'string' ? JSON.parse(sizes) : sizes,
      image: imagesUrl.length > 0 ? imagesUrl : ['https://res.cloudinary.com/dwbysqaoe/image/upload/v1737728708/k93pfh0bjo9koykbpksq.png'],
      date: Date.now()
    };

    const product = await insertProduct(productData);
    return res.status(200).json({ success: true, message: 'Product added successfully.', product });
  } catch (error) {
    console.error('Error in addProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Function for list product
const listProduct = async (req, res) => {
  try {
    const products = await getListProducts();
    return res.json({ success: true, products });
  } catch (error) {
    console.error('Error in listProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Function for removing product
const removeProduct = async (req, res) => {
  try {
    const id = req.body.id || req.body._id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Product ID required' });
    }
    await deleteProduct(id);
    return res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    console.error('Error in removeProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Function for single product info
const singleProduct = async (req, res) => {
  try {
    const productId = req.body.productId || req.body.id;
    const userId = req.body.userId;
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Log behavioral event for recommendations
    if (productId) {
      logUserEvent({
        userId,
        productId,
        eventType: 'view',
        metadata: { category: product.category, price: product.price }
      }).catch(() => {});
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.error('Error in singleProduct:', error);
    return res.status(500).json({ success: false, message: 'Product not found' });
  }
};

// Function for listing reviews of a single product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.json({ success: false, message: 'Product id is required' });
    }

    const { reviews, averageRating, totalReviews } = await fetchProductReviews(productId);
    return res.json({
      success: true,
      reviews,
      averageRating,
      totalReviews
    });
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Function for adding/updating a user review
const addProductReview = async (req, res) => {
  try {
    const { productId, rating, comment = '', userId } = req.body;
    const normalizedComment = String(comment || '').trim();
    const normalizedRating = Number(rating);

    if (!productId) {
      return res.json({ success: false, message: 'Product id is required' });
    }
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (normalizedComment.length > 400) {
      return res.json({ success: false, message: 'Review comment is too long' });
    }

    const [product, user] = await Promise.all([
      getProductById(productId),
      findUserById(userId)
    ]);

    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    const userName = user?.name || 'Customer';
    const userAvatar = user?.avatar || '';

    const { reviews, averageRating, totalReviews } = await submitProductReview({
      productId,
      userId,
      userName,
      userAvatar,
      rating: normalizedRating,
      comment: normalizedComment
    });

    return res.json({
      success: true,
      message: 'Review submitted successfully',
      reviews,
      totalReviews,
      averageRating
    });
  } catch (error) {
    console.error('Error in addProductReview:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Function for updating a product
const updateProduct = async (req, res) => {
  try {
    const { productId, name, description, price, category, subCategory, sizes, bestseller, inStock } = req.body;
    const targetId = productId || req.body.id || req.body._id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Product id is required.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (bestseller !== undefined) updateData.bestseller = bestseller;
    if (inStock !== undefined) updateData.inStock = inStock;

    if (req.files) {
      const images = [];
      if (req.files.image1 && req.files.image1[0]) images.push(req.files.image1[0]);
      if (req.files.image2 && req.files.image2[0]) images.push(req.files.image2[0]);
      if (req.files.image3 && req.files.image3[0]) images.push(req.files.image3[0]);
      if (req.files.image4 && req.files.image4[0]) images.push(req.files.image4[0]);

      if (images.length > 0) {
        const imagesUrl = await Promise.all(
          images.map(async (item) => {
            const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
            return result.secure_url;
          })
        );
        updateData.image = imagesUrl;
      }
    }

    const updatedProduct = await modifyProduct(targetId, updateData);
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product updated successfully.', product: updatedProduct });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  singleProduct,
  removeProduct,
  listProduct,
  getProductReviews,
  addProductReview,
  updateProduct
};
