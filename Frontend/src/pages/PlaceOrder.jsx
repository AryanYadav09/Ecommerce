import { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal.jsx';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext.jsx';

const PlaceOrder = () => {
  const [method, setMethod] = useState('cod');
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: ''
  });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const initPay = async (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Order Payment',
      description: 'Order payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay', response, { headers: { token } });
          if (data.success) {
            setCartItems({});
            navigate('/orders');
          } else {
            toast.dismiss();
            toast.error(data.message || 'Payment verification failed');
          }
        } catch (error) {
          toast.dismiss();
          toast.error(error.response?.data?.message || error.message || 'Payment verification failed');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const orderItems = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find((product) => product._id === items));
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      };

      switch (method) {
        case 'cod': {
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } });
          if (response.data.success) {
            setCartItems({});
            navigate('/orders');
          } else {
            toast.dismiss();
            toast.error(response.data.message);
          }
          break;
        }

        case 'stripe': {
          const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } });
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.dismiss();
            toast.error(responseStripe.data.message);
          }
          break;
        }

        case 'razorpay': {
          const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, { headers: { token } });
          if (responseRazorpay.data.success) {
            initPay(responseRazorpay.data.order);
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message || 'Unable to place order');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='ui-section flex flex-col sm:flex-row justify-between gap-6 pt-6 sm:pt-14 min-h-[80vh] border-t border-white/10'>
      <div className='ui-card p-5 sm:p-6 flex flex-col gap-4 w-full sm:max-w-[500px] h-fit'>
        <div className='text-xl sm:text-2xl my-1'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='ui-input rounded-md py-2 px-3.5 w-full' type="text" placeholder='First Name' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='ui-input rounded-md py-2 px-3.5 w-full' type="text" placeholder='Last Name' />
          <input required onChange={onChangeHandler} name='email' value={formData.email} className='ui-input rounded-md py-2 px-3.5 w-full sm:col-span-2' type="email" placeholder='Email Address' />
          <input required onChange={onChangeHandler} name='street' value={formData.street} className='ui-input rounded-md py-2 px-3.5 w-full sm:col-span-2' type="text" placeholder='Street' />
          <input required onChange={onChangeHandler} name='city' value={formData.city} className='ui-input rounded-md py-2 px-3.5 w-full' type="text" placeholder='City' />
          <input required onChange={onChangeHandler} name='state' value={formData.state} className='ui-input rounded-md py-2 px-3.5 w-full' type="text" placeholder='State' />
          <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='ui-input rounded-md py-2 px-3.5 w-full' type="number" placeholder='Zipcode' />
          <input required onChange={onChangeHandler} name='country' value={formData.country} className='ui-input rounded-md py-2 px-3.5 w-full' type="text" placeholder='Country' />
          <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='ui-input rounded-md py-2 px-3.5 w-full sm:col-span-2' type="number" placeholder='Phone' />
        </div>
      </div>

      <div className='ui-card p-5 sm:p-6 mt-4 sm:mt-8 w-full sm:w-auto h-fit'>
        <div className='min-w-[280px]'>
          <CartTotal />
        </div>

        <div className='mt-10'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />

          <div className='flex gap-3 flex-col sm:flex-row mt-3'>
            <div onClick={() => setMethod('stripe')} className='ui-button-ghost flex items-center gap-3 p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-emerald-400' : ''}`} />
              <img src={assets.stripe_logo} alt="stripe" />
            </div>

            <div onClick={() => setMethod('razorpay')} className='ui-button-ghost flex items-center gap-3 p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'razorpay' ? 'bg-emerald-400' : ''}`} />
              <img src={assets.razorpay_logo} alt="razorpay" />
            </div>

            <div onClick={() => setMethod('cod')} className='ui-button-ghost flex items-center gap-3 p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-emerald-400' : ''}`} />
              <p className='text-xs font-medium mx-1'>CASH ON DELIVERY</p>
            </div>
          </div>

          <div className='w-full text-end mt-8'>
            <button type='submit' className='ui-button px-14 py-3 text-sm'>
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
