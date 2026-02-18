import { useContext } from 'react';
import Title from './Title.jsx';
import { ShopContext } from '../context/ShopContext.jsx';

const CartTotal = () => {
  const { getCartAmount, currency, delivery_fee } = useContext(ShopContext);

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>

      <div className='flex flex-col gap-3 mt-4 text-sm'>
        <div className='flex justify-between muted-text'>
          <p>Subtotal</p>
          <p>{currency}{getCartAmount()}.00</p>
        </div>
        <hr className='border-white/15' />
        <div className='flex justify-between muted-text'>
          <p>Shipping Fee</p>
          <p>{currency}{delivery_fee}.00</p>
        </div>
        <hr className='border-white/15' />
        <div className='flex justify-between text-base font-semibold'>
          <p>Total</p>
          <p>{currency}{getCartAmount() === 0 ? 0 : getCartAmount() + delivery_fee}.00</p>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
