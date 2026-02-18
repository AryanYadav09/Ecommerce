import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },
    phone: { type: String, default: '' },
    authProvider: { type: String, default: 'password' },
    authProviderId: { type: String, default: '' },
    avatar: { type: String, default: '' },
    wishlist: { type: [String], default: [] },
    cartData: { type: Object, default: {} },


}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;  
