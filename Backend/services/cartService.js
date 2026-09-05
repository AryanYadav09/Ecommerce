import supabase from '../config/supabase.js';

export const getUserCartData = async (userId) => {
  if (!userId) return {};
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return {};

  const cartData = {};
  for (const row of data) {
    if (row.quantity > 0) {
      if (!cartData[row.product_id]) {
        cartData[row.product_id] = {};
      }
      cartData[row.product_id][row.size] = row.quantity;
    }
  }
  return cartData;
};

export const addItemToCart = async (userId, itemId, size) => {
  if (!userId || !itemId || !size) {
    throw new Error('Missing user, item or size');
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', itemId)
    .eq('size', size)
    .single();

  if (existing) {
    const newQty = (existing.quantity || 0) + 1;
    const { error: updateErr } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id);
    if (updateErr) throw new Error(updateErr.message);
  } else {
    const id = `cart_${userId}_${itemId}_${size}`;
    const { error: insErr } = await supabase.from('cart_items').insert({
      id,
      user_id: userId,
      product_id: itemId,
      size,
      quantity: 1
    });
    if (insErr) throw new Error(insErr.message);
  }

  return getUserCartData(userId);
};

export const updateCartItemQuantity = async (userId, itemId, size, quantity) => {
  if (!userId || !itemId || !size) {
    throw new Error('Missing user, item or size');
  }

  const numericQty = Number(quantity);

  if (numericQty <= 0) {
    const { error: delErr } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', itemId)
      .eq('size', size);
    if (delErr) throw new Error(delErr.message);
  } else {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', itemId)
      .eq('size', size)
      .single();

    if (existing) {
      const { error: updateErr } = await supabase
        .from('cart_items')
        .update({ quantity: numericQty })
        .eq('id', existing.id);
      if (updateErr) throw new Error(updateErr.message);
    } else {
      const id = `cart_${userId}_${itemId}_${size}`;
      const { error: insErr } = await supabase.from('cart_items').insert({
        id,
        user_id: userId,
        product_id: itemId,
        size,
        quantity: numericQty
      });
      if (insErr) throw new Error(insErr.message);
    }
  }

  return getUserCartData(userId);
};

export const clearUserCart = async (userId) => {
  if (!userId) return;
  await supabase.from('cart_items').delete().eq('user_id', userId);
};
