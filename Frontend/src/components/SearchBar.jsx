import { useContext, useEffect, useMemo, useState } from 'react';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';

const LINK_OPTIONS = [
  { label: 'Home', path: '/', keywords: ['home', 'main', 'landing'] },
  { label: 'Collection', path: '/collection', keywords: ['collection', 'shop', 'products'] },
  { label: 'About', path: '/about', keywords: ['about', 'company', 'story'] },
  { label: 'Contact', path: '/contact', keywords: ['contact', 'support', 'help', 'salesforce'] },
  { label: 'Cart', path: '/cart', keywords: ['cart', 'checkout', 'bag'] },
  { label: 'Orders', path: '/orders', keywords: ['orders', 'order', 'tracking'], protected: true },
  { label: 'Profile', path: '/profile', keywords: ['profile', 'account', 'wishlist'], protected: true },
  { label: 'Login', path: '/login', keywords: ['login', 'signin', 'auth'] }
];

const SearchBar = () => {
  const {
    search,
    setSearch,
    showSearchBar,
    setShowSearchBar,
    products,
    navigate,
    token,
    performAiSearch,
    aiSearchResults,
    aiSearchLoading,
    logEvent
  } = useContext(ShopContext);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input for AI endpoint
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Execute AI Search when debounced search updates
  useEffect(() => {
    if (debouncedSearch.trim().length > 1) {
      performAiSearch(debouncedSearch.trim(), 8);
      logEvent('search', null, { query: debouncedSearch.trim() });
    }
  }, [debouncedSearch, performAiSearch, logEvent]);

  const normalizedSearch = search.trim().toLowerCase();

  const availableLinks = useMemo(
    () => LINK_OPTIONS.filter((link) => !link.protected || token),
    [token]
  );

  const filteredLinks = useMemo(() => {
    if (!normalizedSearch) {
      return availableLinks;
    }

    return availableLinks.filter((link) => {
      const matchesLabel = link.label.toLowerCase().includes(normalizedSearch);
      const matchesKeyword = link.keywords.some((keyword) => keyword.includes(normalizedSearch));
      return matchesLabel || matchesKeyword;
    });
  }, [normalizedSearch, availableLinks]);

  // AI-augmented product results
  const displayedProducts = useMemo(() => {
    if (aiSearchResults?.results && aiSearchResults.results.length > 0) {
      return aiSearchResults.results.slice(0, 6);
    }

    const normalizedItems = products || [];
    if (!normalizedSearch) {
      return normalizedItems.slice(0, 6);
    }

    return normalizedItems
      .filter((product) => {
        const name = product.name?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';
        const subCategory = product.subCategory?.toLowerCase() || '';
        return (
          name.includes(normalizedSearch) ||
          category.includes(normalizedSearch) ||
          subCategory.includes(normalizedSearch)
        );
      })
      .slice(0, 6);
  }, [aiSearchResults, products, normalizedSearch]);

  const parsedIntent = aiSearchResults?.parsed_intent;

  const handleCloseSearch = () => {
    setShowSearchBar(false);
    setSearch('');
  };

  const openLink = (path) => {
    navigate(path);
    setShowSearchBar(false);
  };

  const openProduct = (productId) => {
    navigate(`/product/${productId}`);
    setShowSearchBar(false);
  };

  if (!showSearchBar) {
    return null;
  }

  return (
    <section className='ui-section pb-2'>
      <div className='glass-panel p-3 sm:p-4'>
        <form onSubmit={(e) => e.preventDefault()} className='flex flex-wrap items-center gap-3'>
          <img className='w-4 opacity-80' src={assets.search_icon} alt="search" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='ui-input flex-1 min-w-[220px] rounded-full px-4 py-2 text-sm'
            type="text"
            placeholder='Try: "men jacket under 100", "cotton shirts", "women bottomwear"...'
          />
          {aiSearchLoading && (
            <span className='text-xs text-indigo-400 animate-pulse font-medium'>
              Searching...
            </span>
          )}
          <button
            onClick={handleCloseSearch}
            type='button'
            className='ui-button-ghost px-4 py-2 text-xs'
          >
            Close
          </button>
        </form>

        {/* Parsed Intent Badges */}
        {parsedIntent && (parsedIntent.max_price || parsedIntent.category || parsedIntent.sub_category) && (
          <div className='flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/10 text-xs'>
            <span className='text-purple-400 font-semibold'>Filtered by:</span>
            {parsedIntent.category && (
              <span className='px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'>
                Category: {parsedIntent.category}
              </span>
            )}
            {parsedIntent.sub_category && (
              <span className='px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30'>
                Type: {parsedIntent.sub_category}
              </span>
            )}
            {parsedIntent.max_price && (
              <span className='px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'>
                Budget: &le; &euro;{parsedIntent.max_price}
              </span>
            )}
          </div>
        )}

        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='ui-card p-4'>
            <p className='text-sm font-semibold mb-3'>Pages</p>
            <div className='grid gap-2'>
              {filteredLinks.length === 0 ? (
                <p className='text-sm muted-text'>No page results</p>
              ) : (
                filteredLinks.slice(0, 6).map((link) => (
                  <button
                    key={link.path}
                    type='button'
                    onClick={() => openLink(link.path)}
                    className='ui-button-ghost text-left px-3 py-2 text-sm'
                  >
                    {link.label}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className='ui-card p-4'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-sm font-semibold'>
                {aiSearchResults ? 'AI Ranked Products' : 'Products'}
              </p>
              {aiSearchResults && (
                <span className='text-[10px] text-emerald-400 font-medium'>
                  {aiSearchResults.results?.length || 0} matches
                </span>
              )}
            </div>
            <div className='grid gap-2'>
              {displayedProducts.length === 0 ? (
                <p className='text-sm muted-text'>No product results found</p>
              ) : (
                displayedProducts.map((product) => {
                  const pId = product._id || product.id;
                  return (
                    <button
                      key={pId}
                      type='button'
                      onClick={() => openProduct(pId)}
                      className='ui-button-ghost text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:border-indigo-500/40'
                    >
                      <div className='truncate'>
                        <span className='font-medium'>{product.name}</span>
                        <span className='block text-xs muted-text'>
                          {product.category} &bull; &euro;{product.price}
                        </span>
                      </div>
                      <span className='text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded'>
                        View &rarr;
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
