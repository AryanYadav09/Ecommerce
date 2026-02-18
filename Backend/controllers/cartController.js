import userModel from '../models/userModel.js';

const handleError = (res, error, fallbackMessage = 'Cart request failed') => {
  return res.json({
    success: false,
    message: error?.message || fallbackMessage
  });
};

const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: 'User not found' });
    }

    const cartData = userData.cartData || {};
    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    } else {
      cartData[itemId] = { [size]: 1 };
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    return res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    return handleError(res, error, 'Unable to add to cart');
  }
};

const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: 'User not found' });
    }

    const cartData = userData.cartData || {};
    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }
    cartData[itemId][size] = quantity;

    await userModel.findByIdAndUpdate(userId, { cartData });
    return res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    return handleError(res, error, 'Unable to update cart');
  }
};

const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, cartData: userData.cartData || {} });
  } catch (error) {
    return handleError(res, error, 'Unable to fetch cart');
  }
};

export { addToCart, updateCart, getUserCart };
