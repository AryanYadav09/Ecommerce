


// placing order using COD method

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const placeOrder = async(req, res) =>{

    try {
        const {userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: 'COD',
            date: Date.now(),
            payment: false
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, {cartData: {}});

        res.json({success: true, message: 'Order Placed Successfully'});

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    
    }

    
}
// placing order using Stripe method

const placeOrderStripe = async(req, res) =>{

}
// placing order using Razorpay method

const placeOrderRazorpay = async(req, res) =>{

}
// showig all orders on admin panel 

const allOrders = async(req, res) =>{

}
// showing all orders of a user

const userOrders = async(req, res) =>{

    try {
        const {userId} = req.body;
        const orders = await orderModel.find({userId})
        res.json({success: true, orders});
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
        
    }

}

// updating order status
const updateStatus = async(req, res) =>{

}

export {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus};

