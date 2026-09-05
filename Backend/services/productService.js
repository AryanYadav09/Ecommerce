import supabase from '../config/supabase.js';

const toOneDecimal = (val) => Number((Number(val) || 0).toFixed(1));

export const formatProduct = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    subCategory: p.sub_category || p.subCategory,
    inStock: p.in_stock !== undefined ? p.in_stock : p.inStock !== false,
    averageRating: Number(p.average_rating || p.averageRating || 0),
    totalReviews: Number(p.total_reviews || p.totalReviews || 0),
    price: Number(p.price) || 0,
    sizes: Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : []),
    image: Array.isArray(p.image) ? p.image : []
  };
};

export const listProducts = async () => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(formatProduct);
};

export const getProductById = async (id) => {
  if (!id) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return formatProduct(data);
};

export const addProduct = async (productData) => {
  const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const record = {
    id,
    name: productData.name,
    description: productData.description,
    price: Number(productData.price),
    category: productData.category,
    sub_category: productData.subCategory || 'General',
    sizes: Array.isArray(productData.sizes) ? productData.sizes : (typeof productData.sizes === 'string' ? JSON.parse(productData.sizes) : []),
    bestseller: productData.bestseller === true || productData.bestseller === 'true',
    in_stock: productData.inStock !== false,
    image: Array.isArray(productData.image) ? productData.image : [],
    date: productData.date || Date.now(),
    average_rating: 0,
    total_reviews: 0
  };

  const { data, error } = await supabase.from('products').insert(record);
  if (error) throw new Error(error.message);
  return formatProduct(Array.isArray(data) ? data[0] : record);
};

export const updateProduct = async (id, updateData) => {
  const payload = {};
  if (updateData.name !== undefined) payload.name = updateData.name;
  if (updateData.description !== undefined) payload.description = updateData.description;
  if (updateData.price !== undefined) payload.price = Number(updateData.price);
  if (updateData.category !== undefined) payload.category = updateData.category;
  if (updateData.subCategory !== undefined) payload.sub_category = updateData.subCategory;
  if (updateData.bestseller !== undefined) payload.bestseller = updateData.bestseller === true || updateData.bestseller === 'true';
  if (updateData.inStock !== undefined) payload.in_stock = updateData.inStock === true || updateData.inStock === 'true';
  if (updateData.sizes !== undefined) {
    payload.sizes = Array.isArray(updateData.sizes) ? updateData.sizes : JSON.parse(updateData.sizes);
  }
  if (updateData.image !== undefined) payload.image = updateData.image;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(error.message);
  return getProductById(id);
};

export const removeProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
};

export const getProductReviews = async (productId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  const product = await getProductById(productId);
  return {
    reviews: (data || []).map(r => ({
      userId: r.user_id,
      userName: r.user_name,
      userAvatar: r.user_avatar,
      rating: Number(r.rating),
      comment: r.comment,
      date: Number(r.date)
    })),
    averageRating: product?.averageRating || 0,
    totalReviews: product?.totalReviews || (data ? data.length : 0)
  };
};

export const addProductReview = async ({ productId, userId, userName, userAvatar, rating, comment }) => {
  const numericRating = Number(rating);
  const reviewId = `rev_${productId}_${userId}`;

  const reviewRecord = {
    id: reviewId,
    product_id: productId,
    user_id: userId,
    user_name: userName || 'User',
    user_avatar: userAvatar || '',
    rating: numericRating,
    comment: comment || '',
    date: Date.now()
  };

  await supabase.from('reviews').upsert(reviewRecord, { onConflict: 'id' });

  // Recalculate average rating & total reviews
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  const list = allReviews || [];
  const totalReviews = list.length;
  const sum = list.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  const averageRating = totalReviews > 0 ? toOneDecimal(sum / totalReviews) : 0;

  await supabase
    .from('products')
    .update({ average_rating: averageRating, total_reviews: totalReviews })
    .eq('id', productId);

  return getProductReviews(productId);
};
