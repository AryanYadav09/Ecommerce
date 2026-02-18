import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Title from "../components/Title.jsx";
import { ShopContext } from "../context/ShopContext.jsx";

const Profile = () => {
  const {
    token,
    navigate,
    backendUrl,
    userProfile,
    currency,
    cartItems,
    products,
    wishlistItems,
    toggleWishlist,
    getCartCount
  } = useContext(ShopContext);

  const [orders, setOrders] = useState([]);

  const loadOrders = useCallback(async () => {
    try {
      if (!token) {
        return;
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
      if (response.data.success) {
        setOrders(Array.isArray(response.data.orders) ? response.data.orders : []);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message || 'Failed to load profile orders');
    }
  }, [backendUrl, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const cartSummary = useMemo(() => {
    const items = [];

    Object.keys(cartItems || {}).forEach((productId) => {
      const product = products.find((entry) => entry._id === productId);
      if (!product) {
        return;
      }

      Object.keys(cartItems[productId] || {}).forEach((size) => {
        const quantity = cartItems[productId][size];
        if (quantity > 0) {
          items.push({
            productId,
            name: product.name,
            image: product.image?.[0],
            price: product.price,
            size,
            quantity
          });
        }
      });
    });

    return items;
  }, [cartItems, products]);

  const wishlistProducts = useMemo(() => {
    return wishlistItems
      .map((productId) => products.find((product) => product._id === productId))
      .filter(Boolean);
  }, [wishlistItems, products]);

  const cartTotal = useMemo(() => {
    return cartSummary.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartSummary]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center border-t border-white/10">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Please login to view your profile.</p>
          <button onClick={() => navigate('/login')} className="ui-button px-6 py-2 text-sm">Login</button>
        </div>
      </div>
    );
  }

  const profileInitial = userProfile?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="ui-section border-t border-white/10 pt-12">
      <div className="text-2xl mb-8">
        <Title text1={'MY'} text2={'PROFILE'} />
      </div>

      <div className="grid gap-6">
        <section className="ui-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="profile" className="w-20 h-20 rounded-full object-cover border" />
            ) : (
                <div className="w-20 h-20 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-2xl font-semibold">
                {profileInitial}
              </div>
            )}

            <div className="grid gap-2 text-sm muted-text">
              <p><span className="font-medium text-inherit">Name:</span> {userProfile?.name || '-'}</p>
              <p><span className="font-medium text-inherit">Email:</span> {userProfile?.email || '-'}</p>
              <p><span className="font-medium text-inherit">Phone:</span> {userProfile?.phone || '-'}</p>
              <p><span className="font-medium text-inherit">Sign-in method:</span> {userProfile?.authProvider || 'password'}</p>
              <p><span className="font-medium text-inherit">Member since:</span> {userProfile?.memberSince ? new Date(userProfile.memberSince).toDateString() : '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="ui-card p-4">
              <p className="muted-text text-sm">Total Orders</p>
              <p className="text-2xl font-semibold">{orders.length}</p>
            </div>
            <div className="ui-card p-4">
              <p className="muted-text text-sm">Items in Cart</p>
              <p className="text-2xl font-semibold">{getCartCount()}</p>
            </div>
            <div className="ui-card p-4">
              <p className="muted-text text-sm">Wishlist Items</p>
              <p className="text-2xl font-semibold">{wishlistProducts.length}</p>
            </div>
          </div>
        </section>

        <section className="ui-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link to="/orders" className="text-sm underline underline-offset-4">View all</Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm muted-text">No orders yet.</p>
          ) : (
            <div className="grid gap-3">
              {orders.slice().reverse().slice(0, 5).map((order) => (
                <div key={order._id} className="ui-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-medium">Order #{String(order._id).slice(-6).toUpperCase()}</p>
                    <p className="text-sm muted-text">{new Date(order.date).toDateString()}</p>
                  </div>
                  <div className="text-sm muted-text">
                    <p>Status: {order.status}</p>
                    <p>Amount: {currency}{order.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ui-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cart Summary</h2>
            <Link to="/cart" className="text-sm underline underline-offset-4">Open cart</Link>
          </div>

          {cartSummary.length === 0 ? (
            <p className="text-sm muted-text">Your cart is empty.</p>
          ) : (
            <>
              <div className="grid gap-3">
                {cartSummary.slice(0, 5).map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="ui-card p-3 flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{item.name}</p>
                      <p className="text-xs sm:text-sm muted-text">Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">{currency}{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <p className="text-right mt-4 font-semibold">Cart Total: {currency}{cartTotal}</p>
            </>
          )}
        </section>

        <section className="ui-card p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Wishlist</h2>

          {wishlistProducts.length === 0 ? (
            <p className="text-sm muted-text">Your wishlist is empty.</p>
          ) : (
            <div className="grid gap-3">
              {wishlistProducts.slice(0, 8).map((product) => (
                <div key={product._id} className="ui-card p-3 flex items-center gap-3">
                  <img src={product.image?.[0]} alt={product.name} className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1">
                    <Link to={`/product/${product._id}`} className="font-medium hover:underline">{product.name}</Link>
                    <p className="text-sm muted-text">{currency}{product.price}</p>
                  </div>
                  <button
                    onClick={() => toggleWishlist(product._id)}
                    className="ui-button-ghost text-sm px-3 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
