import express from 'express'
import {
    loginUser,
    sendRegisterOtp,
    verifyRegisterOtp,
    getUserProfile,
    getUserWishlist,
    toggleWishlist,
    loginWithSocialProvider,
    adminLogin,
    verifyAdminLogin
} from '../controllers/userController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const userRouter = express.Router();

userRouter.post('/register/send-otp', sendRegisterOtp);
userRouter.post('/register/verify-otp', verifyRegisterOtp);
userRouter.post('/admin', adminLogin);
userRouter.post('/admin/verify', adminAuth, verifyAdminLogin);
userRouter.post('/login', loginUser);
userRouter.post('/social-login', loginWithSocialProvider);
userRouter.post('/profile', authUser, getUserProfile);
userRouter.post('/wishlist', authUser, getUserWishlist);
userRouter.post('/wishlist/toggle', authUser, toggleWishlist);

export default userRouter;
