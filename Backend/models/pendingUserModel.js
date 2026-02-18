import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        otpHash: { type: String, required: true },
        otpExpiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now, expires: 60 * 60 }
    },
    { minimize: false }
);

const pendingUserModel = mongoose.models.pending_user || mongoose.model('pending_user', pendingUserSchema);

export default pendingUserModel;
