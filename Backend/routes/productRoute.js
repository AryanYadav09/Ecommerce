import express from 'express'
import { addProduct, singleProduct, removeProduct, listProduct } from '../controllers/productController.js'
import {productUpload} from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, productUpload , addProduct);
productRouter.post('/remove', removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProduct); 

export default productRouter