import supabase from '../config/supabase.js';

export const findUserByEmail = async (email) => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalized)
    .single();

  if (error || !data) return null;
  return { ...data, _id: data.id, password: data.password_hash };
};

export const findUserById = async (id) => {
  if (!id) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return { ...data, _id: data.id, password: data.password_hash };
};

export const findUserByPhone = async (phone) => {
  if (!phone) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) return null;
  return { ...data, _id: data.id, password: data.password_hash };
};

export const createUser = async ({
  name,
  email,
  password = '',
  phone = '',
  authProvider = 'password',
  authProviderId = '',
  avatar = '',
  role = 'customer'
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const userRecord = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    password_hash: password,
    phone: phone || '',
    auth_provider: authProvider,
    auth_provider_id: authProviderId,
    avatar: avatar || '',
    role
  };

  const { data, error } = await supabase.from('users').insert(userRecord);
  if (error) throw new Error(error.message);

  const created = Array.isArray(data) ? data[0] : userRecord;
  return { ...created, _id: created.id, password: created.password_hash };
};

export const updateUser = async (id, updates) => {
  const payload = { ...updates };
  if (payload.password) {
    payload.password_hash = payload.password;
    delete payload.password;
  }
  const { data, error } = await supabase
    .from('users')
    .eq('id', id)
    .update(payload);

  if (error) throw new Error(error.message);
  return data;
};

export const getUserWishlist = async (userId) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((item) => item.product_id);
};

export const toggleWishlist = async (userId, productId) => {
  const cleanProductId = String(productId || '').trim();
  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', cleanProductId)
    .single();

  let isWishlisted = false;
  if (existing) {
    await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', cleanProductId);
    isWishlisted = false;
  } else {
    await supabase.from('wishlist_items').insert({
      id: `wish_${userId}_${cleanProductId}`,
      user_id: userId,
      product_id: cleanProductId
    });
    isWishlisted = true;
  }

  const updatedWishlist = await getUserWishlist(userId);
  return { wishlist: updatedWishlist, isWishlisted };
};

export const createOrUpdatePendingUser = async ({ name, email, password, otpHash, otpExpiresAt }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const record = {
    id: `pending_${normalizedEmail}`,
    email: normalizedEmail,
    name: name.trim(),
    password_hash: password,
    otp_hash: otpHash,
    otp_expires_at: otpExpiresAt.toISOString()
  };

  const { data, error } = await supabase
    .from('pending_users')
    .upsert(record, { onConflict: 'email' });

  if (error) throw new Error(error.message);
  return data;
};

export const findPendingUser = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('pending_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error || !data) return null;
  return {
    ...data,
    password: data.password_hash,
    otpHash: data.otp_hash,
    otpExpiresAt: new Date(data.otp_expires_at)
  };
};

export const deletePendingUser = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  return supabase.from('pending_users').delete().eq('email', normalizedEmail);
};
