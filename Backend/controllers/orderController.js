// placing order using COD method

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe';

// global variables

const currency = 'inr'
const deliveryCharge = 10



// gateway initialised  

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


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

    try {

        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

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

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                quantity: item.quantity,
            }
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100,
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        })

        res.json({ success: true, message: 'Order Palced' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });

    }

}
// placing order using Razorpay method

const placeOrderRazorpay = async(req, res) =>{

}
// showig all orders on admin panel 

const allOrders = async(req, res) =>{
    try {
        let orders = await orderModel.find({});
        res.json({ success: true, orders });



    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

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
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status });

        res.json({ success: true, message: 'Order Status Updated' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });

    }

}

export {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus};

