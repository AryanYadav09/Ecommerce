/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext.jsx';
import ProductItem from './ProductItem.jsx';
import Title from './Title.jsx';

const RelatedProduct = ({ category, subCategory }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) {
      setRelated([]);
      return;
    }

    const filteredProducts = products
      .filter((item) => item.category === category && item.subCategory === subCategory)
      .slice(0, 5);

    setRelated(filteredProducts);
  }, [products, category, subCategory]);

  if (related.length === 0) {
    return null;
  }

  return (
    <div className='my-24'>
      <div className='text-center text-3xl py-2'>
        <Title text1='RELATED' text2='PRODUCTS' />
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {related.map((item) => (
          <Link key={item._id} to={`/product/${item._id}`}>
            <ProductItem id={item._id} image={item.image} name={item.name} price={item.price} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProduct;
