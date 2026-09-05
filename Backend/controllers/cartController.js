import { getUserCartData, addItemToCart, updateCartItemQuantity } from '../services/cartService.js';
import { logUserEvent } from '../services/eventService.js';

const handleError = (res, error, fallbackMessage = 'Cart request failed') => {
  return res.json({
    success: false,
    message: error?.message || fallbackMessage
  });
};

const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;
    if (!userId || !itemId || !size) {
      return res.json({ success: false, message: 'Missing required cart parameters' });
    }

    const cartData = await addItemToCart(userId, itemId, size);

    // Asynchronously log user event for recommendation engine
    logUserEvent({
      userId,
      productId: itemId,
      eventType: 'add_to_cart',
      metadata: { size }
    }).catch(() => {});

    return res.json({ success: true, message: 'Added to cart', cartData });
  } catch (error) {
    return handleError(res, error, 'Unable to add to cart');
  }
};

const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;
    if (!userId || !itemId || !size) {
      return res.json({ success: false, message: 'Missing required cart parameters' });
    }

    const cartData = await updateCartItemQuantity(userId, itemId, size, quantity);
    return res.json({ success: true, message: 'Cart updated', cartData });
  } catch (error) {
    return handleError(res, error, 'Unable to update cart');
  }
};

const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.json({ success: false, message: 'User id required' });
    }

    const cartData = await getUserCartData(userId);
    return res.json({ success: true, cartData: cartData || {} });
  } catch (error) {
    return handleError(res, error, 'Unable to fetch cart');
  }
};

export { addToCart, updateCart, getUserCart };
