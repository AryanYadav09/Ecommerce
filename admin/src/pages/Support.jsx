/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../config/constants.js';

const Support = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCases = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/support/cases`);
        if (isMounted) {
          setCases(res.data.cases || []);
        }
      } catch (err) {
        console.error('Failed to load support cases:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCases();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className='admin-fade-up space-y-5'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4'>
        <div>
          <div className='inline-flex items-center gap-2 mb-2'>
            <span className='px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30'>
              SALESFORCE CRM INTEGRATION
            </span>
          </div>
          <h2 className='text-2xl sm:text-3xl font-semibold'>Customer Support Cases</h2>
          <p className='muted-text text-sm mt-1'>
            Tickets submitted by customers synced between Supabase and Salesforce Service Cloud.
          </p>
        </div>
      </div>

      {loading ? (
        <div className='admin-panel p-6 text-center muted-text'>Loading CRM cases...</div>
      ) : cases.length === 0 ? (
        <div className='admin-panel p-6 text-center muted-text'>No support cases submitted yet.</div>
      ) : (
        <div className='space-y-3 stagger-grid'>
          {cases.map((item) => (
            <article key={item.id} className='admin-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4'>
              <div className='space-y-1.5 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-base text-white'>{item.subject}</span>
                  <span className='text-[11px] px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20'>
                    {item.salesforce_case_id || 'SF-CASE'}
                  </span>
                </div>
                <p className='text-sm text-gray-300'>{item.message}</p>
                <div className='flex flex-wrap items-center gap-3 text-xs muted-text pt-1'>
                  <span>From: <strong className='text-white'>{item.name}</strong> ({item.email})</span>
                  <span>&bull;</span>
                  <span>Created: {new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className='flex items-center gap-3 shrink-0'>
                <span className='text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'>
                  {item.status || 'New'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Support;
