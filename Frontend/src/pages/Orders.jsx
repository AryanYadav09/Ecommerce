import { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';

const Orders = () => {
  const { backendUrl, token, currency, search } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const normalizedSearch = search.trim().toLowerCase();

  const loadOrderData = useCallback(async () => {
    try {
      if (!token) {
        return;
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
      if (response.data.success) {
        const allOrdersItem = [];

        response.data.orders.forEach((order) => {
          order.items.forEach((item) => {
            item.status = order.status;
            item.payment = order.payment;
            item.paymentMethod = order.paymentMethod;
            item.date = order.date;
            allOrdersItem.push(item);
          });
        });

        setOrderData(allOrdersItem.reverse());
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  }, [backendUrl, token]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  const visibleOrders = normalizedSearch
    ? orderData.filter((item) => {
      const searchableParts = [
        item.name,
        item.status,
        item.paymentMethod,
        item.size,
        String(item.quantity),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableParts.includes(normalizedSearch);
    })
    : orderData;

  return (
    <div className='ui-section border-t border-white/10 pt-16'>
      <div className='text-2xl mb-4'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div className='grid gap-3'>
        {visibleOrders.length === 0 ? (
          <p className='text-center text-lg mt-4 muted-text'>
            {orderData.length === 0 ? 'No Orders Found' : 'No orders match your search'}
          </p>
        ) : (
          visibleOrders.map((item, index) => (
            <div key={`${item._id || item.name}-${index}`} className='ui-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
              <div className='flex items-start gap-5 text-sm'>
                <img className='w-16 sm:w-20 rounded-lg object-cover' src={item.image[0]} alt={item.name} />
                <div>
                  <p className='sm:text-base font-medium'>{item.name}</p>
                  <div className='flex flex-wrap items-center gap-3 mt-2 text-sm muted-text'>
                    <p className='text-base text-inherit'>{currency}{item.price}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Size: {item.size}</p>
                  </div>
                  <p className='mt-2 text-sm muted-text'>Date: {new Date(item.date).toDateString()}</p>
                  <p className='mt-1 text-sm muted-text'>Payment: {item.paymentMethod}</p>
                </div>
              </div>

              <div className='md:w-1/2 flex items-center justify-between md:justify-end gap-4'>
                <div className='flex items-center gap-2 text-sm'>
                  <p className='w-2 h-2 rounded-full bg-emerald-500' />
                  <p>{item.status}</p>
                </div>
                <button onClick={loadOrderData} className='ui-button-ghost px-4 py-2 text-xs sm:text-sm' type='button'>
                  Track Order
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
