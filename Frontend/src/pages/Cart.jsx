import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets.js';
import CartTotal from '../components/CartTotal.jsx';
import Title from '../components/Title.jsx';
import { ShopContext } from '../context/ShopContext.jsx';

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, token } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const tempData = [];

    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          tempData.push({
            _id: items,
            size: item,
            quantity: cartItems[items][item],
          });
        }
      }
    }

    setCartData(tempData);
  }, [cartItems]);

  if (!token) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center gap-4">
        <p className="text-xl font-semibold">Please log in to view your cart.</p>
        <button onClick={() => navigate('/login')} className="ui-button px-6 py-2 text-sm" type='button'>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className='ui-section border-t border-white/10 pt-14'>
      <div className='text-2xl mb-4'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      <div className='grid gap-3'>
        {cartData.length === 0 ? (
          <p className='text-center text-lg mt-4 muted-text'>Your cart is empty.</p>
        ) : (
          cartData.map((item) => {
            const productData = products.find((product) => product._id === item._id);
            if (!productData) {
              return null;
            }

            return (
              <div key={`${item._id}-${item.size}`} className='ui-card p-4 grid grid-cols-[4fr_0.7fr_0.4fr] sm:grid-cols-[4fr_1fr_0.4fr] items-center gap-4'>
                <div className='flex items-start gap-4'>
                  <img className='w-16 sm:w-20 rounded-lg object-cover' src={productData.image[0]} alt={productData.name} />
                  <div>
                    <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                    <div className='flex items-center gap-3 mt-2 text-sm'>
                      <p>{currency}{productData.price}</p>
                      <p className='px-2 py-1 rounded-full border text-xs'>{item.size}</p>
                    </div>
                  </div>
                </div>

                <input
                  onChange={(e) => e.target.value === '' || e.target.value === '0' ? null : updateQuantity(item._id, item.size, Number(e.target.value))}
                  className='ui-input rounded-md max-w-14 sm:max-w-20 px-1 sm:px-2 py-1 text-center'
                  type="number"
                  min={1}
                  defaultValue={item.quantity}
                />

                <img onClick={() => updateQuantity(item._id, item.size, 0)} src={assets.bin_icon} className='w-4 cursor-pointer justify-self-end' alt="remove" />
              </div>
            );
          })
        )}
      </div>

      <div className='flex justify-end my-16'>
        <div className='w-full sm:w-[450px] ui-card p-5'>
          <CartTotal />
          <div className='w-full text-end'>
            <button onClick={() => navigate('/place-order')} className='ui-button text-sm mt-8 px-8 py-3' type='button'>
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
