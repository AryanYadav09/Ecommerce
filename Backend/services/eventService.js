import supabase from '../config/supabase.js';

export const logUserEvent = async ({ userId = null, productId = null, eventType, metadata = {} }) => {
  if (!eventType) return null;

  const eventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    user_id: userId || 'anonymous',
    product_id: productId || null,
    event_type: eventType,
    metadata: metadata || {},
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('user_events').insert(eventRecord);
  if (error) {
    console.warn('[Analytics] Failed to log user event:', error.message);
  }
  return data;
};

export const getEventsForUser = async (userId) => {
  if (!userId) return [];
  const { data } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  return data || [];
};

export const getAnalyticsSummary = async () => {
  const { data: events } = await supabase
    .from('user_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  const list = events || [];
  const searchCounts = {};
  const productViewCounts = {};
  let totalSearches = 0;
  let totalViews = 0;
  let totalCartAdds = 0;

  for (const ev of list) {
    if (ev.event_type === 'search') {
      totalSearches++;
      const q = (ev.metadata?.query || '').trim().toLowerCase();
      if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
    } else if (ev.event_type === 'view') {
      totalViews++;
      if (ev.product_id) {
        productViewCounts[ev.product_id] = (productViewCounts[ev.product_id] || 0) + 1;
      }
    } else if (ev.event_type === 'add_to_cart') {
      totalCartAdds++;
    }
  }

  const topSearches = Object.entries(searchCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topViewed = Object.entries(productViewCounts)
    .map(([productId, count]) => ({ productId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: list.length,
    totalSearches,
    totalViews,
    totalCartAdds,
    topSearches,
    topViewed
  };
};
