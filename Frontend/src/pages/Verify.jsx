import { useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useLoading } from '../context/LoadingContext';

const Verify = () => {
  const { token, setCartItems, backendUrl } = useContext(ShopContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId');
  const userId = searchParams.get('userId') || '';

  useEffect(() => {
    if (!token || !orderId) {
      navigate('/cart');
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${backendUrl}/api/order/verifyStripe`,
          { success, orderId, userId },
          { headers: { token } }
        );

        if (response.data.success) {
          setCartItems({});
          toast.dismiss();
          toast.success('Payment verified');
          navigate('/orders');
        } else {
          toast.dismiss();
          toast.error('Payment failed');
          navigate('/cart');
        }
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || 'Payment verification failed');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [token, navigate, orderId, success, userId, backendUrl, setCartItems, setLoading]);

  return <h2 className='pt-14 text-center muted-text'>Verifying payment...</h2>;
};

export default Verify;
