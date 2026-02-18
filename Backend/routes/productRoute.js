import express from 'express'
import { addProduct, singleProduct, removeProduct, listProduct, getProductReviews, addProductReview, updateProduct } from '../controllers/productController.js'
import {productUpload} from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, productUpload , addProduct);
productRouter.post('/remove', removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProduct); 
productRouter.post('/reviews', getProductReviews);
productRouter.post('/review/add', authUser, addProductReview);
productRouter.post('/update', adminAuth, productUpload, updateProduct);

export default productRouter
