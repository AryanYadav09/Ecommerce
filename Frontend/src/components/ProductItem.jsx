/* eslint-disable react/prop-types */
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const ProductItem = ({ id, name, image, price }) => {
  const { currency } = useContext(ShopContext);

  return (
    <Link className='ui-card block p-3 text-inherit' to={`/product/${id}`}>
      <div className='ui-media rounded-xl'>
        <img className='w-full aspect-[3/4] object-cover' src={image[0]} alt={name} />
      </div>
      <p className='pt-3 text-sm sm:text-base font-medium'>{name}</p>
      <p className='pt-1 text-sm muted-text'>{currency}{price}</p>
    </Link>
  );
};

export default ProductItem;
