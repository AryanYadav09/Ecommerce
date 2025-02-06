// placing order using COD method

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe';
import razorpay from 'razorpay';

// global variables

const currency = 'inr'
const deliveryCharge = 10



// gateway initialised  

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


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

const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: 'Stripe', // 🛠️ Fixed: Changed from 'COD' to 'Stripe'
            date: Date.now(),
            payment: false,
            status: 'Pending' // 🆕 Added status
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency.toLowerCase(),
                product_data: { name: item.name },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency.toLowerCase(),
                product_data: { name: 'Delivery Charges' },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });

        console.log("Creating Stripe session...");
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}&userId=${userId}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}&userId=${userId}`,
            line_items,
            mode: 'payment'
        });

        console.log("Stripe session created:", session);
        res.json({ success: true, message: 'Order Placed', session_url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🟢 Verify Stripe Payment
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.query;
    console.log("Stripe verification data:", req.query);

    try {
        if (!orderId || !userId) {
            return res.status(400).json({ success: false, message: "Missing orderId or userId" });
        }

        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true, status: 'Paid' }); // Mark order as paid
            await userModel.findByIdAndUpdate(userId, { cartData: {} });

            return res.json({ success: true, message: "Payment Verified" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            return res.json({ success: false, message: "Payment Failed" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// placing order using Razorpay method

const placeOrderRazorpay = async (req, res) => {


    try {
        const { userId, items, amount, address } = req.body;    // getting the order data from the request
        const orderData = { // creating the order data object to save in the database 
            userId,
            items,
            amount,
            address,
            paymentMethod: 'Razorpay',
            date: Date.now(),
            payment: false
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save(); // saving the order to the database

        const options = {
            amount: amount * 100, // amount in smallest currency unit
            currency: currency.toUpperCase(),
            receipt: newOrder._id.toString()
        }


        await razorpayInstance.orders.create(options, (err, order) => { // creating the order in the razorpay}
            if (err) {
                return res.json({ success: false, message: err.message });
            }

            res.json({ success: true, order, message: 'Order Placed' });

        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });

    }

}

// verify razorpay 

const verifyRazorpay = async (req, res) => {
    try {

        const { userId, razorpay_order_id } = req.body; // getting the order id, payment id and signature from the request body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id); // fetching the order from the razorpay
        if (orderInfo.status === 'paid') {
            await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true }); // updating the payment status of the order
            await userModel.findByIdAndUpdate(userId, { cartData: {} });    // emptying the cart after successful payment
            res.json({ success: true, message: 'Payment Successful' });
        } else {
            res.json(({ success: false, message: 'Payment Failed' }));
        }

        console.log(orderInfo);


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });

    }
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

export { placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay };

