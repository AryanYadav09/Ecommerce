/* eslint-disable react/prop-types */
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { getOptimizedImageUrl } from '../utils/imageOptimizer.js';

const ProductItem = ({ id, name, image, price }) => {
  const { currency } = useContext(ShopContext);
  const imageUrl = Array.isArray(image) ? image[0] : image;
  const optimizedSrc = getOptimizedImageUrl(imageUrl, { width: 420 });

  return (
    <Link className='ui-card block p-3 text-inherit' to={`/product/${id}`}>
      <div className='ui-media rounded-xl'>
        <img
          className='w-full aspect-[3/4] object-cover'
          src={optimizedSrc}
          alt={name}
          loading='lazy'
          decoding='async'
          width='300'
          height='400'
        />
      </div>
      <p className='pt-3 text-sm sm:text-base font-medium'>{name}</p>
      <p className='pt-1 text-sm muted-text'>{currency}{price}</p>
    </Link>
  );
};

export default ProductItem;
