import supabase from '../config/supabase.js';
import { clearUserCart } from './cartService.js';

export const formatOrder = async (orderRow) => {
  if (!orderRow) return null;
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderRow.id);

  return {
    ...orderRow,
    _id: orderRow.id,
    payment: Boolean(orderRow.payment_status),
    paymentMethod: orderRow.payment_method,
    address: orderRow.shipping_address,
    items: (items || []).map((i) => ({
      ...i,
      _id: i.product_id,
      image: Array.isArray(i.image) ? i.image : []
    }))
  };
};

export const createOrder = async ({
  userId,
  items,
  amount,
  address,
  paymentMethod = 'COD',
  payment = false,
  status = 'Order Placed'
}) => {
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const date = Date.now();

  const orderRecord = {
    id: orderId,
    user_id: userId,
    amount: Number(amount),
    status,
    payment_method: paymentMethod,
    payment_status: Boolean(payment),
    shipping_address: address || {},
    date
  };

  const { error: orderErr } = await supabase.from('orders').insert(orderRecord);
  if (orderErr) throw new Error(orderErr.message);

  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      const itemRecord = {
        id: `item_${orderId}_${i}`,
        order_id: orderId,
        product_id: itm._id || itm.productId || `p_${i}`,
        name: itm.name || 'Product',
        price: Number(itm.price) || 0,
        size: itm.size || '',
        quantity: Number(itm.quantity) || 1,
        image: itm.image || []
      };
      await supabase.from('order_items').insert(itemRecord);
    }
  }

  // Clear user's cart on order creation
  await clearUserCart(userId);

  return formatOrder(orderRecord);
};

export const getOrderById = async (orderId) => {
  if (!orderId) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !data) return null;
  return formatOrder(data);
};

export const getUserOrders = async (userId) => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error || !orders) return [];

  const formatted = [];
  for (const o of orders) {
    formatted.push(await formatOrder(o));
  }
  return formatted;
};

export const getAllOrders = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false });

  if (error || !orders) return [];

  const formatted = [];
  for (const o of orders) {
    formatted.push(await formatOrder(o));
  }
  return formatted;
};

export const updateOrderStatus = async (orderId, status) => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  return getOrderById(orderId);
};

export const updateOrderPayment = async (orderId, paymentStatus, status) => {
  const updateData = { payment_status: Boolean(paymentStatus) };
  if (status) updateData.status = status;

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  return getOrderById(orderId);
};

export const deleteOrder = async (orderId) => {
  await supabase.from('order_items').delete().eq('order_id', orderId);
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw new Error(error.message);
  return true;
};
