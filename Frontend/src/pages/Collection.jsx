import { useContext, useMemo, useState } from 'react';
import { assets } from '../assets/assets';
import ProductItem from '../components/ProductItem';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';

const Collection = () => {
  const { products, search, showSearchBar } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(true);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavent');

  const normalizedSearch = search.trim().toLowerCase();

  const toggleCategory = (event) => {
    const { value } = event.target;
    setCategory((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  };

  const toggleSubCategory = (event) => {
    const { value } = event.target;
    setSubCategory((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  };

  const filteredProducts = useMemo(() => {
    let productsCopy = Array.isArray(products) ? [...products] : [];

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) => category.includes(item.category));
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) => subCategory.includes(item.subCategory));
    }

    if (showSearchBar && normalizedSearch) {
      productsCopy = productsCopy.filter((item) => item.name.toLowerCase().includes(normalizedSearch));
    }

    return productsCopy;
  }, [products, category, subCategory, showSearchBar, normalizedSearch]);

  const sortedProducts = useMemo(() => {
    const productsCopy = [...filteredProducts];

    switch (sortType) {
      case 'low-high':
        return productsCopy.sort((a, b) => a.price - b.price);
      case 'high-low':
        return productsCopy.sort((a, b) => b.price - a.price);
      default:
        return productsCopy;
    }
  }, [filteredProducts, sortType]);

  return (
    <div className='ui-section flex flex-col sm:flex-row gap-5 sm:gap-8 pt-10 border-t border-white/10'>
      <aside className='min-w-60'>
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          type='button'
          className='ui-button-ghost px-4 py-2 text-sm flex items-center gap-2'
        >
          FILTERS
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt='toggle' />
        </button>

        <div className={`${showFilter ? 'grid' : 'hidden'} sm:grid gap-4 mt-4`}>
          <div className='ui-card p-5'>
            <p className='mb-3 text-sm font-semibold'>CATEGORIES</p>
            <div className='flex flex-col gap-2 text-sm muted-text'>
              <label className='flex gap-2 items-center'><input className='w-3' type='checkbox' value='Men' onChange={toggleCategory} />Men</label>
              <label className='flex gap-2 items-center'><input className='w-3' type='checkbox' value='Women' onChange={toggleCategory} />Women</label>
              <label className='flex gap-2 items-center'><input className='w-3' type='checkbox' value='Kids' onChange={toggleCategory} />Kids</label>
            </div>
          </div>

          <div className='ui-card p-5'>
            <p className='mb-3 text-sm font-semibold'>TYPE</p>
            <div className='flex flex-col gap-2 text-sm muted-text'>
              <label className='flex gap-2 items-center'><input className='w-3' type='checkbox' value='Topwear' onChange={toggleSubCategory} />Topwear</label>
              <label className='flex gap-2 items-center'><input className='w-3' type='checkbox' value='Bottomwear' onChange={toggleSubCategory} />Bottomwear</label>
              <label className='flex gap-2 items-center'><input className='w-3' type='checkbox' value='Winterwear' onChange={toggleSubCategory} />Winterwear</label>
            </div>
          </div>
        </div>
      </aside>

      <section className='flex-1'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5'>
          <Title text1='ALL' text2='COLLECTION' />
          <select onChange={(event) => setSortType(event.target.value)} className='ui-input rounded-full text-sm px-4 py-2 w-full sm:w-auto'>
            <option value='relavent'>Sort by: Relevant</option>
            <option value='low-high'>Sort by: Low to High</option>
            <option value='high-low'>Sort by: High to Low</option>
          </select>
        </div>

        <div className='stagger-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
          {sortedProducts.map((item) => (
            <ProductItem
              key={item._id}
              name={item.name}
              id={item._id}
              price={item.price}
              image={item.image}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Collection;
