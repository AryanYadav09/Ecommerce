import Stripe from 'stripe';
import razorpay from 'razorpay';
import {
  createOrder as insertOrder,
  getOrderById,
  getUserOrders as fetchUserOrders,
  getAllOrders as fetchAllOrders,
  updateOrderStatus,
  updateOrderPayment,
  deleteOrder
} from '../services/orderService.js';
import { clearUserCart } from '../services/cartService.js';
import { logUserEvent } from '../services/eventService.js';
import { syncOrderToSalesforce } from '../integrations/salesforce/salesforceClient.js';

const currency = 'inr';
const deliveryCharge = 10;

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
const stripe = stripeKey && !stripeKey.includes('placeholder') ? new Stripe(stripeKey) : null;

const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
const razorpayInstance = (razorpayKeyId && razorpayKeySecret)
  ? new razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  : null;

const handleError = (res, error, fallbackMessage = 'Request failed') => {
  return res.status(500).json({
    success: false,
    message: error?.message || fallbackMessage
  });
};

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const newOrder = await insertOrder({
      userId,
      items,
      amount,
      address,
      paymentMethod: 'COD',
      payment: false,
      status: 'Order Placed'
    });

    // Log purchase event for recommendation matrix
    logUserEvent({
      userId,
      eventType: 'purchase',
      metadata: { orderId: newOrder._id, amount }
    }).catch(() => {});

    // Asynchronously synchronize order activity with Salesforce CRM
    syncOrderToSalesforce(newOrder).catch((err) => {
      console.warn('[Salesforce] Async order sync warning:', err.message);
    });

    return res.json({ success: true, message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    return handleError(res, error, 'Unable to place order');
  }
};

const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const newOrder = await insertOrder({
      userId,
      items,
      amount,
      address,
      paymentMethod: 'Stripe',
      payment: false,
      status: 'Pending'
    });

    if (!stripe) {
      // Mock / Sandbox checkout session when stripe key is test/empty
      return res.json({
        success: true,
        message: 'Order placed in sandbox mode',
        session_url: `${origin || 'http://localhost:5173'}/verify?success=true&orderId=${newOrder._id}&userId=${userId}`
      });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100)
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

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (isSuccess) {
      await updateOrderPayment(orderId, true, 'Paid');
      await clearUserCart(userId);

      syncOrderToSalesforce({ ...order, payment: true, status: 'Paid' }).catch(() => {});
      return res.json({ success: true, message: 'Payment verified' });
    }

    await deleteOrder(orderId);
    return res.json({ success: false, message: 'Payment failed' });
  } catch (error) {
    return handleError(res, error, 'Unable to verify stripe payment');
  }
};

const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const newOrder = await insertOrder({
      userId,
      items,
      amount,
      address,
      paymentMethod: 'Razorpay',
      payment: false,
      status: 'Pending'
    });

    if (!razorpayInstance) {
      return res.json({
        success: true,
        order: {
          id: `order_mock_${newOrder._id}`,
          amount: amount * 100,
          currency: currency.toUpperCase(),
          receipt: newOrder._id
        },
        message: 'Order placed in sandbox mode'
      });
    }

    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
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

    let isPaid = true;
    let receiptId = null;

    if (razorpayInstance) {
      const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
      isPaid = orderInfo.status === 'paid';
      receiptId = orderInfo.receipt;
    }

    if (isPaid) {
      if (receiptId) {
        await updateOrderPayment(receiptId, true, 'Paid');
      }
      await clearUserCart(userId);
      return res.json({ success: true, message: 'Payment successful' });
    }

    return res.json({ success: false, message: 'Payment failed' });
  } catch (error) {
    return handleError(res, error, 'Unable to verify razorpay payment');
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await fetchAllOrders();
    return res.json({ success: true, orders });
  } catch (error) {
    return handleError(res, error, 'Unable to fetch orders');
  }
};

const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await fetchUserOrders(userId);
    return res.json({ success: true, orders });
  } catch (error) {
    return handleError(res, error, 'Unable to fetch user orders');
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await updateOrderStatus(orderId, status);
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
