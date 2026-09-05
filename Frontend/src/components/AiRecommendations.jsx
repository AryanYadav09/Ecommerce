import { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';

const AiRecommendations = ({ productId = null, title = 'RECOMMENDED FOR YOU', subtitle = 'AI-powered personalized picks tailored to your style' }) => {
  const { getPersonalizedRecommendations } = useContext(ShopContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecs = async () => {
      setLoading(true);
      try {
        const list = await getPersonalizedRecommendations(productId, 4);
        if (isMounted) {
          setRecommendations(list);
        }
      } catch {
        if (isMounted) setRecommendations([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [productId, getPersonalizedRecommendations]);

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <section className='my-10'>
      <div className='text-center py-6 text-2xl sm:text-3xl'>
        <div className='inline-flex gap-2 items-center mb-2'>
          <span className='px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white tracking-wider'>
            AI POWERED
          </span>
        </div>
        <h2 className='font-semibold tracking-wide'>{title}</h2>
        <p className='w-3/4 m-auto text-xs sm:text-sm text-gray-400 mt-1'>
          {subtitle}
        </p>
      </div>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className='ui-card h-64 animate-pulse p-4 rounded-xl' />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6'>
          {recommendations.map((rec) => {
            const p = rec.product || {};
            const pId = rec.product_id || p._id || p.id;
            return (
              <div key={pId} className='relative group flex flex-col'>
                {rec.reason && (
                  <span className='absolute top-2 left-2 z-10 text-[10px] px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-emerald-300 font-medium border border-emerald-500/30'>
                    ✨ {rec.reason}
                  </span>
                )}
                <ProductItem
                  id={pId}
                  image={p.image || []}
                  name={p.name}
                  price={p.price}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AiRecommendations;
