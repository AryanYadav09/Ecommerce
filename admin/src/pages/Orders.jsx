/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets.js';
import { backendUrl, currency } from '../config/constants.js';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      if (!token) return;

      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  }, [token]);

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: event.target.value },
        { headers: { token } }
      );

      if (response.data.success) {
        await fetchOrders();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <section className='admin-fade-up'>
      <div className='mb-5'>
        <h2 className='text-2xl sm:text-3xl'>Orders</h2>
        <p className='muted-text text-sm mt-1'>Track order status and update deliveries from one place.</p>
      </div>

      {orders.length === 0 ? (
        <div className='admin-panel p-5 text-sm muted-text'>No orders available right now.</div>
      ) : (
        <div className='space-y-3 stagger-grid'>
          {orders.map((order) => (
            <article
              className='admin-card p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[64px_2.2fr_1.2fr_0.8fr_1fr] gap-4'
              key={order._id}
            >
              <img className='w-12 h-12 icon-asset' src={assets.parcel_icon} alt='parcel' />

              <div>
                <div className='text-sm'>
                  {order.items.map((item, index) => (
                    <p className='py-0.5' key={`${item._id || item.name}-${index}`}>
                      {item.name} x {item.quantity} {item.size ? <span>({item.size})</span> : null}
                    </p>
                  ))}
                </div>

                <p className='mt-3 mb-1.5 font-semibold'>
                  {order.address.firstname} {order.address.lastname}
                </p>
                <div className='text-sm muted-text'>
                  <p>{order.address.street}</p>
                  <p>
                    {order.address.city}, {order.address.state}, {order.address.country},{' '}
                    {order.address.zipcode}
                  </p>
                </div>
                <p className='text-sm mt-1'>{order.address.phone}</p>
              </div>

              <div className='text-sm space-y-1'>
                <p>Items: {order.items.length}</p>
                <p>Method: {order.paymentMethod}</p>
                <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <p className='text-lg font-semibold self-start'>{currency}{order.amount}</p>

              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
                className='admin-input p-2.5 h-fit'
              >
                <option value='Order Placed'>Order Placed</option>
                <option value='Packing'>Packing</option>
                <option value='Shipped'>Shipped</option>
                <option value='Out for delivery'>Out For Delivery</option>
                <option value='Delivered'>Delivered</option>
              </select>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Orders;
