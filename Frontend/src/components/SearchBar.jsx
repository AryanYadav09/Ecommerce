import { useContext, useMemo } from 'react';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';

const LINK_OPTIONS = [
  { label: 'Home', path: '/', keywords: ['home', 'main', 'landing'] },
  { label: 'Collection', path: '/collection', keywords: ['collection', 'shop', 'products'] },
  { label: 'About', path: '/about', keywords: ['about', 'company', 'story'] },
  { label: 'Contact', path: '/contact', keywords: ['contact', 'support', 'help'] },
  { label: 'Cart', path: '/cart', keywords: ['cart', 'checkout', 'bag'] },
  { label: 'Orders', path: '/orders', keywords: ['orders', 'order', 'tracking'], protected: true },
  { label: 'Profile', path: '/profile', keywords: ['profile', 'account', 'wishlist'], protected: true },
  { label: 'Login', path: '/login', keywords: ['login', 'signin', 'auth'] }
];

const SearchBar = () => {
  const { search, setSearch, showSearchBar, setShowSearchBar, products, navigate, token } = useContext(ShopContext);

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

  const filteredProducts = useMemo(() => {
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
          name.includes(normalizedSearch)
          || category.includes(normalizedSearch)
          || subCategory.includes(normalizedSearch)
        );
      })
      .slice(0, 6);
  }, [products, normalizedSearch]);

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
            placeholder='Search products, pages, orders, profile, and more'
          />
          <button
            onClick={handleCloseSearch}
            type='button'
            className='ui-button-ghost px-4 py-2 text-xs'
          >
            Close
          </button>
        </form>

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
            <p className='text-sm font-semibold mb-3'>Products</p>
            <div className='grid gap-2'>
              {filteredProducts.length === 0 ? (
                <p className='text-sm muted-text'>No product results</p>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    type='button'
                    onClick={() => openProduct(product._id)}
                    className='ui-button-ghost text-left px-3 py-2 text-sm flex items-center justify-between gap-2'
                  >
                    <span className='truncate'>{product.name}</span>
                    <span className='text-xs muted-text'>{product.category}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
