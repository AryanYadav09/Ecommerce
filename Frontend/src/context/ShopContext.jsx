/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const currency = '\u20B9';
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [search, setSearch] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userProfile, setUserProfile] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartItems, setCartItems] = useState({});

  const navigate = useNavigate();

  const notifyError = (error, fallbackMessage = 'Something went wrong') => {
    toast.dismiss();
    toast.error(error?.response?.data?.message || error?.message || fallbackMessage);
  };

  const getProductsData = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Failed to load products');
      }
    } catch (error) {
      notifyError(error, 'Failed to load products');
    }
  }, [backendUrl]);

  const getUserCart = useCallback(async (authToken) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
        {},
        { headers: { token: authToken } }
      );

      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      }
    } catch (error) {
      notifyError(error, 'Failed to load cart');
    }
  }, [backendUrl]);

  const getUserProfile = useCallback(async (authToken) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/profile`,
        {},
        { headers: { token: authToken } }
      );

      if (response.data.success) {
        setUserProfile(response.data.user || null);
        if (Array.isArray(response.data.wishlist)) {
          setWishlistItems(response.data.wishlist);
        }
      }
    } catch {
      setUserProfile(null);
    }
  }, [backendUrl]);

  const getUserWishlist = useCallback(async (authToken) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/wishlist`,
        {},
        { headers: { token: authToken } }
      );
      if (response.data.success) {
        setWishlistItems(Array.isArray(response.data.wishlist) ? response.data.wishlist : []);
      }
    } catch {
      setWishlistItems([]);
    }
  }, [backendUrl]);

  const addToCart = useCallback(async (itemId, size) => {
    if (!token) {
      toast.dismiss();
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (!size) {
      toast.dismiss();
      toast.error('Select Product Size');
      return;
    }

    const cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    } else {
      cartData[itemId] = { [size]: 1 };
    }
    setCartItems(cartData);

    try {
      await axios.post(
        `${backendUrl}/api/cart/add`,
        { itemId, size },
        { headers: { token } }
      );
    } catch (error) {
      notifyError(error, 'Unable to add product to cart');
    }
  }, [backendUrl, cartItems, navigate, token]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!token) {
      toast.dismiss();
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/wishlist/toggle`,
        { productId },
        { headers: { token } }
      );

      if (response.data.success) {
        setWishlistItems(Array.isArray(response.data.wishlist) ? response.data.wishlist : []);
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Unable to update wishlist');
      }
    } catch (error) {
      notifyError(error, 'Unable to update wishlist');
    }
  }, [backendUrl, navigate, token]);

  const isInWishlist = useCallback(
    (productId) => wishlistItems.includes(productId),
    [wishlistItems]
  );

  const getCartCount = useCallback(() => {
    let totalCount = 0;

    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        if (cartItems[productId][size] > 0) {
          totalCount += cartItems[productId][size];
        }
      }
    }

    return totalCount;
  }, [cartItems]);

  const updateQuantity = useCallback(async (itemId, size, quantity) => {
    const cartData = structuredClone(cartItems);
    if (!cartData[itemId]) {
      return;
    }

    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (!token) {
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/api/cart/update`,
        { itemId, size, quantity },
        { headers: { token } }
      );
    } catch (error) {
      notifyError(error, 'Unable to update cart quantity');
    }
  }, [backendUrl, cartItems, token]);

  const getCartAmount = useCallback(() => {
    let totalAmount = 0;

    for (const productId in cartItems) {
      const itemInfo = products.find((product) => product._id === productId);
      if (!itemInfo) {
        continue;
      }

      for (const size in cartItems[productId]) {
        if (cartItems[productId][size] > 0) {
          totalAmount += itemInfo.price * cartItems[productId][size];
        }
      }
    }

    return totalAmount;
  }, [cartItems, products]);

  useEffect(() => {
    getProductsData();
  }, [getProductsData]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCartItems({});
      setUserProfile(null);
      setWishlistItems([]);
      return;
    }

    getUserCart(token);
    getUserProfile(token);
    getUserWishlist(token);
  }, [token, getUserCart, getUserProfile, getUserWishlist]);

  const value = useMemo(() => ({
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearchBar,
    setShowSearchBar,
    cartItems,
    addToCart,
    getCartCount,
    backendUrl,
    token,
    setToken,
    navigate,
    updateQuantity,
    getCartAmount,
    setCartItems,
    userProfile,
    setUserProfile,
    getUserProfile,
    wishlistItems,
    setWishlistItems,
    getUserWishlist,
    toggleWishlist,
    isInWishlist
  }), [
    products,
    currency,
    delivery_fee,
    search,
    showSearchBar,
    cartItems,
    addToCart,
    getCartCount,
    backendUrl,
    token,
    navigate,
    updateQuantity,
    getCartAmount,
    userProfile,
    getUserProfile,
    wishlistItems,
    getUserWishlist,
    toggleWishlist,
    isInWishlist
  ]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
