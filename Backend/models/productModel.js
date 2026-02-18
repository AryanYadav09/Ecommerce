import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    image: {type: Array, required: true},
    category: {type: String, required: true},
    subCategory: {type: String, required: true},
    sizes: {type: Array, required: true},
    bestseller: {type: Boolean, required: true},
    date: {type: Number, required: true},
    reviews: {
        type: [{
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            userAvatar: { type: String, default: '' },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String, default: '' },
            date: { type: Number, required: true }
        }],
        default: []
    },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
});

const productModel =  mongoose.models.product || mongoose.model("Product", productSchema);

export default productModel;
