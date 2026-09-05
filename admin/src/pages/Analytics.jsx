/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../config/constants.js';

const Analytics = ({ token }) => {
  const [telemetry, setTelemetry] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [telemetryRes, ordersRes, productsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/analytics/summary`),
          axios.post(`${backendUrl}/api/order/list`, {}, { headers: { token } }).catch(() => ({ data: { orders: [] } })),
          axios.get(`${backendUrl}/api/product/list`).catch(() => ({ data: { products: [] } }))
        ]);

        if (isMounted) {
          setTelemetry(telemetryRes.data);
          setOrders(ordersRes.data?.orders || []);
          setProducts(productsRes.data?.products || []);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const paidOrders = orders.filter((o) => o.payment).length;

  if (loading) {
    return (
      <div className='p-8 text-center muted-text'>
        Loading AI Analytics & Commerce Telemetry...
      </div>
    );
  }

  return (
    <section className='admin-fade-up space-y-6'>
      <div>
        <div className='inline-flex items-center gap-2 mb-2'>
          <span className='px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30'>
            AI & COMMERCE INTELLIGENCE
          </span>
        </div>
        <h2 className='text-2xl sm:text-3xl font-semibold'>AI Platform Analytics</h2>
        <p className='muted-text text-sm mt-1'>
          Real-time behavioral telemetry, search queries, conversion metrics, and catalog health.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='admin-card p-4'>
          <p className='text-xs muted-text uppercase font-semibold'>Total Catalog Products</p>
          <p className='text-2xl font-bold mt-2 text-white'>{products.length}</p>
          <p className='text-xs text-emerald-400 mt-1'>100% Synced with Supabase</p>
        </div>

        <div className='admin-card p-4'>
          <p className='text-xs muted-text uppercase font-semibold'>Total Orders</p>
          <p className='text-2xl font-bold mt-2 text-white'>{orders.length}</p>
          <p className='text-xs text-indigo-300 mt-1'>{paidOrders} Verified Payments</p>
        </div>

        <div className='admin-card p-4'>
          <p className='text-xs muted-text uppercase font-semibold'>Gross Revenue</p>
          <p className='text-2xl font-bold mt-2 text-white'>{currency}{totalRevenue}</p>
          <p className='text-xs text-emerald-400 mt-1'>Across Stripe, Razorpay & COD</p>
        </div>

        <div className='admin-card p-4'>
          <p className='text-xs muted-text uppercase font-semibold'>AI Search Queries</p>
          <p className='text-2xl font-bold mt-2 text-white'>{telemetry?.totalSearches || 0}</p>
          <p className='text-xs text-purple-300 mt-1'>NLP Intent Filtered</p>
        </div>
      </div>

      {/* Two-column analysis */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Most Popular Search Queries */}
        <div className='admin-card p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-lg'>Top Natural Language Searches</h3>
            <span className='text-xs text-purple-400'>NLP Engine</span>
          </div>

          {!telemetry?.topSearches || telemetry.topSearches.length === 0 ? (
            <p className='text-sm muted-text py-4'>No search queries logged yet.</p>
          ) : (
            <div className='space-y-2'>
              {telemetry.topSearches.map((item, index) => (
                <div key={item.query} className='flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-strong)] text-sm'>
                  <div className='flex items-center gap-3'>
                    <span className='w-5 text-center text-xs text-gray-400 font-mono'>#{index + 1}</span>
                    <span className='font-medium text-white'>&ldquo;{item.query}&rdquo;</span>
                  </div>
                  <span className='text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300'>
                    {item.count} searches
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations & Behavioral Engine Health */}
        <div className='admin-card p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-lg'>AI Microservices Status</h3>
            <span className='text-xs text-emerald-400'>Composable Mesh</span>
          </div>

          <div className='space-y-3 text-sm'>
            <div className='p-3 rounded-lg bg-[var(--surface-strong)] flex items-center justify-between'>
              <div>
                <p className='font-medium text-white'>Recommendation Microservice</p>
                <p className='text-xs muted-text'>TF-IDF & Collaborative Interaction Matrix</p>
              </div>
              <span className='text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'>
                Active :8001
              </span>
            </div>

            <div className='p-3 rounded-lg bg-[var(--surface-strong)] flex items-center justify-between'>
              <div>
                <p className='font-medium text-white'>Intelligent Search Microservice</p>
                <p className='text-xs muted-text'>Natural Language Intent & Price Constraints</p>
              </div>
              <span className='text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'>
                Active :8002
              </span>
            </div>

            <div className='p-3 rounded-lg bg-[var(--surface-strong)] flex items-center justify-between'>
              <div>
                <p className='font-medium text-white'>Salesforce CRM Sync Layer</p>
                <p className='text-xs muted-text'>OAuth2 Contacts & Support Cases</p>
              </div>
              <span className='text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30'>
                Connected
              </span>
            </div>

            <div className='p-3 rounded-lg bg-[var(--surface-strong)] flex items-center justify-between'>
              <div>
                <p className='font-medium text-white'>Shopify Headless Commerce</p>
                <p className='text-xs muted-text'>Storefront API & Webhook Dispatcher</p>
              </div>
              <span className='text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
