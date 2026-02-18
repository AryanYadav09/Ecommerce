import Stripe from 'stripe';
import razorpay from 'razorpay';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

const currency = 'inr';
const deliveryCharge = 10;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const handleError = (res, error, fallbackMessage = 'Request failed') => {
  return res.status(500).json({
    success: false,
    message: error?.message || fallbackMessage
  });
};

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      paymentMethod: 'COD',
      date: Date.now(),
      payment: false
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    return res.json({ success: true, message: 'Order placed successfully' });
  } catch (error) {
    return handleError(res, error, 'Unable to place order');
  }
};

const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      paymentMethod: 'Stripe',
      date: Date.now(),
      payment: false,
      status: 'Pending'
    });

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

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}&userId=${userId}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}&userId=${userId}`,
      line_items,
      mode: 'payment'
    });

    return res.json({ success: true, message: 'Order placed', session_url: session.url });
  } catch (error) {
    return handleError(res, error, 'Unable to create stripe session');
  }
};

const verifyStripe = async (req, res) => {
  try {
    const orderId = req.body.orderId || req.query.orderId;
    const successValue = req.body.success ?? req.query.success;
    const userId = req.body.userId || req.query.userId;
    const isSuccess = String(successValue).toLowerCase() === 'true';

    if (!orderId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing orderId or userId' });
    }

    const order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (isSuccess) {
      await orderModel.findByIdAndUpdate(orderId, { payment: true, status: 'Paid' });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      return res.json({ success: true, message: 'Payment verified' });
    }

    await orderModel.findByIdAndDelete(orderId);
    return res.json({ success: false, message: 'Payment failed' });
  } catch (error) {
    return handleError(res, error, 'Unable to verify stripe payment');
  }
};

const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      paymentMethod: 'Razorpay',
      date: Date.now(),
      payment: false
    });

    await newOrder.save();

    const order = await razorpayInstance.orders.create({
      amount: amount * 100,
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString()
    });

    return res.json({ success: true, order, message: 'Order placed' });
  } catch (error) {
    return handleError(res, error, 'Unable to create razorpay order');
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Missing razorpay order id' });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status === 'paid') {
      await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      return res.json({ success: true, message: 'Payment successful' });
    }

    return res.json({ success: false, message: 'Payment failed' });
  } catch (error) {
    return handleError(res, error, 'Unable to verify razorpay payment');
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    return res.json({ success: true, orders });
  } catch (error) {
    return handleError(res, error, 'Unable to fetch orders');
  }
};

const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    return res.json({ success: true, orders });
  } catch (error) {
    return handleError(res, error, 'Unable to fetch user orders');
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    return res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    return handleError(res, error, 'Unable to update order status');
  }
};

export {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  verifyStripe,
  verifyRazorpay
};
